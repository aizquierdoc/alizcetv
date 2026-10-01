// Secure context bridge between renderer (React) and main (Node/Electron).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("alizce", {
  isElectron: true,

  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    set: (patch) => ipcRenderer.invoke("settings:set", patch),
    pickFile: (opts) => ipcRenderer.invoke("settings:pickFile", opts || {}),
  },

  smb: {
    listShare: (share) => ipcRenderer.invoke("smb:listShare", share),
    listFolder: (share, folder) => ipcRenderer.invoke("smb:listFolder", { share, folder }),
  },

  cw: {
    get: () => ipcRenderer.invoke("cw:get"),
    upsert: (entry) => ipcRenderer.invoke("cw:upsert", entry),
  },

  coinops: {
    launch: () => ipcRenderer.invoke("coinops:launch"),
  },

  mpv: {
    play: (opts) => ipcRenderer.invoke("mpv:play", opts),
    command: (cmd) => ipcRenderer.invoke("mpv:command", cmd),
    stop: () => ipcRenderer.invoke("mpv:stop"),
    onEvent: (cb) => {
      const handler = (_e, msg) => cb(msg);
      ipcRenderer.on("mpv:event", handler);
      return () => ipcRenderer.removeListener("mpv:event", handler);
    },
  },

  shell: {
    open: (path) => ipcRenderer.invoke("shell:open", path),
  },
});
