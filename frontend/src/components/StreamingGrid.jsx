import React from "react";
import Focusable from "./Focusable";
import { streamingPlatforms } from "../data/mockData";
import { ExternalLink, Tv } from "lucide-react";
import { platformService } from "../services/alizceApi";

export default function StreamingGrid() {
  const handleLaunch = async (id) => {
    await platformService.launch(id);
  };

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

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 lg:gap-5">
        {streamingPlatforms.map((p) => (
          <Focusable
            key={p.id}
            id={`stream-${p.id}`}
            testId={`tile-${p.id}`}
            onSelect={() => handleLaunch(p.id)}
            className="relative rounded-2xl overflow-hidden aspect-[16/10] group"
            style={{ background: p.bg }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 60%)",
              }}
            />
            <div className="relative h-full w-full flex flex-col items-center justify-center gap-2 p-3">
              <span className="font-title text-2xl lg:text-3xl text-white drop-shadow-lg uppercase tracking-wider">
                {p.short}
              </span>
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/80">
                {p.label}
              </span>
            </div>
            <ExternalLink
              size={12}
              className="absolute top-2 right-2 text-white/60"
            />
          </Focusable>
        ))}
      </div>
    </section>
  );
}
