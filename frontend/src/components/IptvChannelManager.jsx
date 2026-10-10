import React, { useEffect, useState, useMemo } from "react";
import { Radio, EyeOff, RotateCcw, CheckSquare, Square, Loader2, Trash2 } from "lucide-react";
import Focusable from "./Focusable";
import { iptvService, isElectron } from "../services/alizceApi";
import { useConfirm } from "./ConfirmProvider";

export default function IptvChannelManager() {
  const confirm = useConfirm();
  const [sources, setSources] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [visible, setVisible] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  const reload = async (id) => {
    if (!id) return;
    setLoading(true);
    const [ch, hd] = await Promise.all([
      iptvService.getChannels(id),
      iptvService.getHiddenChannels(id),
    ]);
    setVisible(ch || []);
    setHidden(hd || []);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    iptvService.listSources().then((list) => {
      setSources(list || []);
      if (list && list.length) setActiveId(list[0].id);
    });
  }, []);

  useEffect(() => { reload(activeId); }, [activeId]);

  const list = showHidden ? hidden : visible;
  const filtered = useMemo(() => {
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((c) =>
      (c.name || "").toLowerCase().includes(f) ||
      (c.group || "").toLowerCase().includes(f)
    );
  }, [list, filter]);

  const toggleOne = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.name)));
  };

  const hideSelected = async () => {
    if (!activeId || selected.size === 0) return;
    const ok = await confirm({
      title: "Ocultar canales",
      message: `Vas a ocultar ${selected.size} canal(es). Podras restaurarlos luego desde la pestana "Ocultos".`,
      confirmLabel: "Ocultar",
      danger: true,
    });
    if (!ok) return;
    await iptvService.hideChannels(activeId, Array.from(selected));
    await reload(activeId);
  };

  const restoreSelected = async () => {
    if (!activeId || selected.size === 0) return;
    await iptvService.unhideChannels(activeId, Array.from(selected));
    await reload(activeId);
  };

  const restoreAll = async () => {
    if (!activeId) return;
    const ok = await confirm({
      title: "Restaurar canales",
      message: "Se restauraran TODOS los canales ocultos de esta lista.",
      confirmLabel: "Restaurar",
    });
    if (!ok) return;
    await iptvService.unhideAll(activeId);
    await reload(activeId);
  };

  if (!isElectron) {
    return (
      <div className="glass rounded-2xl p-4 border border-amber-400/30 bg-amber-500/5 text-amber-200 text-sm">
        La gestion de canales IPTV solo funciona en la app de Windows.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4" data-testid="iptv-channel-manager">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mr-2">Lista:</span>
        {sources.length === 0 && (
          <span className="text-xs text-slate-500">No hay listas IPTV anadidas.</span>
        )}
        {sources.map((s) => (
          <Focusable
            key={s.id}
            id={"mgr-src-" + s.id}
            testId={"mgr-src-" + s.id}
            onSelect={() => setActiveId(s.id)}
            className={"h-9 px-4 rounded-full text-[11px] font-mono tracking-widest uppercase " +
              (activeId === s.id ? "bg-amber-400 text-black" : "glass text-white")}
          >
            {s.name}
          </Focusable>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Focusable
          id="mgr-tab-visible"
          testId="mgr-tab-visible"
          onSelect={() => { setShowHidden(false); setSelected(new Set()); }}
          className={"h-9 px-4 rounded-full text-[11px] font-mono tracking-widest uppercase " +
            (!showHidden ? "bg-cyan-400 text-black" : "glass text-slate-300")}
        >
          Activos ({visible.length})
        </Focusable>
        <Focusable
          id="mgr-tab-hidden"
          testId="mgr-tab-hidden"
          onSelect={() => { setShowHidden(true); setSelected(new Set()); }}
          className={"h-9 px-4 rounded-full text-[11px] font-mono tracking-widest uppercase " +
            (showHidden ? "bg-red-400 text-black" : "glass text-slate-300")}
        >
          Ocultos ({hidden.length})
        </Focusable>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por nombre o grupo..."
          className="flex-1 min-w-[200px] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
        />
        <Focusable
          id="mgr-toggle-all"
          testId="mgr-toggle-all"
          onSelect={toggleAll}
          className="h-10 px-4 rounded-full glass text-white flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase"
        >
          {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={14}/> : <Square size={14}/>}
          {selected.size === filtered.length && filtered.length > 0 ? "Quitar todo" : "Seleccionar todo"}
        </Focusable>

        {!showHidden ? (
          <Focusable
            id="mgr-hide"
            testId="mgr-hide"
            onSelect={hideSelected}
            className={"h-10 px-4 rounded-full flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase " +
              (selected.size === 0
                ? "glass text-slate-500 cursor-not-allowed"
                : "bg-red-500/20 border border-red-400/50 text-red-200")}
          >
            <EyeOff size={14}/> Ocultar ({selected.size})
          </Focusable>
        ) : (
          <>
            <Focusable
              id="mgr-restore"
              testId="mgr-restore"
              onSelect={restoreSelected}
              className={"h-10 px-4 rounded-full flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase " +
                (selected.size === 0
                  ? "glass text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200")}
            >
              <RotateCcw size={14}/> Restaurar ({selected.size})
            </Focusable>
            <Focusable
              id="mgr-restore-all"
              testId="mgr-restore-all"
              onSelect={restoreAll}
              className="h-10 px-4 rounded-full glass text-white flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase"
            >
              Restaurar todos
            </Focusable>
          </>
        )}
      </div>

      {loading && (
        <div className="text-slate-400 font-mono text-xs tracking-widest uppercase flex items-center gap-2 py-4">
          <Loader2 className="animate-spin" size={14}/> Cargando...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-slate-500 text-sm py-6 text-center font-mono tracking-widest uppercase">
          {showHidden ? "No hay canales ocultos en esta lista." : "No hay canales. Refresca la lista primero."}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5 rounded-xl border border-white/5">
          {filtered.map((ch, i) => {
            const isSel = selected.has(ch.name);
            return (
              <Focusable
                key={ch.name + i}
                id={"mgr-ch-" + i}
                testId={"mgr-ch-" + i}
                onSelect={() => toggleOne(ch.name)}
                className={"flex items-center gap-3 px-4 py-2.5 cursor-pointer " + (isSel ? "bg-amber-400/10" : "")}
              >
                <div className={"w-5 h-5 rounded border flex items-center justify-center shrink-0 " +
                  (isSel ? "bg-amber-400 border-amber-400" : "border-white/30")}>
                  {isSel && <Trash2 size={11} className="text-black"/>}
                </div>
                {ch.logo ? (
                  <img src={ch.logo} alt="" className="w-8 h-8 object-contain shrink-0"
                       onError={(e) => { e.target.style.display = "none"; }}/>
                ) : (
                  <Radio size={16} className="text-slate-600 shrink-0"/>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{ch.name}</div>
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase truncate">
                    {ch.group || "Sin grupo"}
                  </div>
                </div>
              </Focusable>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Los canales ocultos siguen en la lista original pero no se muestran ni se
        reproducen. Puedes restaurarlos en cualquier momento desde la pestana
        "Ocultos".
      </p>
    </div>
  );
}