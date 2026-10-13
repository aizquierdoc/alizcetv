(function () {
  if (window.top !== window.self) return; // solo en el frame principal

  let bloqueado = false;

  function cerrarVentana() {
    try {
      chrome.runtime.sendMessage({ action: "closeWindow" });
    } catch (e) {}
  }

  function decidir() {
    let navego = false;
    const onPop = () => { navego = true; };

    window.addEventListener("popstate", onPop, { once: true });
    window.addEventListener("hashchange", onPop, { once: true });

    const urlAntes = location.href;

    try {
      history.back();
    } catch (e) {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
      cerrarVentana();
      return;
    }

    setTimeout(() => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
      // Si no hubo popstate/hashchange Y la URL no cambio → no habia historial
      if (!navego && location.href === urlAntes) {
        cerrarVentana();
      }
    }, 250);
  }

  window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
    if (!(e.key === "w" || e.key === "W" || e.code === "KeyW")) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (bloqueado) return;
    bloqueado = true;
    decidir();
    setTimeout(() => { bloqueado = false; }, 400);
  }, true);
})();
