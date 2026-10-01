import React from "react";
import { Film, Tv, DownloadCloud, HardDrive } from "lucide-react";
import Focusable from "./Focusable";
import { networkFolders } from "../data/mockData";

const ICONS = { film: Film, tv: Tv, download: DownloadCloud };

export default function NetworkSources({ onOpenFolder }) {
  return (
    <section className="mt-16" data-testid="section-network">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-emerald-400 rounded-sm shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          Red local
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono flex items-center gap-2">
          <HardDrive size={12} /> //192.168.1.200
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {networkFolders.map((f) => {
          const Icon = ICONS[f.icon] || Film;
          return (
            <Focusable
              key={f.id}
              id={`net-${f.id}`}
              testId={`tile-${f.id}`}
              onSelect={() => onOpenFolder(f)}
              className="relative rounded-2xl overflow-hidden aspect-[16/9] group text-left"
            >
              <img
                src={f.cover}
                alt={f.name}
                className="absolute inset-0 w-full h-full object-cover opacity-55 group-[&[data-focused='true']]:opacity-80 transition-opacity"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-emerald-900/30" />
              <div className="relative h-full w-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl glass-strong flex items-center justify-center">
                    <Icon size={22} className="text-emerald-300" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-300/80 px-2 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/10">
                    SMB
                  </span>
                </div>
                <div>
                  <h3 className="font-title text-2xl text-white uppercase tracking-wider">
                    {f.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-mono tracking-wider">
                    {f.count}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                    {f.path}
                  </p>
                </div>
              </div>
            </Focusable>
          );
        })}
      </div>
    </section>
  );
}
