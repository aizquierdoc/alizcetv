import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Plus, Trash2, RefreshCw, Loader2, Play, AlertTriangle, Star } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { iptvService, mpvService, isElectron, systemService } from "../services/alizceApi";
import { useConfirm } from "../components/ConfirmProvider";

function fmtTime(ms) {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

export default function Iptv() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [groupFilter, setGroupFilter] = useState("Todos");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSource, setNewSource] = useState({ type: "m3u", name: "", url: "", host: "", user: "", pass: "" });
  const [focusedChannel, setFocusedChannel] = useState(null);
  const [epg, setEpg] = useState({ now: null, next: null });
  const epgReqId = useRef(0);

  const toggleFav = async () => {
    if (!activeId || !focusedChannel) return;
    const next = await iptvService.toggleFavorite(activeId, focusedChannel.name);
    setFavorites(next);
  };

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => {
      if (showAdd) setShowAdd(false);
      else navigate("/");
    },
    onFavorite: toggleFav,
    onMinimize: () => systemService.minimize(),
  });

  const reload = async () => {
    const list = await iptvService.listSources();
    setSources(list);
    if (list.length && !activeId) setActiveId(list[0].id);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!activeId) return;
    Promise.all([iptvService.getChannels(activeId), iptvService.getFavorites(activeId)]).then(([ch, favs]) => {
      setChannels(ch || []);
      setFavorites(favs || []);
      setTimeout(focusFirst, 120);
    });
  }, [activeId, focusFirst]);

  // Track focus via DOM mutation observer on data-focused
  useEffect(() => {
    const check = () => {
      const el = document.querySelector('[data-focused="true"][data-focus-id^="ch-"]');
      if (!el) { setFocusedChannel(null); return; }
      const id = el.getAttribute("data-focus-id");
      const idx = parseInt(id.replace("ch-", ""), 10);
      // Use the computed `filtered` from render — read ch data from DOM attribute instead
      const name = el.getAttribute("data-channel-name");
      const tvgId = el.getAttribute("data-tvg-id") || null;
      const xtreamId = el.getAttribute("data-xtream-id") || null;
      if (!isNaN(idx)) setFocusedChannel({ idx, name, tvgId, xtreamId });
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-focused"] });
    check();
    return () => observer.disconnect();
  }, [channels, favorites, groupFilter]);

  // When focused channel changes, fetch EPG (debounced)
  useEffect(() => {
    if (!focusedChannel || !activeId) { setEpg({ now: null, next: null }); return; }
    const req = ++epgReqId.current;
    const t = setTimeout(async () => {
      const res = await iptvService.getEpg(activeId, focusedChannel);
      if (req === epgReqId.current) setEpg(res || { now: null, next: null });
    }, 220);
    return () => clearTimeout(t);
  }, [focusedChannel, activeId]);

  // Keyboard shortcut: 'y' toggles favorite on focused channel (web + pad fallback)
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "y" || e.key === "Y" || e.key === "f" || e.key === "F") {
        if (focusedChannel) { e.preventDefault(); toggleFav(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [focusedChannel]);

  const refresh = async (id) => {
    setLoading(true);
    const res = await iptvService.refresh(id);
    setLoading(false);
    if (res?.error) alert(res.error);
    const ch = await iptvService.getChannels(id);
    setChannels(ch);
  };

  const addSource = async () => {
    if (!newSource.name) return alert("Nombre requerido");
    if (newSource.type === "m3u" && !newSource.url) return alert("URL de la lista requerida");
    if (newSource.type === "xtream" && (!newSource.host || !newSource.user || !newSource.pass)) return alert("Host, usuario y contraseña son requeridos para Xtream");
    const created = await iptvService.addSource(newSource);
    setShowAdd(false);
    setNewSource({ type: "m3u", name: "", url: "", host: "", user: "", pass: "" });
    await reload();
    setActiveId(created.id);
    await refresh(created.id);
  };

  const removeSource = async (id) => {
    const ok = await confirm({
      title: "Eliminar lista IPTV",
      message: "Se eliminara esta lista y su cache de canales. Esta accion no se puede deshacer.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    await iptvService.removeSource(id);
    setActiveId(null);
    await reload();
  };

  const playChannel = async (ch) => {
    const res = await mpvService.playUrl({ url: ch.url, title: ch.name });
    if (res?.error) alert(res.error);
  };

  const groups = ["Todos", ...Array.from(new Set(channels.map((c) => c.group || "Sin grupo")))];
  const groupFiltered = groupFilter === "Todos" ? channels : channels.filter((c) => (c.group || "Sin grupo") === groupFilter);
  const favSet = new Set(favorites);
  // Favorites first, then rest preserving order
  const filtered = [
    ...groupFiltered.filter((c) => favSet.has(c.name)),
    ...groupFiltered.filter((c) => !favSet.has(c.name)),
  ];
  const favCount = filtered.filter((c) => favSet.has(c.name)).length;

  return (
    <div data-testid="iptv-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pt-2 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Focusable id="iptv-back" testId="btn-iptv-back" onSelect={() => navigate("/")}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </Focusable>
          <div className="flex-1 min-w-0">
            <div className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
              IPTV {!isElectron && "· demo"}
            </div>
            <h2 className="font-title text-4xl text-white uppercase tracking-wider flex items-center gap-3">
              <Radio size={28} className="text-amber-400" /> Directos
            </h2>
          </div>
          <Focusable id="iptv-add" testId="btn-iptv-add" onSelect={() => setShowAdd(true)}
            className="h-11 px-5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 flex items-center gap-2 font-mono tracking-widest uppercase text-xs">
            <Plus size={14} /> Añadir lista
          </Focusable>
        </div>

        {/* Sources tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {sources.length === 0 && (
            <div className="text-slate-500 text-sm font-mono tracking-widest uppercase">
              No hay listas IPTV. Añade una con el botón de arriba.
            </div>
          )}
          {sources.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <Focusable id={`src-${s.id}`} testId={`tab-src-${s.id}`} onSelect={() => setActiveId(s.id)}
                className={`h-10 px-4 rounded-full text-xs font-mono tracking-widest uppercase ${activeId === s.id ? "bg-amber-400 text-black" : "glass text-white"}`}>
                {s.name} <span className="opacity-50 ml-2">· {s.type}</span>
              </Focusable>
              {activeId === s.id && (
                <>
                  <Focusable id={`src-${s.id}-refresh`} testId={`btn-refresh-${s.id}`} onSelect={() => refresh(s.id)}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-white">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </Focusable>
                  <Focusable id={`src-${s.id}-del`} testId={`btn-del-${s.id}`} onSelect={() => removeSource(s.id)}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-red-300">
                    <Trash2 size={14} />
                  </Focusable>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Group filter */}
        {channels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6 max-h-20 overflow-hidden">
            {groups.slice(0, 20).map((g) => (
              <Focusable key={g} id={`grp-${g}`} testId={`grp-${g}`} onSelect={() => setGroupFilter(g)}
                className={`h-9 px-3 rounded-full text-[11px] font-mono tracking-widest uppercase ${groupFilter === g ? "bg-cyan-400 text-black" : "glass text-slate-300"}`}>
                {g}
              </Focusable>
            ))}
            {groups.length > 20 && <span className="text-[11px] font-mono text-slate-500">+{groups.length - 20} grupos…</span>}
          </div>
        )}

        {/* Channels grid */}
        {loading && (
          <div className="text-slate-400 font-mono tracking-widest uppercase text-sm flex items-center gap-3">
            <Loader2 className="animate-spin" size={16}/> Cargando canales…
          </div>
        )}

        {!loading && activeId && filtered.length === 0 && (
          <div className="glass rounded-2xl p-6 flex items-start gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
            <div>
              <h3 className="font-title text-lg text-white uppercase tracking-widest">Lista vacía</h3>
              <p className="text-sm text-slate-300 mt-1">Pulsa el botón ⟳ para descargar los canales ahora mismo.</p>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            {/* EPG strip for currently focused channel */}
            {epg.now && (
              <div className="glass rounded-xl px-5 py-3 mb-5 flex items-start gap-4" data-testid="epg-strip">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[9px] font-mono tracking-widest uppercase text-amber-300">AHORA</span>
                  <span className="font-mono text-xs text-slate-200 mt-0.5">{fmtTime(epg.now.start)}{epg.now.stop ? ` – ${fmtTime(epg.now.stop)}` : ""}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-title text-sm text-white uppercase tracking-wide truncate" data-testid="epg-now-title">{epg.now.title}</h4>
                  {epg.now.desc && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{epg.now.desc}</p>}
                </div>
                {epg.next && (
                  <div className="hidden md:flex flex-col items-start border-l border-white/10 pl-4 min-w-[180px]">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400">LUEGO · {fmtTime(epg.next.start)}</span>
                    <span className="text-xs text-slate-200 line-clamp-1 mt-0.5" data-testid="epg-next-title">{epg.next.title}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.slice(0, 240).map((ch, i) => {
              const isFav = favSet.has(ch.name);
              const isFirstNonFav = i === favCount && favCount > 0;
              return (
                <React.Fragment key={ch.url + i}>
                  {isFirstNonFav && (
                    <div className="col-span-full text-[10px] font-mono tracking-[0.3em] uppercase text-slate-500 border-t border-white/5 pt-3 mt-1">
                      Todos los canales
                    </div>
                  )}
                  <Focusable
                    id={`ch-${i}`} testId={`ch-${i}`}
                    onSelect={() => playChannel(ch)}
                    data-channel-name={ch.name}
                    data-tvg-id={ch.tvgId || ""}
                    data-xtream-id={ch.xtreamId || ""}
                    className="relative rounded-xl overflow-hidden aspect-[16/10] text-left glass group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-950/80">
                      {ch.logo ? (
                        <img src={ch.logo} alt="" className="max-w-[70%] max-h-[60%] object-contain opacity-90" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                      ) : (
                        <Radio size={32} className="text-slate-600" />
                      )}
                    </div>
                    {isFav && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400/90 flex items-center justify-center shadow-md" data-testid={`fav-${i}`}>
                        <Star size={12} className="text-slate-900 fill-slate-900" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent">
                      <h3 className="font-title text-sm text-white uppercase tracking-wide line-clamp-1">{ch.name}</h3>
                      <p className="text-[10px] font-mono tracking-widest text-amber-300/80 line-clamp-1">{ch.group}</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-[&[data-focused='true']]:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.8)]">
                        <Play size={22} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </Focusable>
                </React.Fragment>
              );
            })}
            {filtered.length > 240 && (
              <div className="col-span-full text-slate-500 text-xs font-mono tracking-widest uppercase mt-2">
                Mostrando 240 de {filtered.length} canales. Usa un filtro de grupo para acotar.
              </div>
            )}
            </div>

            {/* Favorites legend */}
            <div className="mt-6 text-[10px] font-mono tracking-widest uppercase text-slate-500">
              Pulsa <span className="text-amber-300">Y</span> en un canal enfocado para añadirlo/quitarlo de favoritos.
            </div>
          </>
        )}

        {/* Add source modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-6" data-testid="iptv-add-modal">
            <div className="glass-strong rounded-2xl p-8 w-full max-w-xl">
              <h3 className="font-title text-2xl text-white uppercase tracking-widest mb-5 flex items-center gap-3">
                <Plus size={22} className="text-amber-400"/> Nueva lista IPTV
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Focusable id="type-m3u" testId="type-m3u" onSelect={() => setNewSource((s) => ({...s, type: "m3u"}))}
                    className={`flex-1 py-2 rounded-xl font-mono tracking-widest uppercase text-xs ${newSource.type === "m3u" ? "bg-amber-400 text-black" : "glass text-white"}`}>
                    Lista M3U / M3U8
                  </Focusable>
                  <Focusable id="type-xtream" testId="type-xtream" onSelect={() => setNewSource((s) => ({...s, type: "xtream"}))}
                    className={`flex-1 py-2 rounded-xl font-mono tracking-widest uppercase text-xs ${newSource.type === "xtream" ? "bg-amber-400 text-black" : "glass text-white"}`}>
                    Xtream Codes
                  </Focusable>
                </div>
                <LabeledInput label="Nombre de la lista" value={newSource.name} onChange={(v) => setNewSource((s)=>({...s, name: v}))} testId="input-src-name"/>
                {newSource.type === "m3u" ? (
                  <LabeledInput label="URL de la lista" value={newSource.url} onChange={(v) => setNewSource((s)=>({...s, url: v}))} placeholder="http://servidor.com/get.php?... .m3u" testId="input-src-url"/>
                ) : (
                  <>
                    <LabeledInput label="Host (incluye http:// y puerto)" value={newSource.host} onChange={(v) => setNewSource((s)=>({...s, host: v}))} placeholder="http://miproveedor.com:8080" testId="input-src-host"/>
                    <LabeledInput label="Usuario" value={newSource.user} onChange={(v) => setNewSource((s)=>({...s, user: v}))} testId="input-src-user"/>
                    <LabeledInput label="Contraseña" value={newSource.pass} onChange={(v) => setNewSource((s)=>({...s, pass: v}))} type="password" testId="input-src-pass"/>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Focusable id="cancel-add" testId="btn-cancel-add" onSelect={() => setShowAdd(false)}
                  className="h-11 px-5 rounded-full glass text-white font-mono tracking-widest uppercase text-xs">
                  Cancelar
                </Focusable>
                <Focusable id="confirm-add" testId="btn-confirm-add" onSelect={addSource}
                  className="h-11 px-5 rounded-full bg-amber-400 text-black font-mono tracking-widest uppercase text-xs">
                  Añadir
                </Focusable>
              </div>
            </div>
          </div>
        )}
      </main>
      <GamepadLegend />
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text", placeholder, testId }) {
  return (
    <Focusable id={testId} testId={testId} as="div" onSelect={() => {}}
      className="focusable-input block cursor-text">
      <label className="block text-[10px] font-mono tracking-[0.25em] uppercase text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono tracking-wider focus:outline-none focus:border-amber-400 text-sm"/>
    </Focusable>
  );
}
