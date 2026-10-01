import React, { useEffect, useState } from "react";
import { Wifi, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n) {
  return n.toString().padStart(2, "0");
}

export default function TopBar() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const date = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

  return (
    <header
      className="relative z-30 flex items-center justify-between px-10 lg:px-14 py-6"
      data-testid="top-bar"
    >
      {/* Logo */}
      <div className="flex items-center gap-4" data-testid="brand-logo">
        <img
          src="/logo.svg"
          alt="AlizceTV"
          className="w-14 h-14 drop-shadow-[0_0_16px_rgba(56,189,248,0.55)]"
        />
        <div>
          <h1 className="font-title text-3xl lg:text-4xl logo-gradient leading-none">
            ALIZCE<span className="opacity-80">TV</span>
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

      {/* Clock */}
      <div className="flex items-center gap-5">
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
        <button
          className="w-11 h-11 rounded-xl glass flex items-center justify-center text-slate-300 hover:text-white"
          data-testid="btn-settings"
          aria-label="Ajustes"
          onClick={() => navigate("/settings")}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
