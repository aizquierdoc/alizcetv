chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.action === "closeWindow" && sender.tab && sender.tab.windowId) {
    chrome.windows.remove(sender.tab.windowId)
      .then(() => console.log("[Back or Close] ventana cerrada"))
      .catch((e) => console.error("[Back or Close] error al cerrar:", e));
  }
});
