// AlizceTV — Electron main process
// Window, IPC bridge for SMB listing, settings, CoinOps launch, MPV control.

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");
const Store = require("electron-store");
const SMB2 = require("@marsaud/smb2");
const PLATFORMS = require("./platforms");

const isDev = process.argv.includes("--dev");

// Settings (persisted at %APPDATA%\AlizceTV\config.json)
const store = new Store({
  name: "config",
  defaults: {
    smbHost: "192.168.1.200",
    smbShares: ["Peliculas", "Series", "Descargas"],
    smbUser: "guest",
    smbPassword: "",
    coinopsPath: "",
    mpvPath: "",
    continueWatching: [],
    platformModes: {}, // { netflix: 'uwp'|'cinema'|'external', ... }
  },
});

let mainWindow = null;
let mpvProc = null;
let mpvIpcSocket = null;
let mpvRequestId = 1;
const mpvPending = new Map();

// -------- Window --------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    frame: true,
    backgroundColor: "#05070D",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  const indexPath = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "..", "renderer", "index.html")}`;
  mainWindow.loadURL(indexPath);

  // Open external URLs (streaming platforms) in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  killMpv();
  if (process.platform !== "darwin") app.quit();
});

// ---------- Settings ----------
ipcMain.handle("settings:get", () => store.store);
ipcMain.handle("settings:set", (_e, patch) => {
  for (const [k, v] of Object.entries(patch)) store.set(k, v);
  return store.store;
});
ipcMain.handle("settings:pickFile", async (_e, { title, filters }) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: title || "Seleccionar archivo",
    properties: ["openFile"],
    filters: filters || [{ name: "Ejecutables", extensions: ["exe"] }],
  });
  return res.canceled ? null : res.filePaths[0];
});

// ---------- SMB ----------
function makeSmb(share) {
  const host = store.get("smbHost");
  const user = store.get("smbUser") || "guest";
  const password = store.get("smbPassword") || "";
  return new SMB2({
    share: `\\\\${host}\\${share}`,
    domain: "WORKGROUP",
    username: user,
    password,
  });
}

ipcMain.handle("smb:listShare", async (_e, share) => {
  const smb = makeSmb(share);
  return new Promise((resolve) => {
    smb.readdir("", (err, files) => {
      smb.disconnect?.();
      if (err) return resolve({ error: err.message, files: [] });
      resolve({ files: files || [] });
    });
  });
});

ipcMain.handle("smb:listFolder", async (_e, { share, folder }) => {
  const smb = makeSmb(share);
  return new Promise((resolve) => {
    smb.readdir(folder || "", (err, files) => {
      if (err) {
        smb.disconnect?.();
        return resolve({ error: err.message, items: [] });
      }
      // Mark folders vs files (SMB2 lib: use stat per item)
      const items = (files || []).map((name) => ({
        name,
        path: folder ? `${folder}\\${name}` : name,
        isVideo: /\.(mkv|mp4|avi|mov|m4v|wmv|ts|webm)$/i.test(name),
      }));
      smb.disconnect?.();
      resolve({ items });
    });
  });
});

// ---------- Continue Watching persistence ----------
ipcMain.handle("cw:get", () => store.get("continueWatching") || []);
ipcMain.handle("cw:upsert", (_e, entry) => {
  const list = store.get("continueWatching") || [];
  const idx = list.findIndex((x) => x.path === entry.path);
  const now = Date.now();
  const next = { ...entry, updatedAt: now };
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(next);
  const trimmed = list.slice(0, 10);
  store.set("continueWatching", trimmed);
  return trimmed;
});

// ---------- CoinOps launcher ----------
ipcMain.handle("coinops:launch", async () => {
  const exe = store.get("coinopsPath");
  if (!exe || !fs.existsSync(exe)) {
    return { error: "Ruta a CoinOps.exe no configurada. Ve a Ajustes." };
  }
  spawn(exe, [], { detached: true, stdio: "ignore", cwd: path.dirname(exe) }).unref();
  return { ok: true };
});

// ---------- MPV player (embedded via IPC pipe) ----------
function resolveMpvPath() {
  const configured = store.get("mpvPath");
  if (configured && fs.existsSync(configured)) return configured;
  const bundled = path.join(process.resourcesPath || __dirname, "mpv", "mpv.exe");
  if (fs.existsSync(bundled)) return bundled;
  return null;
}

function killMpv() {
  try { mpvIpcSocket?.destroy(); } catch (_) {}
  try { mpvProc?.kill(); } catch (_) {}
  mpvIpcSocket = null;
  mpvProc = null;
  mpvPending.clear();
}

function connectMpvIpc(pipeName) {
  return new Promise((resolve, reject) => {
    const tryConnect = (attemptsLeft) => {
      const socket = net.createConnection(pipeName);
      socket.setEncoding("utf8");
      let buffer = "";
      socket.on("connect", () => {
        mpvIpcSocket = socket;
        resolve(socket);
      });
      socket.on("data", (chunk) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.request_id && mpvPending.has(msg.request_id)) {
              mpvPending.get(msg.request_id)(msg);
              mpvPending.delete(msg.request_id);
            }
            if (msg.event && mainWindow) {
              mainWindow.webContents.send("mpv:event", msg);
            }
          } catch (_) {}
        }
      });
      socket.on("error", () => {
        socket.destroy();
        if (attemptsLeft > 0) setTimeout(() => tryConnect(attemptsLeft - 1), 150);
        else reject(new Error("No se pudo conectar al IPC de MPV"));
      });
      socket.on("close", () => {
        if (mpvIpcSocket === socket) mpvIpcSocket = null;
      });
    };
    tryConnect(20);
  });
}

function mpvSend(command) {
  return new Promise((resolve) => {
    if (!mpvIpcSocket) return resolve({ error: "mpv-not-running" });
    const id = mpvRequestId++;
    mpvPending.set(id, resolve);
    mpvIpcSocket.write(JSON.stringify({ command, request_id: id }) + "\n");
  });
}

ipcMain.handle("mpv:play", async (_e, { smbPath, share, folder, title }) => {
  const exe = resolveMpvPath();
  if (!exe) return { error: "mpv.exe no encontrado. Configúralo en Ajustes." };

  killMpv();

  // Build UNC path: \\host\share\folder\file  (smbPath already a server-side relative)
  const host = store.get("smbHost");
  const unc = `\\\\${host}\\${share}\\${(folder || "").replace(/\//g, "\\")}`;
  const pipeName = "\\\\.\\pipe\\alizcetv-mpv";

  const args = [
    unc,
    `--input-ipc-server=${pipeName}`,
    "--fullscreen",
    "--force-window=yes",
    "--ontop",
    "--border=no",
    "--osd-level=1",
    "--hr-seek=yes",
    `--title=${title || "AlizceTV"}`,
  ];

  mpvProc = spawn(exe, args, { detached: false, stdio: "ignore" });
  mpvProc.on("exit", () => {
    killMpv();
    mainWindow?.webContents.send("mpv:event", { event: "end-file" });
    mainWindow?.focus();
  });

  try {
    await connectMpvIpc(pipeName);
    // Observe common props
    await mpvSend(["observe_property", 1, "time-pos"]);
    await mpvSend(["observe_property", 2, "duration"]);
    await mpvSend(["observe_property", 3, "pause"]);
    await mpvSend(["observe_property", 4, "track-list"]);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle("mpv:command", async (_e, command) => mpvSend(command));
ipcMain.handle("mpv:stop", async () => { killMpv(); return { ok: true }; });

// Open file externally (fallback)
ipcMain.handle("shell:open", async (_e, p) => shell.openPath(p));

// ---------- Streaming platform launcher ----------
let cinemaWindow = null;

function openCinema(url, label) {
  if (cinemaWindow) { try { cinemaWindow.close(); } catch (_) {} cinemaWindow = null; }
  cinemaWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    backgroundColor: "#000000",
    title: `AlizceTV — ${label}`,
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  cinemaWindow.setMenuBarVisibility(false);
  cinemaWindow.loadURL(url, { userAgent:
    "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36"
  });
  // ESC / Backspace / Gamepad B closes cinema and returns to AlizceTV
  cinemaWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && (input.key === "Escape" || input.key === "Backspace")) {
      try { cinemaWindow.close(); } catch (_) {}
    }
  });
  cinemaWindow.on("closed", () => {
    cinemaWindow = null;
    mainWindow?.focus();
  });
}

