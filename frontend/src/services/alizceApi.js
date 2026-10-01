// Service layer: wraps window.alizce (Electron) with graceful mock fallback.
// Works both inside AlizceTV.exe and in the web preview.

import {
  continueWatching as mockCW,
  folderContents,
  networkFolders as mockNetworkFolders,
  DEMO_VIDEO,
} from "../data/mockData";

const api = typeof window !== "undefined" ? window.alizce : null;
export const isElectron = !!api?.isElectron;

// ----- Settings -----
export const settingsService = {
  async get() {
    if (api) return api.settings.get();
    return {
      smbHost: "192.168.1.200",
      smbShares: ["Peliculas", "Series", "Descargas"],
      coinopsPath: "",
      mpvPath: "",
    };
  },
  async set(patch) {
    if (api) return api.settings.set(patch);
    return patch;
  },
  async pickFile(opts) {
    if (api) return api.settings.pickFile(opts);
    alert("Selección de archivos solo disponible en la app de Windows.");
    return null;
  },
};

// ----- SMB / Network -----
export const smbService = {
  async listShares() {
    if (api) {
      const s = await settingsService.get();
      return (s.smbShares || []).map((share) => ({
        id: `net-${share.toLowerCase()}`,
        name: share,
        share,
        path: `\\\\${s.smbHost}\\${share}`,
      }));
    }
    // Mock
    return mockNetworkFolders.map((f) => ({
      id: f.id,
      name: f.name,
      share: f.name,
      path: f.path,
      cover: f.cover,
      count: f.count,
    }));
  },

  async listFolder(share, folder = "") {
    if (api) {
      const res = await api.smb.listFolder(share, folder);
      if (res.error) return { error: res.error, items: [] };
      return { items: res.items };
    }
    // Mock: match share name to legacy folder id
    const id =
      share.toLowerCase().includes("pel") ? "net-peliculas" :
      share.toLowerCase().includes("ser") ? "net-series" :
      "net-descargas";
    const items = (folderContents[id] || []).map((it) => ({
      name: `${it.title}.mkv`,
      path: `${it.title}.mkv`,
      isVideo: true,
      mockMeta: it,
    }));
    return { items };
  },
};

// ----- Continue Watching -----
export const cwService = {
  async get() {
    if (api) {
      const list = await api.cw.get();
      return list.slice(0, 3);
    }
    return mockCW;
  },
  async save(entry) {
    if (api) return api.cw.upsert(entry);
    return [entry];
  },
};

// ----- Streaming platforms -----
export const platformService = {
  async list() {
    if (api) return api.platform.list();
    // Mock list (same as streamingPlatforms)
    const { streamingPlatforms } = await import("../data/mockData");
    return streamingPlatforms.map((p) => ({
      id: p.id,
      label: p.label,
      web: p.url,
      hasUwp: !["hbo", "youtube", "filmin"].includes(p.id),
      mode: ["hbo", "youtube", "filmin"].includes(p.id) ? "cinema" : "uwp",
    }));
  },
  async launch(id) {
    if (api) return api.platform.launch(id);
    // Web demo fallback: open the official web URL in a new tab.
    const { streamingPlatforms } = await import("../data/mockData");
    const p = streamingPlatforms.find((x) => x.id === id);
    if (p) window.open(p.url, "_blank", "noopener");
    return { ok: true, mode: "external" };
  },
  async setMode(id, mode) {
    if (api) return api.platform.setMode(id, mode);
    return { id, mode };
  },
};

// ----- CoinOps -----
export const coinopsService = {
  async launch() {
    if (api) {
      const res = await api.coinops.launch();
      if (res.error) {
        alert(res.error);
        return false;
      }
      return true;
    }
    alert("Lanzamiento de CoinOps solo disponible en la app de Windows.");
    return false;
  },
};

// ----- MPV player -----
export const mpvService = {
  async play(opts) {
    if (api) return api.mpv.play(opts);
    return { error: "no-electron" };
  },
  async stop() {
    if (api) return api.mpv.stop();
  },
  async command(cmd) {
    if (api) return api.mpv.command(cmd);
  },
  onEvent(cb) {
    if (api) return api.mpv.onEvent(cb);
    return () => {};
  },
  // Convenience
  async setPause(pause) { return this.command(["set_property", "pause", pause]); },
  async seek(seconds) { return this.command(["seek", seconds, "relative"]); },
  async setAid(id) { return this.command(["set_property", "aid", id]); },
  async setSid(id) { return this.command(["set_property", "sid", id]); },
  async setAspect(ratio) {
    const map = { "16:9": "16:9", "4:3": "4:3", "21:9": "21:9", fit: "-1", stretch: "-1", zoom: "-2" };
    return this.command(["set_property", "video-aspect-override", map[ratio] ?? "-1"]);
  },
};

// Expose the mock demo video for web preview fallback
export const DEMO_VIDEO_URL = DEMO_VIDEO;
