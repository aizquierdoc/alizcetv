// Mock data for AlizceTV prototype
// Todas las imagenes se sirven desde /public/mock/ (locales, sin Unsplash).

export const streamingPlatforms = [
  { id: "netflix",  label: "Netflix",     url: "https://www.netflix.com",     logo: "./logos/netflix.jpg"  },
  { id: "prime",    label: "Prime Video", url: "https://www.primevideo.com",  logo: "./logos/prime.jpg"    },
  { id: "disney",   label: "Disney+",     url: "https://www.disneyplus.com",  logo: "./logos/disney.jpg"   },
  { id: "hbo",      label: "HBO Max",     url: "https://www.max.com",         logo: "./logos/max.jpg"      },
  { id: "movistar", label: "Movistar+",   url: "https://ver.movistarplus.es", logo: "./logos/movistar.jpg" },
  { id: "apple",    label: "Apple TV+",   url: "https://tv.apple.com",        logo: "./logos/apple.jpg"    },
  { id: "youtube",  label: "YouTube",     url: "https://www.youtube.com/tv",  logo: "./logos/youtube.jpg"  },
  { id: "twitch",   label: "Twitch",      url: "https://www.twitch.tv",       logo: "./logos/twitch.jpg"   },
  { id: "filmin",   label: "Filmin",      url: "https://www.filmin.es",       logo: "./logos/filmin.jpg"   },
  { id: "spotify",  label: "Spotify",     url: "https://open.spotify.com",    logo: "./logos/spotify.jpg"  },
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