ipcMain.handle("platform:launch", async (_e, id) => {
  const def = PLATFORMS[id];
  if (!def) return { error: `Plataforma desconocida: ${id}` };
  const overrides = store.get("platformModes") || {};
  let mode = overrides[id] || def.defaultMode;
  // Fallback if user chose UWP but platform has no protocol
  if (mode === "uwp" && !def.protocol) mode = "cinema";

  try {
    if (mode === "uwp") {
      // Attempt protocol launch. On Windows if the app isn't installed,
      // Windows shows a dialog "Open with"; we fallback to cinema in 2s.
      shell.openExternal(def.protocol);
      return { ok: true, mode };
    }
    if (mode === "external") {
      shell.openExternal(def.web);
      return { ok: true, mode };
    }
    // cinema
    openCinema(def.web, def.label);
    return { ok: true, mode };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle("platform:list", () => {
  const overrides = store.get("platformModes") || {};
  return Object.entries(PLATFORMS).map(([id, def]) => ({
    id,
    label: def.label,
    web: def.web,
    hasUwp: def.hasUwp,
    mode: overrides[id] || def.defaultMode,
  }));
});

ipcMain.handle("platform:setMode", (_e, { id, mode }) => {
  const modes = store.get("platformModes") || {};
  modes[id] = mode;
  store.set("platformModes", modes);
  return modes;
});
