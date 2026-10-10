// content-bridge.js
// Corre en el mundo AISLADO (donde chrome.runtime esta disponible).
// Escucha el CustomEvent que emite content.js y pide cerrar la ventana.

window.addEventListener("backOrClose:requestClose", () => {
  try {
    chrome.runtime.sendMessage({ action: "closeWindow" });
  } catch (e) {
    console.error("[Back or Close] sendMessage error:", e);
  }
});
