import React, { useEffect, useState } from "react";
import { Gamepad2, Target, Check, X } from "lucide-react";
import Focusable from "./Focusable";
import { captureNextGamepadButton, getButtonMap, setButtonMap, DEFAULT_BUTTON_MAP } from "../hooks/useFocusEngine";
import { settingsService } from "../services/alizceApi";

const ACTIONS = [
  { k: "accept",    label: "Aceptar",      hint: "Confirma la opción enfocada" },
  { k: "back",      label: "Volver",       hint: "Vuelve a la pantalla anterior (nunca cierra la app)" },
  { k: "menu",      label: "Menú / Ajustes", hint: "Abre la pantalla de ajustes desde cualquier sitio" },
  { k: "playpause", label: "Play / Pausa", hint: "Pausa o reanuda la reproducción" },
  { k: "minimize",  label: "Minimizar",    hint: "Esconde AlizceTV para ver el escritorio de Windows" },
  { k: "closeApp",  label: "Cerrar app",   hint: "Cierra la app activa (YouTube, HBO, reproductor…)" },
  { k: "shutdown",  label: "Apagar PC",    hint: "Pide confirmación y apaga el equipo (sin asignar por defecto)" },
];

const BTN_NAMES = { 0: "A", 1: "B", 2: "X", 3: "Y", 4: "L1", 5: "R1", 6: "L2", 7: "R2", 8: "Select", 9: "Start", 10: "L3", 11: "R3", 12: "D-Up", 13: "D-Dn", 14: "D-Lt", 15: "D-Rt" };

export default function ButtonMappingSection() {
  const [map, setMap] = useState(getButtonMap());
  const [capturing, setCapturing] = useState(null);

  useEffect(() => {
    settingsService.get().then((s) => {
      if (s?.buttonMap) { setMap(s.buttonMap); setButtonMap(s.buttonMap); }
    });
  }, []);

  const persist = async (next) => {
    setMap(next); setButtonMap(next);
    await settingsService.set({ buttonMap: next });
  };

  const startCapture = async (action) => {
    setCapturing(action);
    const res = await captureNextGamepadButton(10000);
    if (res) {
      const next = { ...map, [action]: res.buttonIndex };
      await persist(next);
    }
    setCapturing(null);
  };

  const unassign = async (action) => persist({ ...map, [action]: -1 });
  const resetAll = async () => persist({ ...DEFAULT_BUTTON_MAP });

  return (
    <section className="mb-10">
      <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
        <Gamepad2 size={20} className="text-pink-400" /> Mapeo del mando
      </h3>
      <div className="glass rounded-2xl p-6 space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Pulsa <strong className="text-white">Asignar</strong> y luego el botón del pad que quieras usar para esa acción. Se guarda al instante.
          La leyenda de abajo en pantalla se actualizará con el nombre del botón que elijas.
          <br/>
          <span className="text-cyan-300 font-mono tracking-widest">Tip Chuwi N100:</span> conecta el 8BitDo Ultimate 2C en modo XInput para mejor latencia.
        </p>
        <div className="divide-y divide-white/5">
          {ACTIONS.map((a) => {
            const idx = map[a.k];
            const assigned = idx != null && idx >= 0;
            const name = assigned ? (BTN_NAMES[idx] || `#${idx}`) : "Sin asignar";
            return (
              <div key={a.k} className="flex items-center justify-between py-3 gap-4" data-testid={`map-row-${a.k}`}>
                <div className="min-w-0">
                  <div className="font-title text-base text-white uppercase tracking-wider">
                    {a.label}
                  </div>
                  <div className="text-[11px] text-slate-500">{a.hint}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center min-w-[72px] h-8 px-3 rounded-md font-mono text-xs tracking-widest ${assigned ? "bg-cyan-500/15 border border-cyan-400/40 text-cyan-200" : "bg-slate-800/50 border border-white/5 text-slate-500"}`}>
                    {capturing === a.k ? "Pulsa un botón…" : name}
                  </span>
                  <Focusable id={`map-set-${a.k}`} testId={`btn-map-set-${a.k}`}
                    onSelect={() => startCapture(a.k)}
                    className="h-8 px-3 rounded-md bg-pink-500/15 border border-pink-400/40 text-pink-200 flex items-center gap-1.5 font-mono tracking-widest uppercase text-[10px]">
                    <Target size={12}/> Asignar
                  </Focusable>
                  {assigned && (
                    <Focusable id={`map-clear-${a.k}`} testId={`btn-map-clear-${a.k}`}
                      onSelect={() => unassign(a.k)}
                      className="h-8 w-8 rounded-md glass text-slate-300 flex items-center justify-center">
                      <X size={12}/>
                    </Focusable>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end pt-2">
          <Focusable id="map-reset" testId="btn-map-reset" onSelect={resetAll}
            className="h-9 px-4 rounded-full glass text-xs text-slate-200 font-mono tracking-widest uppercase flex items-center gap-2">
            <Check size={12}/> Restablecer por defecto
          </Focusable>
        </div>
      </div>
    </section>
  );
}
