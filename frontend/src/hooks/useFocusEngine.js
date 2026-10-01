// Spatial focus engine for TV / gamepad navigation
// - Discovers focusable elements via [data-focusable="true"]
// - Navigates with arrows + mapped gamepad buttons
// - Lets native text inputs capture their own keystrokes
// - Button mapping is read from window.alizce.settings when available

import { useEffect, useRef, useState, useCallback } from "react";

const SELECTOR = '[data-focusable="true"]';

// Default button mapping (can be overridden by user in Settings)
export const DEFAULT_BUTTON_MAP = {
  accept: 0,     // A
  back: 1,       // B
  menu: 3,       // Y
  playpause: 0,  // A (same as accept, context-sensitive)
  minimize: 8,   // Select / Back
  shutdown: -1,  // Unmapped by default (user must set)
};

function rectOf(el) {
  const r = el.getBoundingClientRect();
  return {
    el,
    id: el.getAttribute("data-focus-id"),
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    left: r.left, right: r.right, top: r.top, bottom: r.bottom,
    w: r.width, h: r.height,
  };
}

function distance(a, b, dir) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  if (dir === "right") { if (b.left < a.right - 2) return Infinity; return Math.abs(dy) * 2.5 + dx; }
  if (dir === "left")  { if (b.right > a.left + 2) return Infinity; return Math.abs(dy) * 2.5 + -dx; }
  if (dir === "down")  { if (b.top < a.bottom - 2) return Infinity; return Math.abs(dx) * 2.5 + dy; }
  if (dir === "up")    { if (b.bottom > a.top + 2) return Infinity; return Math.abs(dx) * 2.5 + -dy; }
  return Math.hypot(dx, dy);
}

function isTypingContext() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

// Load button map from Electron settings once, cache in-memory and refresh on event
let CACHED_MAP = { ...DEFAULT_BUTTON_MAP };
const mapListeners = new Set();
export function getButtonMap() { return CACHED_MAP; }
export function setButtonMap(next) {
  CACHED_MAP = { ...CACHED_MAP, ...next };
  mapListeners.forEach((fn) => fn(CACHED_MAP));
}
export function onButtonMapChange(fn) {
  mapListeners.add(fn);
  return () => mapListeners.delete(fn);
}

// Load map from Electron settings on module init
if (typeof window !== "undefined" && window.alizce?.settings) {
  window.alizce.settings.get().then((s) => {
    if (s?.buttonMap) setButtonMap(s.buttonMap);
  }).catch(() => {});
}

