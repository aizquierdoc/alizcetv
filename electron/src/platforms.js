// AlizceTV — Platform launch matrix
// For each streaming platform: UWP app (if any), cinema (Edge --app), external browser.
// Verified URLs and protocols as of Jan 2026.

module.exports = {
  netflix: {
    label: "Netflix",
    web: "https://www.netflix.com",
    protocol: "netflix://",   // Netflix UWP (Microsoft Store)
    hasUwp: true,
    defaultMode: "uwp",
  },
  prime: {
    label: "Prime Video",
    web: "https://www.primevideo.com",
    protocol: "primevideo://", // Prime Video UWP (Microsoft Store)
    hasUwp: true,
    defaultMode: "uwp",
  },
  disney: {
    label: "Disney+",
    web: "https://www.disneyplus.com/es-es",
    protocol: "disneyplus://",  // Disney+ UWP
    hasUwp: true,
    defaultMode: "uwp",
  },
  hbo: {
    label: "HBO Max",
    web: "https://play.max.com",
    protocol: null,            // No UWP on Windows (Max discontinued it)
    hasUwp: false,
    defaultMode: "cinema",
  },
  movistar: {
    label: "Movistar+",
    web: "https://ver.movistarplus.es",
    protocol: "movistarplus://",
    hasUwp: true,
    defaultMode: "uwp",
  },
  apple: {
    label: "Apple TV+",
    web: "https://tv.apple.com",
    protocol: "com.apple.atv://",
    hasUwp: true,
    defaultMode: "cinema", // User preference — defaults to Edge cinema
  },
  youtube: {
    label: "YouTube",
    web: "https://www.youtube.com",
    protocol: null,
    hasUwp: false,
    defaultMode: "cinema",
  },
  twitch: {
    label: "Twitch",
    web: "https://www.twitch.tv",
    protocol: "twitch://",
    hasUwp: true,
    defaultMode: "uwp",
  },
  filmin: {
    label: "Filmin",
    web: "https://www.filmin.es",
    protocol: null,
    hasUwp: false,
    defaultMode: "cinema",
  },
};
