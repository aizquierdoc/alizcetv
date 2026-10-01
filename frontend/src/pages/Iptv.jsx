import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Plus, Trash2, RefreshCw, Loader2, Play, AlertTriangle } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { iptvService, mpvService, isElectron, systemService } from "../services/alizceApi";

export default function Iptv() {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [groupFilter, setGroupFilter] = useState("Todos");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSource, setNewSource] = useState({ type: "m3u", name: "", url: "", host: "", user: "", pass: "" });

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => {
      if (showAdd) setShowAdd(false);
      else if (activeId) setActiveId(null);
      else navigate("/");
    },
    onMenu: () => navigate("/settings"),
    onMinimize: () => systemService.minimize(),
  });

  const reload = async () => {
    const list = await iptvService.listSources();
    setSources(list);
    if (list.length && !activeId) setActiveId(list[0].id);
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!activeId) return;
    iptvService.getChannels(activeId).then((ch) => {
      setChannels(ch || []);
      setTimeout(focusFirst, 120);
    });
  }, [activeId, focusFirst]);

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
    if (!confirm("¿Eliminar esta lista?")) return;
    await iptvService.removeSource(id);
    setActiveId(null);
    await reload();
  };

  const playChannel = async (ch) => {
    const res = await mpvService.playUrl({ url: ch.url, title: ch.name });
    if (res?.error) alert(res.error);
  };

  const groups = ["Todos", ...Array.from(new Set(channels.map((c) => c.group || "Sin grupo")))];
  const filtered = groupFilter === "Todos" ? channels : channels.filter((c) => (c.group || "Sin grupo") === groupFilter);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.slice(0, 240).map((ch, i) => (
              <Focusable key={ch.url + i} id={`ch-${i}`} testId={`ch-${i}`} onSelect={() => playChannel(ch)}
                className="relative rounded-xl overflow-hidden aspect-[16/10] text-left glass group">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-950/80">
                  {ch.logo ? (
                    <img src={ch.logo} alt="" className="max-w-[70%] max-h-[60%] object-contain opacity-90" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <Radio size={32} className="text-slate-600" />
                  )}
                </div>
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
            ))}
            {filtered.length > 240 && (
              <div className="col-span-full text-slate-500 text-xs font-mono tracking-widest uppercase mt-2">
                Mostrando 240 de {filtered.length} canales. Usa un filtro de grupo para acotar.
              </div>
            )}
          </div>
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
