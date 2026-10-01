// AlizceTV — Electron main process
// Window, IPC bridge for SMB listing, settings, CoinOps launch, MPV control.

const { app, BrowserWindow, ipcMain, dialog, shell, protocol, session, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const net = require("net");
const Store = require("electron-store");
const SMB2 = require("@marsaud/smb2");
const PLATFORMS = require("./platforms");
const { TmdbClient } = require("./tmdb");
const { installAdBlocker } = require("./adblock");
const { loadSource } = require("./iptv");

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
    platformModes: {},
    tmdbApiKey: "",
    lastScanAt: null,
    buttonMap: null,  // user-configured gamepad buttons; null => defaults
    iptvSources: [],  // array of { id, name, type: 'm3u'|'xtream', url?, host?, user?, pass? }
    iptvCache: {},    // sourceId -> { fetchedAt, channels: [...] }
    coinopsBoost: true, // minimize AlizceTV + set CoinOps high priority
    youtubeDownloads: "", // output dir for yt-dlp
    adBlock: true,    // enable Youtube/HBO cinema ad blocking
  },
});

let mainWindow = null;
let mpvProc = null;
let mpvIpcSocket = null;
let mpvRequestId = 1;
const mpvPending = new Map();

// TMDB client (initialized on app ready, re-keyed when user changes API key)
let tmdb = null;
let scanRunning = false;

// -------- Window --------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    frame: false,
    fullscreen: true,
    fullscreenable: true,
    backgroundColor: "#05070D",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.setFullScreen(true);
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  const indexPath = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "..", "renderer", "index.html")}`;
  mainWindow.loadURL(indexPath);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Disable Alt+F4 and other exit shortcuts — exit only via in-app button
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.minimize(); }
  });
}

app.whenReady().then(() => {
  // Initialize TMDB client with user cache dir
  const cacheDir = path.join(app.getPath("userData"));
  tmdb = new TmdbClient({ apiKey: store.get("tmdbApiKey") || "", cacheDir });

  // Custom protocol to serve locally cached TMDB posters securely
  protocol.registerFileProtocol("alizceposter", (request, callback) => {
    const url = request.url.replace(/^alizceposter:\/\//, "");
    const safe = url.replace(/[^a-z0-9._-]/gi, "_");
    callback({ path: path.join(cacheDir, "posters", safe) });
  });

  createWindow();
  setTimeout(() => { if (store.get("tmdbApiKey")) runFullScan(false).catch(() => {}); }, 3000);
});
app.on("window-all-closed", () => {
  killMpv();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => { app.isQuitting = true; });

// ---------- System window actions ----------
ipcMain.handle("system:minimize", () => { mainWindow?.minimize(); return { ok: true }; });
ipcMain.handle("system:close", () => { app.isQuitting = true; app.quit(); return { ok: true }; });
ipcMain.handle("system:shutdown", () => {
  // Shutdown Windows: shutdown /s /t 5 (5 second delay to allow abort via shutdown /a)
  if (process.platform === "win32") {
    spawn("shutdown", ["/s", "/t", "5", "/c", "AlizceTV: apagando el equipo"], { detached: true, stdio: "ignore" }).unref();
  }
  return { ok: true };
});
ipcMain.handle("system:cancelShutdown", () => {
  if (process.platform === "win32") {
    spawn("shutdown", ["/a"], { detached: true, stdio: "ignore" }).unref();
  }
  return { ok: true };
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
      const items = (files || []).map((name) => {
        const isVideo = /\.(mkv|mp4|avi|mov|m4v|wmv|ts|webm)$/i.test(name);
        const base = { name, path: folder ? `${folder}\\${name}` : name, isVideo };
        // Attach TMDB metadata if cached
        if (isVideo && tmdb) {
          const cached = tmdb.getCached(name);
          if (cached && !cached.notFound && !cached.error) {
            const posterFile = cached.localPoster ? path.basename(cached.localPoster) : null;
            base.tmdb = {
              title: cached.title,
              year: cached.year,
              overview: cached.overview,
              rating: cached.rating,
              genres: cached.genres,
              poster: posterFile ? `alizceposter://${posterFile}` : cached.posterUrl,
              backdrop: cached.backdropUrl,
            };
          }
        }
        return base;
      });
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

