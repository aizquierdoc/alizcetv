import React from "react";
import { Play, Clock3 } from "lucide-react";
import Focusable from "./Focusable";
import { continueWatching } from "../data/mockData";

export default function ContinueWatching({ onPlay }) {
  return (
    <section className="mt-4" data-testid="section-continue-watching">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-title text-xl lg:text-2xl text-white tracking-widest uppercase flex items-center gap-3">
          <span className="inline-block w-2 h-6 bg-cyan-400 rounded-sm shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
          Continuar viendo
        </h2>
        <span className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
          últimos 3 archivos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {continueWatching.map((item) => (
          <Focusable
            key={item.id}
            id={`cw-${item.id}`}
            testId={`tile-continue-${item.id}`}
            as="button"
            onSelect={() => onPlay(item)}
            className="group relative rounded-2xl overflow-hidden glass text-left"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur border border-white/10">
                <Clock3 size={12} className="text-cyan-300" />
                <span className="text-[10px] tracking-widest uppercase text-slate-200 font-mono">
                  {item.remaining}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-[&[data-focused='true']]:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 border border-cyan-300 backdrop-blur flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.8)]">
                  <Play size={26} className="text-white fill-white ml-1" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-title text-base text-white tracking-wide uppercase truncate">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 truncate font-mono tracking-wide">
                {item.subtitle}
              </p>
              <div className="mt-3 progress-track">
                <div className="progress-fill" style={{ width: `${item.progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-mono text-cyan-300 tracking-widest">
                  {item.progress}%
                </span>
                <span className="text-[10px] font-mono text-slate-500 tracking-widest truncate max-w-[65%]">
                  {item.path.split("/").pop()}
                </span>
              </div>
            </div>
          </Focusable>
        ))}
      </div>
    </section>
  );
}
