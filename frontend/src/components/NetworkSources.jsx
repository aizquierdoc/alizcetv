import React, { useEffect, useState } from "react";
import { Film, Tv, DownloadCloud, HardDrive, Folder } from "lucide-react";
import Focusable from "./Focusable";
import { smbService, isElectron } from "../services/alizceApi";

const ICONS = { Peliculas: Film, Series: Tv, Descargas: DownloadCloud };
const COVERS = {
  Peliculas: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
  Series:    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
  Descargas: "https://images.unsplash.com/photo-1518676590629-3dcba9c5a555?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
};

export default function NetworkSources({ onOpenFolder }) {
  const [shares, setShares] = useState([]);

  useEffect(() => {
    smbService.listShares().then((list) => {
      // Normalize: pick icon + cover by share name
      const normalized = list.map((s) => {
        const base = s.name || s.share;
        const Icon = ICONS[base] || Folder;
        return {
          ...s,
          icon: Icon,
          cover: s.cover || COVERS[base] || COVERS.Peliculas,
          count: s.count || (isElectron ? "Pulsa para explorar" : "— ítems"),
        };
      });
      setShares(normalized);
    });
  }, []);

  return (
    <section className="mt-16" data-testid="section-network">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-emerald-400 rounded-sm shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          Red local
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono flex items-center gap-2">
          <HardDrive size={12} /> SMB · {isElectron ? "en vivo" : "demo"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {shares.map((f) => {
          const Icon = f.icon;
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