// ---------- CoinOps launcher (with resource boost for N100) ----------
ipcMain.handle("coinops:launch", async () => {
  const exe = store.get("coinopsPath");
  if (!exe || !fs.existsSync(exe)) {
    return { error: "Ruta a CoinOps.exe no configurada. Ve a Ajustes." };
  }
  const boost = store.get("coinopsBoost");
  if (boost) {
    // Minimize AlizceTV + unload MPV to free up CPU/GPU/RAM.
    killMpv();
    mainWindow?.minimize();
  }
  // Launch CoinOps with HIGH priority on Windows to give arcades the full N100.
  if (process.platform === "win32") {
    spawn("cmd.exe",
      ["/c", "start", "/HIGH", "/B", "", `"${exe}"`],
      { detached: true, stdio: "ignore", cwd: path.dirname(exe), shell: false, windowsVerbatimArguments: true }
    ).unref();
  } else {
    spawn(exe, [], { detached: true, stdio: "ignore", cwd: path.dirname(exe) }).unref();
  }
  return { ok: true, boosted: !!boost };
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
    // N100 / LG 4K TV optimisations
    "--vo=gpu-next",
    "--gpu-api=d3d11",
    "--hwdec=auto-safe",
    "--profile=gpu-hq",
    "--video-sync=display-resample",
    "--interpolation=yes",
    "--tscale=oversample",
    "--d3d11-adapter=",
    "--audio-channels=auto-safe",
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

// Play ANY URL (IPTV, YouTube-dl'd streams, radio, etc.) via MPV
ipcMain.handle("mpv:playUrl", async (_e, { url, title }) => {
  const exe = resolveMpvPath();
  if (!exe) return { error: "mpv.exe no encontrado. Configúralo en Ajustes." };
  killMpv();
  const pipeName = "\\\\.\\pipe\\alizcetv-mpv";
  const args = [
    url,
    `--input-ipc-server=${pipeName}`,
    "--fullscreen",
    "--force-window=yes",
    "--ontop",
    "--border=no",
    "--osd-level=1",
    "--hr-seek=yes",
    "--vo=gpu-next",
    "--gpu-api=d3d11",
    "--hwdec=auto-safe",
    "--profile=gpu-hq",
    "--cache=yes",
    "--demuxer-max-bytes=200M",
    "--demuxer-readahead-secs=20",
    `--title=${title || "AlizceTV"}`,
  ];
  mpvProc = spawn(exe, args, { detached: false, stdio: "ignore" });
  mpvProc.on("exit", () => { killMpv(); mainWindow?.webContents.send("mpv:event", { event: "end-file" }); mainWindow?.focus(); });
  try {
    await connectMpvIpc(pipeName);
    await mpvSend(["observe_property", 1, "time-pos"]);
    await mpvSend(["observe_property", 2, "duration"]);
    await mpvSend(["observe_property", 3, "pause"]);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
});

// ---------- IPTV ----------
function iptvId() { return `iptv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

ipcMain.handle("iptv:listSources", () => store.get("iptvSources") || []);

ipcMain.handle("iptv:addSource", (_e, src) => {
  const sources = store.get("iptvSources") || [];
  const id = iptvId();
  const next = { id, name: src.name || "Lista sin nombre", ...src };
  sources.push(next);
  store.set("iptvSources", sources);
  return next;
});

ipcMain.handle("iptv:removeSource", (_e, id) => {
  const sources = (store.get("iptvSources") || []).filter((s) => s.id !== id);
  store.set("iptvSources", sources);
  const cache = store.get("iptvCache") || {};
  delete cache[id];
  store.set("iptvCache", cache);
  return sources;
});

ipcMain.handle("iptv:refresh", async (_e, id) => {
  const sources = store.get("iptvSources") || [];
  const src = sources.find((s) => s.id === id);
  if (!src) return { error: "Fuente no encontrada" };
  try {
    const channels = await loadSource(src);
    const cache = store.get("iptvCache") || {};
    cache[id] = { fetchedAt: Date.now(), channels };
    store.set("iptvCache", cache);
    return { ok: true, count: channels.length };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle("iptv:getChannels", (_e, id) => {
  const cache = store.get("iptvCache") || {};
  return cache[id]?.channels || [];
});

// Open file externally (fallback)
ipcMain.handle("shell:open", async (_e, p) => shell.openPath(p));

// ---------- Streaming platform launcher ----------
let cinemaWindow = null;

function openCinema(url, label, options = {}) {
  if (cinemaWindow) { try { cinemaWindow.close(); } catch (_) {} cinemaWindow = null; }
  const partition = `persist:cinema-${label.toLowerCase().replace(/\s/g, "-")}`;
  const sess = session.fromPartition(partition);
  if (store.get("adBlock")) installAdBlocker(sess);

  cinemaWindow = new BrowserWindow({
    width: 1920, height: 1080,
    fullscreen: true, frame: false,
    backgroundColor: "#000000",
    title: `AlizceTV — ${label}`,
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    webPreferences: {
      contextIsolation: true, nodeIntegration: false,
      partition,
      backgroundThrottling: false,
    },
  });
  cinemaWindow.setMenuBarVisibility(false);
  cinemaWindow.loadURL(url, { userAgent:
    "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36"
  });

  cinemaWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && (input.key === "Escape" || input.key === "Backspace")) {
      try { cinemaWindow.close(); } catch (_) {}
    }
  });

  if (options.withYtDlp) {
    cinemaWindow.webContents.on("did-finish-load", () => injectYtDlpOverlay());
  }

  cinemaWindow.on("closed", () => { cinemaWindow = null; mainWindow?.focus(); });
}

function injectYtDlpOverlay() {
  if (!cinemaWindow) return;
  const js = `
    (function(){
      if (document.getElementById('alizce-ytdlp-overlay')) return;
      const box = document.createElement('div');
      box.id = 'alizce-ytdlp-overlay';
      box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;align-items:flex-end;font-family:system-ui,sans-serif;';
      box.innerHTML = '<button id="alizce-dl-btn" style="padding:10px 16px;background:rgba(10,12,20,0.9);color:#67e8f9;border:1px solid rgba(103,232,249,0.5);border-radius:999px;cursor:pointer;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;backdrop-filter:blur(12px);box-shadow:0 10px 30px rgba(0,0,0,0.6);">&#8595; Descargar video</button>' +
      '<div id="alizce-dl-menu" style="display:none;flex-direction:column;background:rgba(10,12,20,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:6px;backdrop-filter:blur(12px);">' +
      '<a data-q="best" href="#" style="padding:8px 14px;color:#fff;text-decoration:none;font-size:12px;">Mejor calidad</a>' +
      '<a data-q="1080" href="#" style="padding:8px 14px;color:#fff;text-decoration:none;font-size:12px;">1080p MP4</a>' +
      '<a data-q="720" href="#" style="padding:8px 14px;color:#fff;text-decoration:none;font-size:12px;">720p MP4</a>' +
      '<a data-q="audio" href="#" style="padding:8px 14px;color:#fff;text-decoration:none;font-size:12px;">Solo audio MP3</a>' +
      '</div><div id="alizce-dl-status" style="font-size:11px;color:#94a3b8;max-width:360px;text-align:right;"></div>';
      document.body.appendChild(box);
      const btn = document.getElementById('alizce-dl-btn');
      const menu = document.getElementById('alizce-dl-menu');
      btn.onclick = () => { menu.style.display = menu.style.display === 'none' ? 'flex' : 'none'; };
      menu.querySelectorAll('a').forEach(function(b){
        b.onclick = function(ev){
          ev.preventDefault();
          const q = b.dataset.q;
          menu.style.display = 'none';
          const payload = encodeURIComponent(JSON.stringify({ url: location.href, quality: q }));
          window.open('alizce-dl://' + payload, '_blank');
        };
      });
    })();
  `;
  cinemaWindow.webContents.executeJavaScript(js).catch(() => {});
}

function resolveYtDlpPath() {
  const bundled = path.join(process.resourcesPath || path.join(__dirname, ".."), "ytdlp", "yt-dlp.exe");
  if (fs.existsSync(bundled)) return bundled;
  const bundledAlt = path.join(__dirname, "..", "vendor", "ytdlp", "yt-dlp.exe");
  if (fs.existsSync(bundledAlt)) return bundledAlt;
  return null;
}

function startYtDlp(url, quality) {
  const exe = resolveYtDlpPath();
  if (!exe) {
    cinemaWindow?.webContents.executeJavaScript(
      "var s=document.getElementById('alizce-dl-status'); if(s) s.textContent='yt-dlp.exe no encontrado. Copialo a electron\\\\vendor\\\\ytdlp\\\\';"
    ).catch(() => {});
    return;
  }
  const outDir = store.get("youtubeDownloads") || path.join(app.getPath("videos"), "AlizceTV");
  fs.mkdirSync(outDir, { recursive: true });
  const argMap = {
    best:  ["-f", "bv*+ba/b", "--merge-output-format", "mp4"],
    "1080":["-f", "bv*[height<=1080]+ba/b[height<=1080]", "--merge-output-format", "mp4"],
    "720": ["-f", "bv*[height<=720]+ba/b[height<=720]", "--merge-output-format", "mp4"],
    audio: ["-x", "--audio-format", "mp3"],
  };
  const args = [
    ...(argMap[quality] || argMap.best),
    "-o", path.join(outDir, "%(title)s.%(ext)s"),
    url,
  ];
  const proc = spawn(exe, args, { stdio: ["ignore", "pipe", "pipe"] });
  const updateStatus = (text) => {
    const safe = text.toString().replace(/[\n'`\\]/g, " ").slice(-120);
    cinemaWindow?.webContents.executeJavaScript(
      `(function(){ var s=document.getElementById('alizce-dl-status'); if(s) s.textContent='${safe}'; })();`
    ).catch(() => {});
  };
  proc.stdout?.on("data", updateStatus);
  proc.stderr?.on("data", updateStatus);
  proc.on("exit", (code) => {
    updateStatus(code === 0 ? "✓ Descarga completada en " + outDir : "✗ Error (código " + code + ")");
  });
}

