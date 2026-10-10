// content.js
// Se ejecuta en el mundo MAIN (antes que Chromium).
// Escucha Ctrl+W y decide: history.back() o cerrar ventana.

(function () {
  function pedirCerrar() {
    // En world MAIN, chrome.runtime no esta disponible.
    // Usamos un CustomEvent para que content-bridge.js lo recoja.
    window.dispatchEvent(new CustomEvent("backOrClose:requestClose"));
  }

  function decidir() {
    const urlAntes = location.href;
    try {
      window.history.back();
    } catch (e) {
      pedirCerrar();
      return;
    }
    setTimeout(() => {
      if (location.href === urlAntes) {
        pedirCerrar();
      }
    }, 300);
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "w" || e.key === "W" || e.code === "KeyW")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      decidir();
      return false;
    }
  }, true);
})();
