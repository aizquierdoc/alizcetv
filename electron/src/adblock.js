// AlizceTV — Lightweight ad / tracker blocker for cinema BrowserWindows.
// Uses session.webRequest to drop requests to known ad / tracker domains.
// Covers the most impactful cases (YouTube ads, Google ads, trackers)
// without the overhead of a full EasyList parser.

const DOMAINS = [
  // Google ads / trackers
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "google-analytics.com",
  "googletagmanager.com",
  "googletagservices.com",
  "adservice.google.com",
  "adservice.google.es",
  "pagead2.googlesyndication.com",
  // YouTube ads (specific endpoints)
  "youtube.com/api/stats/ads",
  "youtube.com/pagead",
  "youtube.com/ptracking",
  "youtubei.googleapis.com/youtubei/v1/log_event",
  // Common trackers
  "scorecardresearch.com",
  "quantserve.com",
  "amazon-adsystem.com",
  "adnxs.com",
  "criteo.com",
  "facebook.com/tr",
  "connect.facebook.net",
  "hotjar.com",
  "clarity.ms",
  "segment.com",
  "mixpanel.com",
  "chartbeat.com",
  "taboola.com",
  "outbrain.com",
  "zemanta.com",
];

function shouldBlock(url) {
  // Lowercase comparison; checks for substring match in the URL path+host
  const u = url.toLowerCase();
  return DOMAINS.some((d) => u.includes(d));
}

function installAdBlocker(sess) {
  sess.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
    if (shouldBlock(details.url)) {
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });
}

module.exports = { installAdBlocker, shouldBlock };
