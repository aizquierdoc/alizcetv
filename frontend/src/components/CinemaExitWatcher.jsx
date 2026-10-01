import { useEffect, useRef } from "react";

/**
 * While a cinema window is open (Edge --kiosk or Electron fallback), the
 * main AlizceTV window is in the background. This watcher keeps running
 * (thanks to backgroundThrottling:false on the main window) and reacts to:
 *   - Gamepad Y (button index 3): closes the cinema via IPC.
 *
 * Escape key closure is handled on the main process via globalShortcut, so
 * nothing to do for the keyboard here.
 */
export default function CinemaExitWatcher() {
  const openRef = useRef(false);
  const prevYRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.alizce : null;
    if (!api?.cinema?.onState) return;

    const close = () => { try { api.cinema.close(); } catch (_) {} };

    const poll = () => {
      if (openRef.current) {
        const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
        let yPressed = false;
        for (const pad of pads) {
          if (!pad) continue;
          if (pad.buttons[3]?.pressed) { yPressed = true; break; }
        }
        if (yPressed && !prevYRef.current) close();
        prevYRef.current = yPressed;
      }
      rafRef.current = requestAnimationFrame(poll);
    };

    const unsubscribe = api.cinema.onState(({ open }) => {
      openRef.current = !!open;
      if (!open) prevYRef.current = false;
    });

    rafRef.current = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { unsubscribe && unsubscribe(); } catch (_) {}
    };
  }, []);

  return null;
}
