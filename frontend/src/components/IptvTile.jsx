import React from "react";
import { Radio, Zap } from "lucide-react";
import Focusable from "./Focusable";

export default function IptvTile({ onLaunch }) {
  return (
    <section className="mt-16" data-testid="section-iptv">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-amber-400 rounded-sm shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
          IPTV & Directos
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
          m3u · xtream codes
        </span>
      </div>

      <Focusable
        id="iptv-tile"
        testId="tile-iptv"
        onSelect={onLaunch}
        className="relative w-full rounded-3xl overflow-hidden aspect-[21/7] group text-left"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(251,191,36,0.35), transparent 60%), radial-gradient(circle at 85% 70%, rgba(14,165,233,0.4), transparent 60%), linear-gradient(135deg, #0a0d18 0%, #060811 100%)",
          }}
        />
        {/* Scan lines */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)",
          }}
        />
        <div className="relative h-full flex items-center p-10 lg:p-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono tracking-[0.3em] uppercase mb-5">
              <Zap size={12} /> directo · 24/7
            </span>
            <h3 className="font-title text-4xl lg:text-5xl text-white tracking-wider uppercase leading-none mb-4 drop-shadow-[0_6px_24px_rgba(251,191,36,0.4)]">
              IPTV
            </h3>
            <p className="text-slate-300 text-base mb-6 max-w-md">
              Añade listas m3u o conéctate con Xtream Codes (usuario y contraseña) para ver TV en directo, deportes y canales temáticos.
            </p>
            <div className="inline-flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Radio size={18} className="text-amber-300" />
              <span className="text-sm font-mono tracking-[0.25em] uppercase text-white">Abrir IPTV</span>
            </div>
          </div>
        </div>
      </Focusable>
    </section>
  );
}
