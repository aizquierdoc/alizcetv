import React from "react";
import Focusable from "./Focusable";
import { streamingPlatforms } from "../data/mockData";
import { Tv, Radio } from "lucide-react";
import { platformService } from "../services/alizceApi";

export default function StreamingGrid({ onOpenIptv }) {
  const handleLaunch = async (id) => { await platformService.launch(id); };

  return (
    <section className="mt-16" data-testid="section-streaming">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-fuchsia-400 rounded-sm shadow-[0_0_12px_rgba(232,121,249,0.9)]" />
          Plataformas de streaming
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono flex items-center gap-2">
          <Tv size={12} /> App nativa · Modo cine · Externo
        </span>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3 lg:gap-4">
        {streamingPlatforms.map((p) => (
          <Focusable
            key={p.id}
            id={`stream-${p.id}`}
            testId={`tile-${p.id}`}
            onSelect={() => handleLaunch(p.id)}
            className="relative rounded-2xl overflow-hidden aspect-square group bg-slate-900"
          >
            <img
              src={p.logo}
              alt={p.label}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </Focusable>
        ))}

        {/* IPTV tile as 11th slot */}
        <Focusable
          id="stream-iptv"
          testId="tile-iptv"
          onSelect={() => onOpenIptv && onOpenIptv()}
          className="relative rounded-2xl overflow-hidden aspect-square group bg-slate-900"
        >
          <img
            src="./logos/iptv.jpg"
            alt="IPTV"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </Focusable>
      </div>
    </section>
  );
}