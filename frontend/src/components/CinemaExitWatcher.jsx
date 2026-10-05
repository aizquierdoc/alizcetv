import { useEffect, useRef } from "react";
import { getButtonMap, onButtonMapChange } from "../hooks/useFocusEngine";

/**
 * Mientras hay una app abierta por AlizceTV (Edge cinema, MPV, etc.), la
 * ventana principal está en segundo plano. Este watcher sigue corriendo
 * (backgroundThrottling:false) y reacciona al botón "closeApp" del mando
 * para cerrar la app activa.
 *
 * Escape sigue funcionando desde el proceso principal (globalShortcut).
 */
export default function CinemaExitWatcher() {
  const openRef = useRef(false);
  const prevPressedRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.alizce : null;
    if (!api) return;

    const close = () => {
      // Preferimos el handler nuevo si existe; si no, caemos al clásico.
      if (api.app?.closeActive) {
        try { api.app.closeActive(); return; } catch (_) {}
      }
      if (api.cinema?.close) {
        try { api.cinema.close(); } catch (_) {}
      }
    };

    const poll = () => {
      if (openRef.current) {
        const idx = getButtonMap().closeApp;
        if (idx != null && idx >= 0) {
          const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
          let pressed = false;
          for (const pad of pads) {
            if (!pad) continue;
            if (pad.buttons[idx]?.pressed) { pressed = true; break; }
          }
          if (pressed && !prevPressedRef.current) close();
          prevPressedRef.current = pressed;
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };

    let unsubscribe = null;
    if (api.cinema?.onState) {
      unsubscribe = api.cinema.onState(({ open }) => {
        openRef.current = !!open;
        if (!open) prevPressedRef.current = false;
      });
    } else {
      // Sin onState, asumimos que puede haber algo abierto y permitimos el botón
      openRef.current = true;
    }

    const offMap = onButtonMapChange(() => { prevPressedRef.current = false; });

    rafRef.current = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { unsubscribe && unsubscribe(); } catch (_) {}
      try { offMap && offMap(); } catch (_) {}
    };
  }, []);

  return null;
}