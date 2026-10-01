// AlizceTV — TMDB client for Electron (Node 20)
// - Parses video filenames into clean title / year / season / episode.
// - Queries TMDB /search/movie and /search/tv in Spanish (es-ES) with en fallback.
// - Caches responses on disk and downloads posters to %APPDATA%/AlizceTV/posters/.
// - Rate-limited to 20 req/s to respect TMDB limits.

const fs = require("fs");
const path = require("path");
const https = require("https");

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500"; // decent quality + reasonable size
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

// --- Utils ---------------------------------------------------------------

function cleanTitle(raw) {
  // Strip extension, quality tags, codecs, groups
  let s = raw
    .replace(/\.(mkv|mp4|avi|mov|m4v|wmv|ts|webm)$/i, "")
    .replace(/[._]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\b(1080p|720p|480p|2160p|4k|uhd|hdr|hdr10|dolby|atmos|dts|aac|ac3|x264|x265|hevc|h264|h265|bluray|bdrip|brrip|webdl|web dl|webrip|hdtv|remux|dvdrip|cam|ts|xvid|divx|repack|proper|extended|director|uncut)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

function parseFilename(filename) {
  const name = path.basename(filename);
  const cleaned = cleanTitle(name);

  // Series pattern: title S01E05 or 1x05
  let m = cleaned.match(/^(.*?)[\s]*s(\d{1,2})e(\d{1,2})\b/i);
  if (m) {
    return {
      type: "tv",
      title: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
      year: null,
    };
  }
  m = cleaned.match(/^(.*?)[\s]*(\d{1,2})x(\d{1,2})\b/i);
  if (m) {
    return {
      type: "tv",
      title: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
      year: null,
    };
  }

  // Movie with year: use the LAST year that appears (handles titles containing
  // numbers like "Blade Runner 2049 (2017)" where 2017 is the real release year).
  const yearMatches = [...cleaned.matchAll(/\b(19\d{2}|20\d{2})\b/g)];
  if (yearMatches.length) {
    const last = yearMatches[yearMatches.length - 1];
    const year = parseInt(last[1], 10);
    // Only trust years up to current year + 2
    const now = new Date().getFullYear();
    if (year <= now + 2) {
      const title = cleaned.slice(0, last.index).trim().replace(/[(\[]$/, "").trim();
      return { type: "movie", title: title || cleaned, year };
    }
  }

  // Fallback: assume movie, no year
  return { type: "movie", title: cleaned, year: null };
}

function cacheKey(parsed) {
  if (parsed.type === "tv") return `tv:${parsed.title.toLowerCase()}`;
  return `movie:${parsed.title.toLowerCase()}:${parsed.year || "any"}`;
}

// --- Simple rate limiter ------------------------------------------------
let inflight = 0;
const MAX_CONCURRENT = 8;
const queue = [];
function acquire() {
  return new Promise((resolve) => {
    const run = () => { inflight++; resolve(() => { inflight--; drain(); }); };
    if (inflight < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}
function drain() {
  while (inflight < MAX_CONCURRENT && queue.length) queue.shift()();
}

// --- HTTP helpers --------------------------------------------------------
function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: "application/json" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else if (res.statusCode === 429) {
          const retry = parseInt(res.headers["retry-after"] || "2", 10);
          setTimeout(() => httpsGetJson(url).then(resolve, reject), retry * 1000);
        } else {
          reject(new Error(`TMDB HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    }).on("error", reject);
  });
}

function httpsDownload(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close(() => fs.unlink(destPath, () => reject(new Error(`HTTP ${res.statusCode}`))));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(destPath)));
    }).on("error", (e) => {
      fs.unlink(destPath, () => reject(e));
    });
  });
}

// --- TMDB client ---------------------------------------------------------

class TmdbClient {
  constructor({ apiKey, cacheDir }) {
    this.apiKey = apiKey;
    this.cacheDir = cacheDir;
    this.postersDir = path.join(cacheDir, "posters");
    this.cacheFile = path.join(cacheDir, "tmdb-cache.json");
    fs.mkdirSync(this.postersDir, { recursive: true });
    this.cache = this.loadCache();
  }

  loadCache() {
    try {
      return JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
    } catch (_) {
      return {};
    }
  }

  saveCache() {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (_) {}
  }

  setApiKey(k) { this.apiKey = k; }

  async request(endpoint, params = {}) {
    if (!this.apiKey) throw new Error("TMDB API key no configurada");
    const qs = new URLSearchParams({ api_key: this.apiKey, ...params }).toString();
    const url = `${TMDB_BASE}${endpoint}?${qs}`;
    const release = await acquire();
    try { return await httpsGetJson(url); }
    finally { release(); }
  }

  async searchWithFallback(type, title, year) {
    // Try es-ES first (with year), then without year, then en-US.
    const base = { query: title, include_adult: "false" };
    const withYear = { ...base };
    if (year && type === "movie") withYear.year = String(year);
    if (year && type === "tv") withYear.first_air_date_year = String(year);

    let res = await this.request(`/search/${type}`, { ...withYear, language: "es-ES" });
    if (res.results?.length) return res;

    if (year) {
      res = await this.request(`/search/${type}`, { ...base, language: "es-ES" });
      if (res.results?.length) return res;
    }

    res = await this.request(`/search/${type}`, { ...withYear, language: "en-US" });
    if (res.results?.length) return res;

    return await this.request(`/search/${type}`, { ...base, language: "en-US" });
  }

  async getDetails(type, id) {
    try {
      let res = await this.request(`/${type}/${id}`, { language: "es-ES" });
      // If overview is empty, try English
      if (!res.overview) {
        const en = await this.request(`/${type}/${id}`, { language: "en-US" });
        res.overview = en.overview || res.overview;
      }
      return res;
    } catch (_) {
      return null;
    }
  }

  async downloadPoster(posterPath) {
    if (!posterPath) return null;
    const name = posterPath.replace(/^\//, "").replace(/[^a-z0-9._-]/gi, "_");
    const local = path.join(this.postersDir, name);
    if (fs.existsSync(local)) return local;
    try {
      await httpsDownload(IMG_BASE + posterPath, local);
      return local;
    } catch (_) {
      return null;
    }
  }

  async lookup(filename) {
    const parsed = parseFilename(filename);
    const key = cacheKey(parsed);
    if (this.cache[key] && this.cache[key].localPoster && fs.existsSync(this.cache[key].localPoster)) {
      return { ...this.cache[key], _parsed: parsed };
    }
    try {
      const search = await this.searchWithFallback(parsed.type, parsed.title, parsed.year);
      const best = (search.results || [])[0];
      if (!best) {
        const miss = { notFound: true, _parsed: parsed };
        this.cache[key] = miss;
        this.saveCache();
        return miss;
      }
      const details = await this.getDetails(parsed.type, best.id);
      const localPoster = await this.downloadPoster(details?.poster_path || best.poster_path);
      const normalized = {
        type: parsed.type,
        tmdbId: best.id,
        title: details?.title || details?.name || best.title || best.name,
        originalTitle: details?.original_title || details?.original_name,
        year: (details?.release_date || details?.first_air_date || "").slice(0, 4) || parsed.year,
        overview: details?.overview || best.overview,
        rating: details?.vote_average || best.vote_average,
        genres: (details?.genres || []).map((g) => g.name),
        runtime: details?.runtime,
        episodeRuntime: details?.episode_run_time?.[0],
        numberOfSeasons: details?.number_of_seasons,
        posterUrl: (details?.poster_path || best.poster_path)
          ? IMG_BASE + (details?.poster_path || best.poster_path) : null,
        backdropUrl: (details?.backdrop_path || best.backdrop_path)
          ? BACKDROP_BASE + (details?.backdrop_path || best.backdrop_path) : null,
        localPoster,
        _parsed: parsed,
      };
      this.cache[key] = normalized;
      this.saveCache();
      return normalized;
    } catch (e) {
      return { error: e.message, _parsed: parsed };
    }
  }

  // Deduplicate TV series — one lookup per show across all episodes
  async scanFiles(files, onProgress) {
    const seen = new Set();
    const items = [];
    let done = 0;
    const total = files.length;

    const tasks = files.map(async (file) => {
      const parsed = parseFilename(file);
      const key = cacheKey(parsed);
      if (seen.has(key)) {
        done++;
        onProgress?.({ done, total, file });
        return;
      }
      seen.add(key);
      const info = await this.lookup(file);
      items.push({ file, parsed, info });
      done++;
      onProgress?.({ done, total, file });
    });
    await Promise.all(tasks);
    return items;
  }

  getCached(filename) {
    const parsed = parseFilename(filename);
    return this.cache[cacheKey(parsed)] || null;
  }
}

module.exports = { TmdbClient, parseFilename, cleanTitle };
