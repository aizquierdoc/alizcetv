// Spatial focus engine for TV navigation with keyboard (arrows, Enter, Esc)
// - Discovers focusable elements via [data-focusable="true"]
// - Lets native text inputs capture their own keystrokes
// - Gamepad handling has been removed: only games use it, not AlizceTV UI

import { useEffect, useRef, useState, useCallback } from "react";

const SELECTOR = '[data-focusable="true"]';

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

export function useFocusEngine(options = {}) {
  const { enabled = true, onBack, onMenu } = options;
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
      else if (key === " ")      confirm();
      else if (key === "Escape" || key === "Backspace") onBack && onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, move, confirm, onBack]);

  return { focusedId, applyFocus, focusFirst, move, confirm };
}

