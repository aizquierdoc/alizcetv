import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { juegoService, systemService } from "../services/alizceApi";

function sizeForTotal(total) {
  if (total <= 3) return { card: "w-56", label: "text-base" };
  if (total <= 6) return { card: "w-48", label: "text-sm" };
  if (total <= 10) return { card: "w-40", label: "text-sm" };
  if (total <= 15) return { card: "w-32", label: "text-xs" };
  if (total <= 20) return { card: "w-28", label: "text-xs" };
  if (total <= 30) return { card: "w-24", label: "text-[10px]" };
  return { card: "w-20", label: "text-[10px]" };
}

function CoverChip({ juego, sizeClass, labelClass, arcade, onSelect }) {
  const coverSrc = juego.cover
    ? juego.cover.startsWith("preset:") || juego.cover.startsWith("file://")
      ? juego.cover.startsWith("preset:")
        ? `./logos/presets/${juego.cover.replace("preset:", "")}.png`
        : juego.cover
      : `file://${juego.cover.replace(/\\/g, "/")}`
    : null;

  return (
    <Focusable
      id={`juego-${juego.id}`}
      testId={`tile-juego-${juego.id}`}
      onSelect={onSelect}
      className={`relative ${sizeClass} aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 group`}
    >
      {coverSrc ? (
        <img
          src={coverSrc}
          alt={juego.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
          <Gamepad2 size={48} className="text-pink-300/60" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
        <div className={`font-title text-white uppercase tracking-wider leading-tight ${labelClass} truncate text-center`}>
          {juego.title}
        </div>
        {arcade && (
          <div className="mt-1 text-center">
            <span className="inline-block text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-pink-500/30 border border-pink-400/50 text-pink-100">
              Arcade
            </span>
          </div>
        )}
      </div>
    </Focusable>
  );
}

export default function Juegos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [juegos, setJuegos] = useState(null);

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => navigate("/"),
    onMenu: () => navigate("/settings"),
    onMinimize: () => systemService.minimize(),
  });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      juegoService.list().then((list) => {
        if (!cancelled) setJuegos(list);
      });
    };
    load();
    const id = setInterval(load, 1500);
    return () => { cancelled = true; clearInterval(id); };
  }, [location.pathname]);

  useEffect(() => {
    if (juegos) {
      const t = setTimeout(focusFirst, 150);
      return () => clearTimeout(t);
    }
  }, [juegos, focusFirst]);

  const handleLaunch = async (id) => {
    const res = await juegoService.launch(id);
    if (res?.error) alert(res.error);
  };

  if (!juegos) return null;

  const arcadeJuegos = juegos.filter((j) => j.type === "arcade");
  const otroJuegos = juegos.filter((j) => j.type !== "arcade");

  const empty = arcadeJuegos.length === 0 && otroJuegos.length === 0;

  // Los arcade son un escalon mas grandes que los otros
  const baseSize = sizeForTotal(otroJuegos.length + arcadeJuegos.length);
  const arcadeSize = {
    card: baseSize.card === "w-56" ? "w-64" : baseSize.card.replace(/\d+$/, (n) => String(Number(n) + 8)),
    label: baseSize.label,
  };

  return (
    <div data-testid="juegos-screen" className="min-h-screen flex flex-col">
      <TopBar />
      <main className="relative flex-1 flex flex-col px-10 lg:px-14 pt-2 pb-24">

        <div className="flex items-center gap-4 mb-6 shrink-0">
          <Focusable
            id="juegos-back"
            testId="btn-juegos-back"
            onSelect={() => navigate("/")}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </Focusable>
          <h2 className="font-title text-4xl text-white uppercase tracking-wider flex items-center gap-3">
            <Gamepad2 size={28} className="text-pink-400" /> Juegos
          </h2>
        </div>

        {empty ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 font-mono tracking-widest uppercase text-sm text-center">
              Ve a Ajustes → Juegos para configurar tus juegos.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">

            {arcadeJuegos.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4">
                {arcadeJuegos.map((j) => (
                  <CoverChip
                    key={j.id}
                    juego={j}
                    sizeClass={arcadeSize.card}
                    labelClass={arcadeSize.label}
                    arcade
                    onSelect={() => handleLaunch(j.id)}
                  />
                ))}
              </div>
            )}

            {otroJuegos.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 max-w-full">
                {otroJuegos.map((j) => (
                  <CoverChip
                    key={j.id}
                    juego={j}
                    sizeClass={baseSize.card}
                    labelClass={baseSize.label}
                    arcade={false}
                    onSelect={() => handleLaunch(j.id)}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}