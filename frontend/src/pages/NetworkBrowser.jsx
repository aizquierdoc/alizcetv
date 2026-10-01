import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Film, Folder, AlertTriangle, Loader2 } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { smbService, isElectron } from "../services/alizceApi";

export default function NetworkBrowser() {
  const { folderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // folderId maps to share name — passed via state when possible
  const share =
    location.state?.share ||
    (folderId.startsWith("net-") ? folderId.replace("net-", "") : folderId);

  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => {
      if (currentPath) {
        const parent = currentPath.split("\\").slice(0, -1).join("\\");
        setCurrentPath(parent);
      } else {
        navigate(-1);
      }
    },
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    smbService.listFolder(share, currentPath).then((res) => {
      if (res.error) setError(res.error);
      else setItems(res.items || []);
      setLoading(false);
      setTimeout(focusFirst, 150);
    });
  }, [share, currentPath, focusFirst]);

  const openItem = (it) => {
    if (!it.isVideo) {
      // Folder → navigate into
      setCurrentPath(it.path);
      return;
    }
    navigate("/player", {
      state: {
        item: {
          id: it.path,
          title: cleanTitle(it.name),
          subtitle: `${share} · ${currentPath || "/"}`,
          share,
          folder: it.path,
          audio: it.mockMeta?.audio ? [`Español (${it.mockMeta.audio})`, "English (Original)"] : ["Pista principal", "Pista secundaria"],
          subs: it.mockMeta?.audio === "Stereo" ? [] : ["Español", "English"],
          image: it.mockMeta?.poster,
        },
      },
    });
  };

  return (
    <div data-testid="folder-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Focusable
            id="back-btn"
            testId="btn-back"
            onSelect={() => (currentPath ? setCurrentPath(currentPath.split("\\").slice(0, -1).join("\\")) : navigate(-1))}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </Focusable>
          <div className="flex-1 min-w-0">
            <div className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
              Red local {isElectron ? "· SMB en vivo" : "· demo"}
            </div>
            <h2 className="font-title text-3xl text-white uppercase tracking-wider flex items-center gap-3 min-w-0">
              <Film size={22} className="text-emerald-300 shrink-0" />
              <span className="truncate">{share}{currentPath ? ` / ${currentPath.replace(/\\/g, " / ")}` : ""}</span>
            </h2>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 font-mono tracking-widest uppercase text-sm">
            <Loader2 className="animate-spin" size={16} /> Cargando desde SMB…
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl p-6 border border-red-400/30 flex items-start gap-3">
            <AlertTriangle className="text-red-400 mt-0.5" size={20} />
            <div>
              <h3 className="font-title text-lg text-white uppercase tracking-widest">
                Error de conexión SMB
              </h3>
              <p className="text-sm text-slate-300 mt-1 font-mono">{error}</p>
              <p className="text-xs text-slate-500 mt-2">
                Verifica en Ajustes el host y los nombres de los recursos compartidos.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-slate-400 font-mono text-sm tracking-wider">
            Carpeta vacía.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 lg:gap-6">
            {items.map((it, idx) => (
              <Focusable
                key={it.path + idx}
                id={`item-${idx}`}
                testId={`item-${idx}`}
                onSelect={() => openItem(it)}
                className="relative rounded-xl overflow-hidden aspect-[2/3] group text-left"
              >
                {it.mockMeta?.poster ? (
                  <img
                    src={it.mockMeta.poster}
                    alt={it.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 bg-black/60 border border-white/15 rounded uppercase text-slate-300">
                    {it.isVideo ? "Video" : "Carpeta"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3 className="font-title text-sm text-white uppercase tracking-wide line-clamp-2">
                    {cleanTitle(it.name)}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    {it.mockMeta?.year && (
                      <span className="text-[9px] font-mono tracking-widest text-slate-400">
                        {it.mockMeta.year}
                      </span>
                    )}
                    {it.mockMeta?.res && (
                      <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-400/30 rounded text-cyan-300">
                        {it.mockMeta.res}
                      </span>
                    )}
                  </div>
                  {it.mockMeta?.progress != null && (
                    <div className="mt-2 progress-track">
                      <div className="progress-fill" style={{ width: `${it.mockMeta.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-[&[data-focused='true']]:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-cyan-400/20 border border-cyan-300 backdrop-blur flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.8)]">
                    {it.isVideo ? (
                      <Play size={22} className="text-white fill-white ml-1" />
                    ) : (
                      <Folder size={22} className="text-white" />
                    )}
                  </div>
                </div>
              </Focusable>
            ))}
          </div>
        )}
      </main>
      <GamepadLegend />
    </div>
  );
}

function cleanTitle(name) {
  return name.replace(/\.(mkv|mp4|avi|mov|m4v|wmv|ts|webm)$/i, "").replace(/[._]+/g, " ");
}
