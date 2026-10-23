(function () {
  if (window.top !== window.self) return; 
  let bloqueado = false;

  function cerrarVentana() {
    try { chrome.runtime.sendMessage({ action: "closeWindow" }); } catch (e) {}
  }

  // Interceptar el botón derecho (mousedown con button === 2)
  window.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return; // Solo botón derecho

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (bloqueado) return;
    bloqueado = true;

    const urlAntes = location.href;

    // 1. Lanzamos un evento de contexto "limpio" para que la web 
    // (ej. YouTube TV) reaccione si le da la gana.
    const evContext = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      buttons: 2,
      clientX: e.clientX,
      clientY: e.clientY
    });
    
    // Lo disparamos en el elemento donde se hizo clic
    e.target.dispatchEvent(evContext);

    // 2. Esperamos a ver si la web hizo algo
    setTimeout(() => {
      if (location.href !== urlAntes) {
        bloqueado = false;
        return; // La web reaccionó (cambió de URL)
      }

      // 3. Si no hizo nada, hacemos history.back()
      try {
        history.back();
      } catch (err) {
        cerrarVentana();
        bloqueado = false;
        return;
      }

      // 4. Si no hay historial, cerramos
      setTimeout(() => {
        if (location.href === urlAntes) {
          cerrarVentana();
        }
        bloqueado = false;
      }, 300);
    }, 300);
  }, true);

  // Evitar que el menú contextual nativo de Brave salga
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  }, true);
})();
