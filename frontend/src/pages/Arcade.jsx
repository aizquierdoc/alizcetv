import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Play } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { systemService } from "../services/alizceApi";

const GAMES = [
  { id: "sf2", title: "Street Fighter II", year: 1991, platform: "CP-S", hue: "#ec4899" },
  { id: "mk", title: "Mortal Kombat", year: 1992, platform: "ARCADE", hue: "#ef4444" },
  { id: "mvsc", title: "Marvel vs. Capcom", year: 1998, platform: "CP-S2", hue: "#f59e0b" },
  { id: "pacman", title: "Pac-Man", year: 1980, platform: "ARCADE", hue: "#eab308" },
  { id: "metal", title: "Metal Slug 3", year: 2000, platform: "NEO-GEO", hue: "#22d3ee" },
  { id: "kof", title: "The King of Fighters 98", year: 1998, platform: "NEO-GEO", hue: "#8b5cf6" },
  { id: "donkey", title: "Donkey Kong", year: 1981, platform: "ARCADE", hue: "#f97316" },
  { id: "galaga", title: "Galaga", year: 1981, platform: "ARCADE", hue: "#3b82f6" },
];

export default function Arcade() {
  const navigate = useNavigate();
  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => navigate("/"),
    onMenu: () => navigate("/settings"),
    onMinimize: () => systemService.minimize(),
  });

  useEffect(() => {
    const t = setTimeout(focusFirst, 150);
    return () => clearTimeout(t);
  }, [focusFirst]);

  return (
    <div data-testid="arcade-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pt-2 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Focusable
            id="arcade-back"
            testId="btn-arcade-back"
            onSelect={() => navigate("/")}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </Focusable>
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
              CoinOps · RetroArch
            </div>
            <h2 className="font-title text-4xl text-white uppercase tracking-wider flex items-center gap-3">
              <Gamepad2 size={28} className="text-pink-400" />
              Arcade
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {GAMES.map((g) => (
            <Focusable
              key={g.id}
              id={`game-${g.id}`}
              testId={`game-${g.id}`}
              onSelect={() => alert(`Lanzando ${g.title} vía CoinOps…\n(stub de demostración)`)}
              className="relative rounded-2xl overflow-hidden aspect-[16/10] text-left"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${g.hue}55, transparent 60%), linear-gradient(180deg, #0b0e18 0%, #06080f 100%)`,
              }}
            >
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded border border-white/15 bg-black/40 text-slate-300">
                    {g.platform}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-slate-500">
                    {g.year}
                  </span>
                </div>
                <div>
                  <h3 className="font-title text-xl text-white uppercase tracking-wider leading-tight mb-3">
                    {g.title}
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <Play size={12} className="text-pink-300" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">Insert coin</span>
                  </div>
                </div>
              </div>
            </Focusable>
          ))}
        </div>
      </main>
      <GamepadLegend />
    </div>
  );
}
