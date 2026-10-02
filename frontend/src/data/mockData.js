// Mock data for AlizceTV prototype
// Todas las imagenes se sirven desde /public/mock/ (locales, sin Unsplash).

export const continueWatching = [
  {
    id: "cw-1",
    title: "Dune: Parte Dos",
    subtitle: "SMB Películas · 1080p",
    progress: 68,
    remaining: "38 min restantes",
    image: "./mock/cw-dune.jpg",
    path: "//192.168.1.200/Peliculas/Dune.Parte.Dos.2024.mkv",
    audio: ["Español (5.1 Dolby)", "English (Atmos)"],
    subs: ["Español (SRT)", "English (Forced)"],
  },
  {
    id: "cw-2",
    title: "The Last of Us · S01E05",
    subtitle: "SMB Series · 4K HDR",
    progress: 42,
    remaining: "24 min restantes",
    image: "./mock/cw-tlou.jpg",
    path: "//192.168.1.200/Series/TLOU/S01E05.mkv",
    audio: ["Español Castellano (Stereo)"],
    subs: [],
  },
  {
    id: "cw-3",
    title: "Blade Runner 2049",
    subtitle: "SMB Películas · Remux",
    progress: 88,
    remaining: "12 min restantes",
    image: "./mock/cw-bladerunner.jpg",
    path: "//192.168.1.200/Peliculas/BladeRunner2049.mkv",
    audio: ["Español (DTS-HD)", "English (TrueHD)"],
    subs: ["Español Completo", "Español Forzado", "English SDH"],
  },
];

export const streamingPlatforms = [
  { id: "netflix",   label: "Netflix",     bg: "#E50914", url: "https://www.netflix.com",   short: "N" },
  { id: "prime",     label: "Prime Video", bg: "#00A8E1", url: "https://www.primevideo.com", short: "prime" },
  { id: "disney",    label: "Disney+",     bg: "#113CCF", url: "https://www.disneyplus.com", short: "D+" },
  { id: "hbo",       label: "HBO Max",     bg: "#5822B4", url: "https://www.max.com",       short: "MAX" },
  { id: "movistar",  label: "Movistar+",   bg: "#002B49", url: "https://ver.movistarplus.es", short: "M+" },
  { id: "apple",     label: "Apple TV+",   bg: "#1C1C1E", url: "https://tv.apple.com",      short: "tv+" },
  { id: "youtube",   label: "YouTube",     bg: "#FF0000", url: "https://www.youtube.com/tv", short: "▶" },
  { id: "twitch",    label: "Twitch",      bg: "#9146FF", url: "https://www.twitch.tv",     short: "tv" },
  { id: "filmin",    label: "Filmin",      bg: "#000000", url: "https://www.filmin.es",     short: "F" },
];

export const networkFolders = [
  {
    id: "net-peliculas",
    name: "Películas",
    icon: "film",
    path: "smb://192.168.1.200/Peliculas",
    count: "142 Títulos",
    cover: "./mock/net-peliculas.jpg",
  },
  {
    id: "net-series",
    name: "Series",
    icon: "tv",
    path: "smb://192.168.1.200/Series",
    count: "38 Series",
    cover: "./mock/net-series.jpg",
  },
  {
    id: "net-descargas",
    name: "Descargas",
    icon: "download",
    path: "smb://192.168.1.200/Descargas",
    count: "8 Archivos en curso",
    cover: "./mock/net-descargas.jpg",
  },
];

// Sample video content inside each folder
const samplePosters = [
  "./mock/poster-1.jpg",
  "./mock/poster-2.jpg",
  "./mock/poster-3.jpg",
  "./mock/poster-4.jpg",
  "./mock/poster-5.jpg",
  "./mock/poster-6.jpg",
];

export const folderContents = {
  "net-peliculas": [
    { id: "p1", title: "Dune: Parte Dos", year: 2024, res: "1080p", audio: "5.1", poster: samplePosters[0] },
    { id: "p2", title: "Blade Runner 2049", year: 2017, res: "4K HDR", audio: "DTS-HD", poster: samplePosters[1] },
    { id: "p3", title: "Interstellar", year: 2014, res: "4K", audio: "Atmos", poster: samplePosters[2] },
    { id: "p4", title: "Oppenheimer", year: 2023, res: "4K HDR", audio: "Atmos", poster: samplePosters[3] },
    { id: "p5", title: "Her", year: 2013, res: "1080p", audio: "5.1", poster: samplePosters[4] },
    { id: "p6", title: "Arrival", year: 2016, res: "1080p", audio: "DTS", poster: samplePosters[5] },
    { id: "p7", title: "Everything Everywhere", year: 2022, res: "1080p", audio: "5.1", poster: samplePosters[0] },
    { id: "p8", title: "Mad Max: Fury Road", year: 2015, res: "4K", audio: "Atmos", poster: samplePosters[1] },
  ],
  "net-series": [
    { id: "s1", title: "The Last of Us", year: 2023, res: "4K HDR", audio: "Atmos", poster: samplePosters[2] },
    { id: "s2", title: "Severance", year: 2022, res: "4K", audio: "Atmos", poster: samplePosters[3] },
    { id: "s3", title: "True Detective", year: 2014, res: "1080p", audio: "5.1", poster: samplePosters[4] },
    { id: "s4", title: "Dark", year: 2017, res: "4K", audio: "5.1", poster: samplePosters[5] },
    { id: "s5", title: "Fallout", year: 2024, res: "4K HDR", audio: "Atmos", poster: samplePosters[0] },
    { id: "s6", title: "Mr. Robot", year: 2015, res: "1080p", audio: "5.1", poster: samplePosters[1] },
  ],
  "net-descargas": [
    { id: "d1", title: "Documental.Oceanos.2024", year: 2024, res: "1080p", audio: "5.1", poster: samplePosters[5], progress: 72 },
    { id: "d2", title: "Pelicula.Indie.2025", year: 2025, res: "720p", audio: "Stereo", poster: samplePosters[4], progress: 35 },
    { id: "d3", title: "Serie.Nueva.S01", year: 2025, res: "1080p", audio: "5.1", poster: samplePosters[3], progress: 90 },
  ],
};

// Sample demo video (Big Buck Bunny - open license)
export const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const aspectRatios = [
  { id: "16:9", label: "16:9", css: "object-contain" },
  { id: "4:3",  label: "4:3",  css: "object-contain" },
  { id: "21:9", label: "21:9", css: "object-contain" },
  { id: "fit",  label: "Ajustar", css: "object-contain" },
  { id: "stretch", label: "Estirar", css: "object-fill" },
  { id: "zoom", label: "Zoom", css: "object-cover" },
];

export const arcadeTile = {
  id: "arcade-coinops",
  title: "CoinOps Arcade",
  subtitle: "Lanzador Retro · RetroArch Integration",
  badge: "RETRO ARCADE",
  image: "./mock/arcade.jpg",
};