// Register alizce-dl:// protocol handler for the yt-dlp overlay
app.on("web-contents-created", (_e, contents) => {
  contents.setWindowOpenHandler((details) => {
    const u = details.url;
    if (u.startsWith("alizce-dl://")) {
      try {
        const payload = JSON.parse(decodeURIComponent(u.replace(/^alizce-dl:\/\//, "")));
        startYtDlp(payload.url, payload.quality);
      } catch (_) {}
      return { action: "deny" };
    }
    return { action: "allow" };
  });
});

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
    openCinema(def.web, def.label, { withYtDlp: id === "youtube" });
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

// ---------- TMDB catalog ----------
async function listAllVideosInShare(share) {
  // Recursively list up to depth 2 to grab Peliculas/*.mkv and Series/*/*/*.mkv
  const files = [];
  const walk = (folder, depth) => new Promise((resolve) => {
    const smb = makeSmb(share);
    smb.readdir(folder || "", (err, entries) => {
      smb.disconnect?.();
      if (err || !entries) return resolve();
      Promise.all(entries.map(async (name) => {
        const full = folder ? `${folder}\\${name}` : name;
        if (/\.(mkv|mp4|avi|mov|m4v|wmv|ts|webm)$/i.test(name)) {
          files.push({ share, folder: full, name });
        } else if (depth < 2 && !/\.[a-z0-9]{2,4}$/i.test(name)) {
          await walk(full, depth + 1);
        }
      })).then(resolve);
    });
  });
  await walk("", 0);
  return files;
}

async function runFullScan(sendProgress = true) {
  if (scanRunning) return { error: "Ya hay un escaneo en curso" };
  if (!tmdb || !store.get("tmdbApiKey")) return { error: "Configura la API Key de TMDB en Ajustes" };
  scanRunning = true;
  mainWindow?.webContents.send("tmdb:scan-start");
  try {
    const shares = store.get("smbShares") || [];
    let allFiles = [];
    for (const share of shares) {
      try {
        const files = await listAllVideosInShare(share);
        allFiles = allFiles.concat(files);
      } catch (e) {
        mainWindow?.webContents.send("tmdb:scan-error", { share, error: e.message });
      }
    }
    const filenames = allFiles.map((f) => f.name);
    const results = await tmdb.scanFiles(filenames, ({ done, total, file }) => {
      if (sendProgress) mainWindow?.webContents.send("tmdb:scan-progress", { done, total, file });
    });
    store.set("lastScanAt", Date.now());
    mainWindow?.webContents.send("tmdb:scan-complete", {
      total: filenames.length,
      resolved: results.filter((r) => r.info && !r.info.notFound).length,
    });
    return { ok: true, total: filenames.length, resolved: results.length };
  } catch (e) {
    mainWindow?.webContents.send("tmdb:scan-error", { error: e.message });
    return { error: e.message };
  } finally {
    scanRunning = false;
  }
}

ipcMain.handle("tmdb:setApiKey", (_e, key) => {
  store.set("tmdbApiKey", key || "");
  tmdb?.setApiKey(key || "");
  return { ok: true };
});

ipcMain.handle("tmdb:scan", async () => runFullScan(true));

ipcMain.handle("tmdb:lookup", async (_e, filename) => {
  if (!tmdb) return null;
  return tmdb.lookup(filename);
});

ipcMain.handle("tmdb:getCached", (_e, filename) => {
  if (!tmdb) return null;
  return tmdb.getCached(filename);
});

ipcMain.handle("tmdb:status", () => ({
  hasKey: !!store.get("tmdbApiKey"),
  lastScanAt: store.get("lastScanAt") || null,
  running: scanRunning,
}));
