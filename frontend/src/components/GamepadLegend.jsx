import React, { useEffect, useState } from "react";
import { getButtonMap, onButtonMapChange } from "../hooks/useFocusEngine";

const LABELS = { accept: "Aceptar", back: "Volver", menu: "Menú", playpause: "Play", minimize: "Min", shutdown: "Apagar" };
const BTN_NAMES = { 0: "A", 1: "B", 2: "X", 3: "Y", 4: "L1", 5: "R1", 6: "L2", 7: "R2", 8: "Select", 9: "Start", 10: "L3", 11: "R3", 12: "↑", 13: "↓", 14: "←", 15: "→" };

export default function GamepadLegend() {
  const [map, setMap] = useState(getButtonMap());
  useEffect(() => onButtonMapChange(setMap), []);

  const items = ["accept", "back", "menu"].map((k) => {
    const idx = map[k];
    const name = idx == null || idx < 0 ? "—" : (BTN_NAMES[idx] || `#${idx}`);
    return { k, name };
  });

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass rounded-full px-5 py-2.5 flex items-center gap-5" data-testid="gamepad-legend">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-slate-800/80 border border-white/10 text-[11px] font-mono text-cyan-300 shadow-inner">↑ ↓ ← →</span>
        <span className="text-[11px] tracking-[0.18em] uppercase text-slate-300">Navegar</span>
      </div>
      {items.map((b) => (
        <div key={b.k} className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-slate-800/80 border border-white/10 text-[11px] font-mono text-cyan-300 shadow-inner">
            {b.name}
          </span>
          <span className="text-[11px] tracking-[0.18em] uppercase text-slate-300">{LABELS[b.k]}</span>
        </div>
      ))}
    </div>
  );
}
