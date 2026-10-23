import React from "react";
import { useNavigate } from "react-router-dom";
import Focusable from "./Focusable";
import { streamingPlatforms } from "../data/mockData";

import { platformService } from "../services/alizceApi";

export default function StreamingGrid({ onOpenIptv }) {
  const navigate = useNavigate();
  const handleLaunch = async (id) => { await platformService.launch(id); };

  return (
    <section className="mt-16" data-testid="section-streaming">

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 lg:gap-4">
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

        {/* Arcade tile (juegos y emulacion) */}
        <Focusable
          id="stream-arcade"
          testId="tile-arcade"
          onSelect={() => navigate("/juegos")}
          className="relative rounded-2xl overflow-hidden aspect-square group bg-slate-900"
        >
          <img
            src="./logos/games.png"
            alt="Juegos"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </Focusable>
      </div>
    </section>
  );
}