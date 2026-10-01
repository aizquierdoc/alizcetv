// AlizceTV — IPTV module
// Supports two source types: m3u/m3u8 playlists and Xtream Codes API.
// Also provides EPG via XMLTV (for m3u) or get_short_epg API (for Xtream).

const https = require("https");
const http = require("http");
const zlib = require("zlib");

function fetchText(url, { gzip = false } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, { gzip }).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const encoding = res.headers["content-encoding"];
      const stream =
        encoding === "gzip" || gzip ? res.pipe(zlib.createGunzip()) : res;
      let data = "";
      stream.setEncoding("utf8");
      stream.on("data", (c) => (data += c));
      stream.on("end", () => resolve(data));
      stream.on("error", reject);
    }).on("error", reject);
  });
}
function fetchJson(url) { return fetchText(url).then((t) => JSON.parse(t)); }

// ----- M3U parser -------------------------------------------------------
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;
  let xmltvUrl = null;
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith("#EXTM3U")) {
      const m = l.match(/(?:url-tvg|x-tvg-url|tvg-url)="([^"]+)"/i);
      if (m) xmltvUrl = m[1].split(",")[0].trim();
      continue;
    }
    if (l.startsWith("#EXTINF")) {
      const nameMatch = l.match(/,(.*)$/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : "Canal",
        logo: l.match(/tvg-logo="([^"]+)"/)?.[1] || null,
        group: l.match(/group-title="([^"]+)"/)?.[1] || "Sin grupo",
        tvgId: l.match(/tvg-id="([^"]+)"/)?.[1] || null,
      };
    } else if (!l.startsWith("#") && current) {
      channels.push({ ...current, url: l });
      current = null;
    }
  }
  return { channels, xmltvUrl };
}

// ----- XMLTV parser -----------------------------------------------------
// Parses XMLTV time format "20261001200000 +0200" → Date
function parseXmltvTime(s) {
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?$/);
  if (!m) return null;
  const [_, y, M, d, h, mi, se, tz] = m;
  const iso = `${y}-${M}-${d}T${h}:${mi}:${se}${tz ? tz.slice(0, 3) + ":" + tz.slice(3) : "Z"}`;
  const t = Date.parse(iso);
  return isNaN(t) ? null : t;
}

function parseXMLTV(xml) {
  const byChannel = {};
  const re = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const attrs = m[1];
    const body = m[2];
    const start = attrs.match(/start="([^"]+)"/)?.[1];
    const stop = attrs.match(/stop="([^"]+)"/)?.[1];
    const channel = attrs.match(/channel="([^"]+)"/)?.[1];
    if (!channel || !start) continue;
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const desc = body.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i)?.[1]?.trim() || "";
    const startT = parseXmltvTime(start);
    const stopT = stop ? parseXmltvTime(stop) : null;
    if (!startT) continue;
    (byChannel[channel] ||= []).push({ start: startT, stop: stopT, title, desc });
  }
  // Sort per channel
  for (const k in byChannel) byChannel[k].sort((a, b) => a.start - b.start);
  return byChannel;
}

async function fetchXmltv(url) {
  const text = await fetchText(url, { gzip: url.endsWith(".gz") });
  return parseXMLTV(text);
}

// Pick current and next programme at `atTime`
function programmesAt(list, atTime = Date.now()) {
  if (!list) return { now: null, next: null };
  let now = null, next = null;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const end = p.stop || (list[i + 1]?.start || p.start + 3600000);
    if (p.start <= atTime && atTime < end) {
      now = p; next = list[i + 1] || null; break;
    }
    if (p.start > atTime) { next = p; break; }
  }
  return { now, next };
}

// ----- Xtream Codes -----------------------------------------------------
async function xtreamLoad(host, user, pass) {
  const base = `${host.replace(/\/$/, "")}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
  const [cats, streams] = await Promise.all([
    fetchJson(`${base}&action=get_live_categories`).catch(() => []),
    fetchJson(`${base}&action=get_live_streams`).catch(() => []),
  ]);
  const catMap = {};
  (cats || []).forEach((c) => { catMap[c.category_id] = c.category_name; });
  return (streams || []).map((s) => ({
    name: s.name,
    logo: s.stream_icon || null,
    group: catMap[s.category_id] || "Sin grupo",
    tvgId: s.epg_channel_id || null,
    url: `${host.replace(/\/$/, "")}/live/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${s.stream_id}.ts`,
    xtreamId: s.stream_id,
  }));
}

async function xtreamShortEpg(host, user, pass, streamId) {
  const url = `${host.replace(/\/$/, "")}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_short_epg&stream_id=${streamId}&limit=2`;
  try {
    const res = await fetchJson(url);
    const list = (res.epg_listings || []).map((p) => ({
      start: parseInt(p.start_timestamp, 10) * 1000,
      stop: parseInt(p.stop_timestamp, 10) * 1000,
      title: Buffer.from(p.title || "", "base64").toString("utf8"),
      desc: Buffer.from(p.description || "", "base64").toString("utf8"),
    }));
    return programmesAt(list);
  } catch (_) {
    return { now: null, next: null };
  }
}

async function loadSource(source) {
  if (source.type === "m3u") {
    const text = await fetchText(source.url);
    const { channels, xmltvUrl } = parseM3U(text);
    let epgByChannel = {};
    const explicit = source.xmltvUrl || xmltvUrl;
    if (explicit) {
      try { epgByChannel = await fetchXmltv(explicit); } catch (_) {}
    }
    return { channels, epgByChannel };
  }
  if (source.type === "xtream") {
    const channels = await xtreamLoad(source.host, source.user, source.pass);
    return { channels, epgByChannel: {} };
  }
  throw new Error(`Tipo de fuente desconocido: ${source.type}`);
}

module.exports = {
  loadSource, parseM3U, xtreamLoad, xtreamShortEpg,
  parseXMLTV, fetchXmltv, programmesAt,
};
