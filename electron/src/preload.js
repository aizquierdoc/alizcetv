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
    playUrl: (opts) => ipcRenderer.invoke("mpv:playUrl", opts),
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

  system: {
    minimize: () => ipcRenderer.invoke("system:minimize"),
    close: () => ipcRenderer.invoke("system:close"),
    shutdown: () => ipcRenderer.invoke("system:shutdown"),
    cancelShutdown: () => ipcRenderer.invoke("system:cancelShutdown"),
  },

  iptv: {
    listSources: () => ipcRenderer.invoke("iptv:listSources"),
    addSource: (src) => ipcRenderer.invoke("iptv:addSource", src),
    removeSource: (id) => ipcRenderer.invoke("iptv:removeSource", id),
    refresh: (id) => ipcRenderer.invoke("iptv:refresh", id),
    getChannels: (id) => ipcRenderer.invoke("iptv:getChannels", id),
  },

  platform: {
    list: () => ipcRenderer.invoke("platform:list"),
    launch: (id) => ipcRenderer.invoke("platform:launch", id),
    setMode: (id, mode) => ipcRenderer.invoke("platform:setMode", { id, mode }),
  },

  tmdb: {
    setApiKey: (key) => ipcRenderer.invoke("tmdb:setApiKey", key),
    scan: () => ipcRenderer.invoke("tmdb:scan"),
    lookup: (filename) => ipcRenderer.invoke("tmdb:lookup", filename),
    getCached: (filename) => ipcRenderer.invoke("tmdb:getCached", filename),
    status: () => ipcRenderer.invoke("tmdb:status"),
    onProgress: (cb) => {
      const start = () => cb({ type: "start" });
      const prog = (_e, data) => cb({ type: "progress", ...data });
      const done = (_e, data) => cb({ type: "complete", ...data });
      const err = (_e, data) => cb({ type: "error", ...data });
      ipcRenderer.on("tmdb:scan-start", start);
      ipcRenderer.on("tmdb:scan-progress", prog);
      ipcRenderer.on("tmdb:scan-complete", done);
      ipcRenderer.on("tmdb:scan-error", err);
      return () => {
        ipcRenderer.removeListener("tmdb:scan-start", start);
        ipcRenderer.removeListener("tmdb:scan-progress", prog);
        ipcRenderer.removeListener("tmdb:scan-complete", done);
        ipcRenderer.removeListener("tmdb:scan-error", err);
      };
    },
  },
});