export function useFocusEngine(options = {}) {
  const { enabled = true, onBack, onMenu, onPlayPause, onMinimize, onShutdown } = options;
  const [focusedId, setFocusedId] = useState(null);
  const focusedRef = useRef(null);

  const applyFocus = useCallback((id) => {
    if (!id) return;
    focusedRef.current = id;
    setFocusedId(id);
    document.querySelectorAll(SELECTOR).forEach((el) => {
      const match = el.getAttribute("data-focus-id") === id;
      if (match) {
        el.setAttribute("data-focused", "true");
        // When focusing a Focusable that WRAPS an input, give the input DOM focus too
        const inner = el.querySelector("input, textarea");
        if (inner && document.activeElement !== inner) {
          try { inner.focus({ preventScroll: true }); } catch (_) {}
        }
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } else if (el.getAttribute("data-focused") === "true") {
        el.setAttribute("data-focused", "false");
      }
    });
  }, []);

  const focusFirst = useCallback(() => {
    const first = document.querySelector(SELECTOR);
    if (first) applyFocus(first.getAttribute("data-focus-id"));
  }, [applyFocus]);

  const move = useCallback(
    (dir) => {
      const nodes = Array.from(document.querySelectorAll(SELECTOR));
      if (!nodes.length) return;
      const currentEl =
        nodes.find((n) => n.getAttribute("data-focus-id") === focusedRef.current) || nodes[0];
      const current = rectOf(currentEl);
      let best = null;
      let bestDist = Infinity;
      for (const n of nodes) {
        if (n === currentEl) continue;
        const r = rectOf(n);
        const d = distance(current, r, dir);
        if (d < bestDist) { bestDist = d; best = r; }
      }
      if (best) applyFocus(best.id);
    },
    [applyFocus]
  );

  const confirm = useCallback(() => {
    const id = focusedRef.current;
    if (!id) return;
    const el = document.querySelector(`[data-focus-id="${id}"]`);
    if (!el) return;
    // If this focusable wraps an input, keep DOM focus on input instead of click
    const inner = el.querySelector("input, textarea");
    if (inner) { try { inner.focus(); } catch (_) {} return; }
    el.click();
  }, []);

  // ------- Keyboard -------
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      // When typing in an input/textarea, let native typing work.
      // Only intercept Escape to blur and return to TV nav.
      if (isTypingContext()) {
        if (e.key === "Escape") {
          try { document.activeElement.blur(); } catch (_) {}
        }
        return;
      }
      const key = e.key;
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "Escape", "Backspace"];
      if (!keys.includes(key)) return;
      e.preventDefault();
      if (key === "ArrowUp")    move("up");
      else if (key === "ArrowDown")  move("down");
      else if (key === "ArrowLeft")  move("left");
      else if (key === "ArrowRight") move("right");
      else if (key === "Enter")  confirm();
      else if (key === " ")      { if (onPlayPause) onPlayPause(); else confirm(); }
      else if (key === "Escape" || key === "Backspace") onBack && onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, move, confirm, onBack, onPlayPause]);

  // ------- Gamepad -------
  useEffect(() => {
    if (!enabled) return;
    let raf;
    let lastNav = 0;
    const DEAD = 0.5;
    const COOLDOWN = 180;
    const prevPressed = {};

    const poll = () => {
      if (isTypingContext()) {
        // While typing in an input, still allow gamepad B (back) via menu button combo, but
        // skip navigation + confirm actions to avoid typing noise.
        raf = requestAnimationFrame(poll);
        return;
      }
      const map = getButtonMap();
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad) continue;
        const now = performance.now();
        const [axH = 0, axV = 0] = pad.axes;
        const dUp = pad.buttons[12]?.pressed;
        const dDn = pad.buttons[13]?.pressed;
        const dLt = pad.buttons[14]?.pressed;
        const dRt = pad.buttons[15]?.pressed;
        let dir = null;
        if (dUp || axV < -DEAD) dir = "up";
        else if (dDn || axV > DEAD) dir = "down";
        else if (dLt || axH < -DEAD) dir = "left";
        else if (dRt || axH > DEAD) dir = "right";
        if (dir && now - lastNav > COOLDOWN) { move(dir); lastNav = now; }

        // Mapped action buttons — edge-trigger (press start)
        const check = (name, defaultCb) => {
          const idx = map[name];
          if (idx == null || idx < 0) return;
          const pressed = pad.buttons[idx]?.pressed;
          const k = `${pad.index}:${idx}:${name}`;
          if (pressed && !prevPressed[k]) defaultCb?.();
          prevPressed[k] = pressed;
        };
        check("accept", confirm);
        check("back", onBack);
        check("menu", onMenu);
        check("playpause", onPlayPause);
        check("minimize", onMinimize);
        check("shutdown", onShutdown);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [enabled, move, confirm, onBack, onMenu, onPlayPause, onMinimize, onShutdown]);

  return { focusedId, applyFocus, focusFirst, move, confirm };
}

// Utility: capture next gamepad button press, used by Settings mapping UI
export function captureNextGamepadButton(timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = performance.now();
    const prev = {};
    const tick = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad) continue;
        for (let i = 0; i < pad.buttons.length; i++) {
          const b = pad.buttons[i];
          const was = prev[i] || false;
          if (b.pressed && !was) { resolve({ padIndex: pad.index, buttonIndex: i }); return; }
          prev[i] = b.pressed;
        }
      }
      if (performance.now() - start > timeoutMs) { resolve(null); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
}
