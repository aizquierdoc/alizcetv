import React from "react";
import { Gamepad2, Zap } from "lucide-react";
import Focusable from "./Focusable";
import { arcadeTile } from "../data/mockData";

export default function ArcadeTile({ onLaunch }) {
  return (
    <section className="mt-16" data-testid="section-arcade">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-pink-400 rounded-sm shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
          Juegos y emulación
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
          8bitdo ultimate 2c
        </span>
      </div>

      <Focusable
        id="arcade-coinops"
        testId="tile-arcade"
        onSelect={onLaunch}
        className="relative w-full rounded-3xl overflow-hidden aspect-[21/8] group text-left"
      >
        <img
          src={arcadeTile.image}
          alt="CoinOps Arcade"
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-[&[data-focused='true']]:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_70%,rgba(236,72,153,0.25))]" />

        <div className="relative h-full flex items-center p-10 lg:p-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/40 text-pink-300 text-[10px] font-mono tracking-[0.3em] uppercase mb-5">
              <Zap size={12} /> {arcadeTile.badge}
            </span>
            <h3 className="font-title text-4xl lg:text-5xl text-white tracking-wider uppercase leading-none mb-4 drop-shadow-[0_6px_24px_rgba(236,72,153,0.5)]">
              {arcadeTile.title}
            </h3>
            <p className="text-slate-300 text-base mb-6 max-w-md">
              {arcadeTile.subtitle}
            </p>
            <div className="inline-flex items-center gap-3 glass px-5 py-3 rounded-full">
              <Gamepad2 size={18} className="text-pink-300" />
              <span className="text-sm font-mono tracking-[0.25em] uppercase text-white">
                Lanzar arcade
              </span>
            </div>
          </div>
        </div>
      </Focusable>
    </section>
  );
}
