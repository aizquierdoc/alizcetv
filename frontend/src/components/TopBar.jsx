import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Settings, Power, Minus, X, AlertTriangle } from "lucide-react";
import { systemService, isElectron } from "../services/alizceApi";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const pad = (n) => n.toString().padStart(2, "0");

export default function TopBar() {
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

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const date = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

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
    <header
      className="relative z-30 flex items-center justify-between px-10 lg:px-14 py-6"
      data-testid="top-bar"
    >
      {/* Logo */}
      <div className="flex items-center gap-4" data-testid="brand-logo">
        <img
          src="./logo.svg"
          alt="AlizceTV"
          className="w-14 h-14 drop-shadow-[0_0_16px_rgba(56,189,248,0.55)]"
        />
        <div>
          <h1 className="font-title text-3xl lg:text-4xl logo-gradient leading-none whitespace-nowrap">
            ALIZCETV
          </h1>
          <p className="text-[11px] tracking-[0.35em] uppercase text-slate-400 mt-1 font-mono">
            Living Room Edition
          </p>
        </div>
      </div>

      {/* Network status */}
      <div
        className="hidden md:flex items-center gap-3 glass px-5 py-2.5 rounded-full"
        data-testid="network-status"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <Wifi size={16} className="text-emerald-300" />
        <span className="text-xs tracking-[0.25em] uppercase text-slate-200 font-mono">
          192.168.1.200 · conectado
        </span>
      </div>

      {/* Clock + settings */}
      <div className="flex items-center gap-5" ref={menuRef}>
        <div className="text-right" data-testid="clock-container">
          <div
            className="font-title text-3xl lg:text-4xl text-white tracking-wider tabular-nums"
            data-testid="clock-time"
          >
            {time}
          </div>
          <div
            className="text-[11px] tracking-[0.3em] uppercase text-slate-400 mt-1 font-mono"
            data-testid="clock-date"
          >
            {date}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-slate-300 hover:text-white"
            data-testid="btn-settings"
            aria-label="Menú del sistema"
          >
            <Settings size={18} className={menuOpen ? "rotate-45 transition-transform" : "transition-transform"} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-14 glass-strong rounded-2xl p-2 w-64 shadow-2xl z-50"
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
                  Demo web — sistema simulado
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
