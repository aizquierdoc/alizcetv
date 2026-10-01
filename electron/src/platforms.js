// AlizceTV — Platform launch matrix
// For each streaming platform, three strategies:
//   - uwp:   Try to launch Windows UWP app via protocol handler.
//   - cinema: Open an Electron BrowserWindow fullscreen with the official web URL.
//   - external: Launch default browser (shell.openExternal).
//
// The user can override per-platform in Settings. These are the defaults chosen
// by the real-world availability of UWP apps on Windows 11 as of 2026.

module.exports = {
  netflix: {
    label: "Netflix",
    web: "https://www.netflix.com",
    protocol: "netflix://",
    hasUwp: true,
    defaultMode: "uwp",
  },
  prime: {
    label: "Prime Video",
    web: "https://www.primevideo.com",
    protocol: "primevideo://",
    hasUwp: true,
    defaultMode: "uwp",
  },
  disney: {
    label: "Disney+",
    web: "https://www.disneyplus.com",
    protocol: "disneyplus://",
    hasUwp: true,
    defaultMode: "uwp",
  },
  hbo: {
    label: "HBO Max",
    web: "https://play.max.com",
    protocol: null, // No UWP on Windows (Max discontinued the UWP app)
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
    defaultMode: "uwp",
  },
  youtube: {
    label: "YouTube",
    // Piped is an open-source YouTube frontend without ads or trackers.
    // Uses TV UI user-agent for lean-back layout.
    web: "https://piped.video",
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
    protocol: null, // No UWP
    hasUwp: false,
    defaultMode: "cinema",
  },
};
