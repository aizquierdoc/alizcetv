import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Film } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { networkFolders, folderContents, DEMO_VIDEO } from "../data/mockData";

export default function NetworkBrowser() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const folder = networkFolders.find((f) => f.id === folderId);
  const items = folderContents[folderId] || [];

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => navigate(-1),
  });

  useEffect(() => {
    const t = setTimeout(focusFirst, 150);
    return () => clearTimeout(t);
  }, [focusFirst]);

  if (!folder) return null;

  const openItem = (it) => {
    navigate("/player", {
      state: {
        item: {
          id: it.id,
          title: it.title,
          subtitle: `${folder.name} · ${it.res} · ${it.audio}`,
          path: `${folder.path}/${it.title}.mkv`,
          audio: it.audio === "Stereo" ? ["Español (Stereo)"] : ["Español (5.1)", "English (Original)"],
          subs: it.audio === "Stereo" ? [] : ["Español", "English"],
          image: it.poster,
          progress: it.progress || 0,
        },
      },
    });
  };

  return (
    <div data-testid="folder-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <Focusable
            id="back-btn"
            testId="btn-back"
            onSelect={() => navigate(-1)}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </Focusable>
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
              Red local
            </div>
            <h2 className="font-title text-3xl text-white uppercase tracking-wider flex items-center gap-3">
              <Film size={22} className="text-emerald-300" />
              {folder.name}
              <span className="text-sm text-slate-500 font-mono tracking-widest">
                {folder.path}
              </span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 lg:gap-6">
          {items.map((it) => (
            <Focusable
              key={it.id}
              id={`item-${it.id}`}
              testId={`poster-${it.id}`}
              onSelect={() => openItem(it)}
              className="relative rounded-xl overflow-hidden aspect-[2/3] group text-left"
            >
              <img
                src={it.poster}
                alt={it.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="font-title text-sm text-white uppercase tracking-wide truncate">
                  {it.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] font-mono tracking-widest text-slate-400">
                    {it.year}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-400/30 rounded text-cyan-300">
                    {it.res}
                  </span>
                </div>
                {it.progress != null && (
                  <div className="mt-2 progress-track">
                    <div className="progress-fill" style={{ width: `${it.progress}%` }} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-[&[data-focused='true']]:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-cyan-400/20 border border-cyan-300 backdrop-blur flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.8)]">
                  <Play size={22} className="text-white fill-white ml-1" />
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
