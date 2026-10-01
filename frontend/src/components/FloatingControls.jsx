import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Power, Minus, X, AlertTriangle } from "lucide-react";
import { systemService, isElectron } from "../services/alizceApi";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const pad = (n) => n.toString().padStart(2, "0");

export default function FloatingControls({ onOpenMenu }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmShut, setConfirmShut] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const seconds = pad(now.getSeconds());
  const date = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const handleShutdown = async () => {
    if (!confirmShut) { setConfirmShut(true); setTimeout(() => setConfirmShut(false), 4000); return; }
    await systemService.shutdown();
    setMenuOpen(false);
    setConfirmShut(false);
  };
  const handleClose = async () => {
    if (!confirmClose) { setConfirmClose(true); setTimeout(() => setConfirmClose(false), 4000); return; }
    await systemService.close();
  };

  return (
    <div ref={menuRef} className="fixed top-6 right-6 z-50 flex items-start gap-3" data-testid="floating-controls">
      {/* Clock */}
      <div className="glass rounded-2xl px-5 py-3 text-right" data-testid="clock-container">
        <div className="font-title text-2xl text-white tracking-wider tabular-nums leading-none" data-testid="clock-time">
          {time}<span className="text-cyan-300 text-lg">:{seconds}</span>
        </div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-slate-400 mt-1 font-mono" data-testid="clock-date">
          {date}
        </div>
      </div>

      {/* Settings / system menu button */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-slate-200 hover:text-white"
        aria-label="Menú del sistema"
        data-testid="btn-system-menu"
      >
        <Settings size={20} className={menuOpen ? "rotate-45 transition-transform" : "transition-transform"} />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          className="absolute right-0 top-16 glass-strong rounded-2xl p-2 w-64 shadow-2xl"
          data-testid="system-menu-dropdown"
        >
          <button
            data-testid="menu-settings"
            onClick={() => { navigate("/settings"); setMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white text-sm font-mono tracking-widest uppercase"
          >
            <Settings size={16} className="text-cyan-300" />
            Ajustes
          </button>
          <button
            data-testid="menu-minimize"
            onClick={() => { systemService.minimize(); setMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white text-sm font-mono tracking-widest uppercase"
          >
            <Minus size={16} className="text-slate-300" />
            Ver escritorio
          </button>
          <button
            data-testid="menu-close"
            onClick={handleClose}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono tracking-widest ${confirmClose ? "bg-amber-500/15 text-amber-200" : "hover:bg-white/5 text-white"}`}
            style={{ textTransform: "none" }}
          >
            <X size={16} className={confirmClose ? "text-amber-300" : "text-slate-300"} />
            {confirmClose ? "¿SEGURO? PULSA OTRA VEZ" : "Cerrar AlizceTV"}
          </button>
          <div className="my-1 border-t border-white/5" />
          <button
            data-testid="menu-shutdown"
            onClick={handleShutdown}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono tracking-widest uppercase ${confirmShut ? "bg-red-500/20 text-red-200" : "hover:bg-red-500/10 text-red-300"}`}
          >
            {confirmShut ? <AlertTriangle size={16}/> : <Power size={16} />}
            {confirmShut ? "¿Apagar el PC?" : "Apagar PC"}
          </button>
          {!isElectron && (
            <p className="text-[10px] text-slate-500 px-4 py-2 font-mono tracking-widest uppercase">
              Demo web — acciones del sistema simuladas
            </p>
          )}
        </div>
      )}
    </div>
  );
}
