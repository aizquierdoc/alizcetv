import React from "react";

const buttons = [
  { k: "↑ ↓ ← →", v: "Navegar" },
  { k: "A", v: "Aceptar" },
  { k: "B", v: "Volver" },
  { k: "Y", v: "Menú" },
];

export default function GamepadLegend() {
  return (
    <div
      className="fixed bottom-6 right-8 z-40 glass rounded-full px-5 py-2.5 flex items-center gap-5"
      data-testid="gamepad-legend"
    >
      {buttons.map((b) => (
        <div key={b.k} className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-slate-800/80 border border-white/10 text-[11px] font-mono text-cyan-300 shadow-inner">
            {b.k}
          </span>
          <span className="text-[11px] tracking-[0.18em] uppercase text-slate-300">{b.v}</span>
        </div>
      ))}
    </div>
  );
}
