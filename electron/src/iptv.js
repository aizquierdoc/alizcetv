// AlizceTV — IPTV module
// Supports two source types:
//   - m3u / m3u8: a text playlist URL (public or private)
//   - xtream:    Xtream Codes API (host + user + pass)

const https = require("https");
const http = require("http");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function fetchJson(url) {
  return fetchText(url).then((t) => JSON.parse(t));
}

// ---- M3U parser --------------------------------------------------------
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith("#EXTINF")) {
      const nameMatch = l.match(/,(.*)$/);
      const logo = l.match(/tvg-logo="([^"]+)"/)?.[1];
      const group = l.match(/group-title="([^"]+)"/)?.[1];
      const tvgId = l.match(/tvg-id="([^"]+)"/)?.[1];
      current = {
        name: nameMatch ? nameMatch[1].trim() : "Canal",
        logo: logo || null,
        group: group || "Sin grupo",
        tvgId: tvgId || null,
      };
    } else if (!l.startsWith("#") && current) {
      channels.push({ ...current, url: l });
      current = null;
    }
  }
  return channels;
}

// ---- Xtream Codes ------------------------------------------------------
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

async function loadSource(source) {
  if (source.type === "m3u") {
    const text = await fetchText(source.url);
    return parseM3U(text);
  }
  if (source.type === "xtream") {
    return xtreamLoad(source.host, source.user, source.pass);
  }
  throw new Error(`Tipo de fuente desconocido: ${source.type}`);
}

module.exports = { loadSource, parseM3U, xtreamLoad };
