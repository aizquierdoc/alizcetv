// AlizceTV service layer — abstracts Electron APIs with mock fallback.
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
      buttonMap: null,
      coinopsBoost: true,
      adBlock: true,
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

// ----- System window controls -----
export const systemService = {
  async minimize() { if (api) return api.system.minimize(); },
  async close()    { if (api) return api.system.close(); window.close(); },
  async shutdown() { if (api) return api.system.shutdown(); alert("Apagado solo disponible en la app Windows."); },
  async cancelShutdown() { if (api) return api.system.cancelShutdown(); },
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
    return mockNetworkFolders.map((f) => ({
      id: f.id, name: f.name, share: f.name, path: f.path, cover: f.cover, count: f.count,
    }));
  },
  async listFolder(share, folder = "") {
    if (api) {
      const res = await api.smb.listFolder(share, folder);
      if (res.error) return { error: res.error, items: [] };
      return { items: res.items };
    }
    const id =
      share.toLowerCase().includes("pel") ? "net-peliculas" :
      share.toLowerCase().includes("ser") ? "net-series" :
      "net-descargas";
    const items = (folderContents[id] || []).map((it) => ({
      name: `${it.title}.mkv`, path: `${it.title}.mkv`, isVideo: true, mockMeta: it,
    }));
    return { items };
  },
};

// ----- Continue Watching -----
export const cwService = {
  async get() { if (api) return (await api.cw.get()).slice(0, 3); return mockCW; },
  async save(entry) { if (api) return api.cw.upsert(entry); return [entry]; },
};

// ----- Streaming platforms -----
export const platformService = {
  async list() {
    if (api) return api.platform.list();
    const { streamingPlatforms } = await import("../data/mockData");
    return streamingPlatforms.map((p) => ({
      id: p.id, label: p.label, web: p.url,
      hasUwp: !["hbo", "youtube", "filmin"].includes(p.id),
      mode: ["hbo", "youtube", "filmin"].includes(p.id) ? "cinema" : "uwp",
    }));
  },
  async launch(id) {
    if (api) return api.platform.launch(id);
    const { streamingPlatforms } = await import("../data/mockData");
    const p = streamingPlatforms.find((x) => x.id === id);
    if (p) window.open(p.url, "_blank", "noopener");
    return { ok: true, mode: "external" };
  },
  async setMode(id, mode) { if (api) return api.platform.setMode(id, mode); return { id, mode }; },
};

// ----- TMDB -----
export const tmdbService = {
  async status() { if (api) return api.tmdb.status(); return { hasKey: false, lastScanAt: null, running: false }; },
  async setApiKey(key) { if (api) return api.tmdb.setApiKey(key); return { ok: true }; },
  async scan() { if (api) return api.tmdb.scan(); return { error: "no-electron" }; },
  async lookup(f) { if (api) return api.tmdb.lookup(f); return null; },
  async getCached(f) { if (api) return api.tmdb.getCached(f); return null; },
  onProgress(cb) { if (api) return api.tmdb.onProgress(cb); return () => {}; },
};

// ----- CoinOps -----
export const coinopsService = {
  async launch() {
    if (api) {
      const res = await api.coinops.launch();
      if (res.error) { alert(res.error); return false; }
      return true;
    }
    alert("Lanzamiento de CoinOps solo disponible en la app de Windows.");
    return false;
  },
};

// ----- IPTV -----
export const iptvService = {
  async listSources() {
    if (api) return api.iptv.listSources();
    return [
      { id: "demo-m3u", name: "Lista Demo (ejemplo)", type: "m3u", url: "https://example.com/demo.m3u" },
    ];
  },
  async addSource(src) { if (api) return api.iptv.addSource(src); return { id: "demo", ...src }; },
  async removeSource(id) { if (api) return api.iptv.removeSource(id); return []; },
  async refresh(id) { if (api) return api.iptv.refresh(id); return { ok: true, count: 0 }; },
  async getChannels(id) {
    if (api) return api.iptv.getChannels(id);
    return [
      { name: "La 1 HD", group: "España · TDT", logo: null, url: "demo://la1" },
      { name: "La 2", group: "España · TDT", logo: null, url: "demo://la2" },
      { name: "DAZN F1 HD", group: "Deportes", logo: null, url: "demo://dazn-f1" },
      { name: "Movistar LaLiga", group: "Deportes", logo: null, url: "demo://movistar-liga" },
    ];
  },
};

// ----- MPV -----
export const mpvService = {
  async play(opts) { if (api) return api.mpv.play(opts); return { error: "no-electron" }; },
  async playUrl(opts) { if (api) return api.mpv.playUrl(opts); return { error: "no-electron" }; },
  async stop() { if (api) return api.mpv.stop(); },
  async command(cmd) { if (api) return api.mpv.command(cmd); },
  onEvent(cb) { if (api) return api.mpv.onEvent(cb); return () => {}; },
  async setPause(pause) { return this.command(["set_property", "pause", pause]); },
  async seek(seconds) { return this.command(["seek", seconds, "relative"]); },
  async setAid(id) { return this.command(["set_property", "aid", id]); },
  async setSid(id) { return this.command(["set_property", "sid", id]); },
  async setAspect(ratio) {
    const map = { "16:9": "16:9", "4:3": "4:3", "21:9": "21:9", fit: "-1", stretch: "-1", zoom: "-2" };
    return this.command(["set_property", "video-aspect-override", map[ratio] ?? "-1"]);
  },
};

export const DEMO_VIDEO_URL = DEMO_VIDEO;
