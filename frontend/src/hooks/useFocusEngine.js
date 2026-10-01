// Spatial focus engine for TV / gamepad navigation
// Discovers focusable elements via [data-focusable="true"] and
// navigates with arrows, Enter, Esc, plus the Gamepad API.

import { useEffect, useRef, useState, useCallback } from "react";

const SELECTOR = '[data-focusable="true"]';

function rectOf(el) {
  const r = el.getBoundingClientRect();
  return {
    el,
    id: el.getAttribute("data-focus-id"),
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    w: r.width,
    h: r.height,
  };
}

function distance(a, b, dir) {
  // Reward alignment in the dominant axis of movement
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  if (dir === "right") {
    if (b.left < a.right - 2) return Infinity;
    return Math.abs(dy) * 2.5 + dx;
  }
  if (dir === "left") {
    if (b.right > a.left + 2) return Infinity;
    return Math.abs(dy) * 2.5 + -dx;
  }
  if (dir === "down") {
    if (b.top < a.bottom - 2) return Infinity;
    return Math.abs(dx) * 2.5 + dy;
  }
  if (dir === "up") {
    if (b.bottom > a.top + 2) return Infinity;
    return Math.abs(dx) * 2.5 + -dy;
  }
  return Math.hypot(dx, dy);
}

export function useFocusEngine(options = {}) {
  const { enabled = true, onBack } = options;
  const [focusedId, setFocusedId] = useState(null);
  const focusedRef = useRef(null);

  const applyFocus = useCallback((id) => {
    if (!id) return;
    focusedRef.current = id;
    setFocusedId(id);
    // Update DOM data-focused attrs
    document.querySelectorAll(SELECTOR).forEach((el) => {
      const match = el.getAttribute("data-focus-id") === id;
      if (match) {
        el.setAttribute("data-focused", "true");
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
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      if (best) applyFocus(best.id);
      else applyFocus(current.id);
    },
    [applyFocus]
  );

  const confirm = useCallback(() => {
    const id = focusedRef.current;
    if (!id) return;
    const el = document.querySelector(`[data-focus-id="${id}"]`);
    if (el) el.click();
  }, []);

  // ------- Keyboard -------
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      const key = e.key;
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "Escape", "Backspace"];
      if (!keys.includes(key)) return;
      e.preventDefault();
      if (key === "ArrowUp") move("up");
      else if (key === "ArrowDown") move("down");
      else if (key === "ArrowLeft") move("left");
      else if (key === "ArrowRight") move("right");
      else if (key === "Enter" || key === " ") confirm();
      else if (key === "Escape" || key === "Backspace") onBack && onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, move, confirm, onBack]);

  // ------- Gamepad -------
  useEffect(() => {
    if (!enabled) return;
    let raf;
    let lastNav = 0;
    const DEAD = 0.5;
    const COOLDOWN = 180;
    const lastButtons = {};

    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad) continue;
        const now = performance.now();
        const [axH = 0, axV = 0] = pad.axes;
        // Buttons: 12 up, 13 down, 14 left, 15 right (standard mapping)
        const dUp = pad.buttons[12]?.pressed;
        const dDown = pad.buttons[13]?.pressed;
        const dLeft = pad.buttons[14]?.pressed;
        const dRight = pad.buttons[15]?.pressed;

        let dir = null;
        if (dUp || axV < -DEAD) dir = "up";
        else if (dDown || axV > DEAD) dir = "down";
        else if (dLeft || axH < -DEAD) dir = "left";
        else if (dRight || axH > DEAD) dir = "right";

        if (dir && now - lastNav > COOLDOWN) {
          move(dir);
          lastNav = now;
        }

        // A button (0) confirm, B (1) back, Y (3) menu
        const aPressed = pad.buttons[0]?.pressed;
        const bPressed = pad.buttons[1]?.pressed;
        if (aPressed && !lastButtons.a) confirm();
        if (bPressed && !lastButtons.b && onBack) onBack();
        lastButtons.a = aPressed;
        lastButtons.b = bPressed;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [enabled, move, confirm, onBack]);

  return { focusedId, applyFocus, focusFirst, move, confirm };
}
