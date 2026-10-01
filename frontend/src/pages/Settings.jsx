import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderSearch, Save, HardDrive, Film, Gamepad2, Check, Tv, Key, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import FloatingControls from "../components/FloatingControls";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import ButtonMappingSection from "../components/ButtonMappingSection";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { settingsService, platformService, tmdbService, isElectron, systemService } from "../services/alizceApi";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [saved, setSaved] = useState(false);
  const [tmdbKey, setTmdbKey] = useState("");
  const [tmdbStatus, setTmdbStatus] = useState({ hasKey: false, lastScanAt: null, running: false });
  const [scanProgress, setScanProgress] = useState(null);

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => navigate("/"),
    onMinimize: () => systemService.minimize(),
  });

  useEffect(() => {
    settingsService.get().then((s) => {
      setSettings(s);
      if (s.tmdbApiKey) setTmdbKey(s.tmdbApiKey);
    });
    platformService.list().then(setPlatforms);
    tmdbService.status().then(setTmdbStatus);

    const off = tmdbService.onProgress((msg) => {
      if (msg.type === "start") setScanProgress({ done: 0, total: 0, file: "Iniciando…" });
      if (msg.type === "progress") setScanProgress({ done: msg.done, total: msg.total, file: msg.file });
      if (msg.type === "complete") {
        setScanProgress(null);
        tmdbService.status().then(setTmdbStatus);
      }
      if (msg.type === "error") setScanProgress(null);
    });

    const t = setTimeout(focusFirst, 200);
    return () => { clearTimeout(t); off(); };
  }, [focusFirst]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const pickFile = async (field, filters, title) => {
    const file = await settingsService.pickFile({ title, filters });
    if (file) update({ [field]: file });
  };

  const save = async () => {
    await settingsService.set(settings);
    if (tmdbKey !== (settings.tmdbApiKey || "")) {
      await tmdbService.setApiKey(tmdbKey);
      await settingsService.set({ tmdbApiKey: tmdbKey });
      const st = await tmdbService.status();
      setTmdbStatus(st);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const rescan = async () => {
    setScanProgress({ done: 0, total: 0, file: "Iniciando…" });
    const res = await tmdbService.scan();
    if (res?.error) {
      setScanProgress(null);
      alert(res.error);
    }
  };

  if (!settings) return null;

  const shares = settings.smbShares?.join(", ") || "";

  return (
    <div data-testid="settings-screen">
      <FloatingControls />
      <main className="relative px-10 lg:px-14 pt-10 pb-24 max-w-5xl">
        <div className="flex items-center gap-4 mb-10">
          <Focusable
            id="settings-back"
            testId="btn-settings-back"
            onSelect={() => navigate("/")}
            className="w-11 h-11 rounded-xl glass flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </Focusable>
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-slate-500 font-mono">
              Configuración
            </div>
            <h2 className="font-title text-4xl text-white uppercase tracking-wider">
              Ajustes
            </h2>
          </div>
        </div>

        {!isElectron && (
          <div className="mb-8 glass rounded-2xl p-4 border border-amber-400/30 bg-amber-500/5 text-amber-200 text-sm">
            Estás viendo la demo web. Para que los ajustes de SMB, CoinOps y MPV
            tengan efecto real, abre AlizceTV desde el ejecutable de Windows.
          </div>
        )}

        {/* SMB section */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <HardDrive size={20} className="text-emerald-400" /> Red local SMB
          </h3>
          <div className="glass rounded-2xl p-6 space-y-5">
            <Field label="Host del servidor" hint="Dirección IP o nombre de red del NAS/PC donde están los vídeos">
              <input
                data-testid="input-smb-host"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-wider focus:outline-none focus:border-cyan-400"
                value={settings.smbHost || ""}
                onChange={(e) => update({ smbHost: e.target.value })}
              />
            </Field>
            <Field
              label="Carpetas compartidas"
              hint="Nombres de los recursos SMB separados por coma (sin barras). Ejemplo: Peliculas, Series, Descargas"
            >
              <input
                data-testid="input-smb-shares"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-wider focus:outline-none focus:border-cyan-400"
                value={shares}
                onChange={(e) =>
                  update({
                    smbShares: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <div className="text-xs font-mono tracking-widest text-emerald-300/80">
              Acceso en modo Invitado (sin usuario/contraseña).
            </div>
          </div>
        </section>

        {/* Button mapping */}
        <ButtonMappingSection />

        {/* TMDB catalog */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <Key size={20} className="text-amber-400" /> Catálogo TMDB
          </h3>
          <div className="glass rounded-2xl p-6 space-y-5">
            <p className="text-xs text-slate-400 leading-relaxed">
              AlizceTV usa TMDB para descargar pósters reales, títulos limpios y sinopsis
              en español de tus películas y series. La API es gratuita.
              <br />
              <a
                href="https://www.themoviedb.org/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 mt-1"
                data-testid="link-tmdb-signup"
              >
                1) Regístrate en TMDB <ExternalLink size={11} />
              </a>
              <br />
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                data-testid="link-tmdb-api"
              >
                2) Solicita una clave de API v3 (gratis, 2 min) <ExternalLink size={11} />
              </a>
              <br />
              3) Pégala aquí y pulsa "Rescanear".
            </p>

            <Field label="API Key TMDB v3" hint="Clave de 32 caracteres hexadecimal. Se guarda localmente en %APPDATA%\AlizceTV\config.json.">
              <input
                data-testid="input-tmdb-key"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-wider focus:outline-none focus:border-amber-400"
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value.trim())}
              />
            </Field>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs font-mono tracking-widest uppercase">
                {scanProgress ? (
                  <span className="text-cyan-300 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={14} />
                    Escaneando {scanProgress.done}/{scanProgress.total || "…"}
                    {scanProgress.file ? ` · ${scanProgress.file.slice(0, 50)}` : ""}
                  </span>
                ) : tmdbStatus.hasKey ? (
                  <span className="text-emerald-300">
                    Último escaneo: {tmdbStatus.lastScanAt ? new Date(tmdbStatus.lastScanAt).toLocaleString("es-ES") : "nunca"}
                  </span>
                ) : (
                  <span className="text-slate-500">Sin clave configurada</span>
                )}
              </div>
              <Focusable
                id="btn-rescan"
                testId="btn-rescan"
                onSelect={rescan}
                className="h-11 px-5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 flex items-center gap-2 font-mono tracking-widest uppercase text-xs"
              >
                <RefreshCw size={14} className={scanProgress ? "animate-spin" : ""} />
                Rescanear catálogo
              </Focusable>
            </div>

            {scanProgress && scanProgress.total > 0 && (
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(scanProgress.done / scanProgress.total) * 100}%` }} />
              </div>
            )}
          </div>
        </section>

        {/* Streaming platforms modes */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <Tv size={20} className="text-fuchsia-400" /> Plataformas de streaming
          </h3>
          <div className="glass rounded-2xl p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Elige cómo se abre cada plataforma al pulsar su botón.
              <br />
              <span className="font-mono text-emerald-300">App nativa</span>: lanza la app UWP de Windows instalada.
              <span className="font-mono text-cyan-300 ml-2">Modo cine</span>: abre la web oficial en una ventana AlizceTV sin bordes (vuelves con B / Esc).
              <span className="font-mono text-amber-300 ml-2">Externo</span>: abre tu navegador por defecto.
            </p>
            <div className="divide-y divide-white/5">
              {platforms.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-4" data-testid={`platform-row-${p.id}`}>
                  <div className="min-w-0">
                    <div className="font-title text-base text-white uppercase tracking-wider">
                      {p.label}
                    </div>
                    <div className="text-[10px] font-mono tracking-widest text-slate-500 truncate">
                      {p.hasUwp ? "App UWP disponible" : "Solo web — sin app Windows"}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {["uwp", "cinema", "external"].map((mode) => {
                      const disabled = mode === "uwp" && !p.hasUwp;
                      const active = p.mode === mode;
                      const labels = { uwp: "App", cinema: "Cine", external: "Externo" };
                      return (
                        <Focusable
                          key={mode}
                          id={`plat-${p.id}-${mode}`}
                          testId={`platmode-${p.id}-${mode}`}
                          onSelect={async () => {
                            if (disabled) return;
                            await platformService.setMode(p.id, mode);
                            setPlatforms((list) => list.map((x) => x.id === p.id ? { ...x, mode } : x));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest uppercase border transition-colors ${
                            disabled
                              ? "opacity-30 cursor-not-allowed border-white/5 text-slate-600"
                              : active
                                ? "bg-cyan-400 border-cyan-400 text-black"
                                : "border-white/10 text-slate-300"
                          }`}
                          aria-disabled={disabled}
                        >
                          {labels[mode]}
                        </Focusable>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CoinOps */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <Gamepad2 size={20} className="text-pink-400" /> CoinOps Arcade
          </h3>
          <div className="glass rounded-2xl p-6 space-y-4">
            <Field label="Ruta de CoinOps.exe" hint="El ejecutable que lanzará AlizceTV al pulsar en 'Arcade'">
              <div className="flex gap-3">
                <input
                  data-testid="input-coinops-path"
                  readOnly
                  placeholder="Sin configurar"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider"
                  value={settings.coinopsPath || ""}
                />
                <Focusable
                  id="pick-coinops"
                  testId="btn-pick-coinops"
                  onSelect={() => pickFile("coinopsPath", [{ name: "Ejecutables", extensions: ["exe"] }], "Selecciona CoinOps.exe")}
                  className="px-5 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
                >
                  <FolderSearch size={16} /> Examinar
                </Focusable>
              </div>
            </Field>
          </div>
        </section>

        {/* MPV */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <Film size={20} className="text-cyan-400" /> Reproductor MPV + Rendimiento (Chuwi N100)
          </h3>
          <div className="glass rounded-2xl p-6 space-y-5">
            <Field
              label="Ruta de mpv.exe (opcional)"
              hint="Si lo dejas vacío, se usará el mpv.exe incluido con AlizceTV"
            >
              <div className="flex gap-3">
                <input
                  data-testid="input-mpv-path"
                  readOnly
                  placeholder="(usar mpv.exe incluido)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider"
                  value={settings.mpvPath || ""}
                />
                <Focusable
                  id="pick-mpv"
                  testId="btn-pick-mpv"
                  onSelect={() => pickFile("mpvPath", [{ name: "Ejecutables", extensions: ["exe"] }], "Selecciona mpv.exe")}
                  className="px-5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
                >
                  <FolderSearch size={16} /> Examinar
                </Focusable>
              </div>
            </Field>
            <ToggleRow
              label="CoinOps a toda potencia"
              hint="Al lanzar CoinOps: minimiza AlizceTV, libera memoria y lanza el emulador con prioridad HIGH en Windows. Recomendado para Chuwi N100."
              checked={!!settings.coinopsBoost}
              onToggle={(v) => update({ coinopsBoost: v })}
              testId="toggle-coinops-boost"
            />
            <ToggleRow
              label="Bloqueador de anuncios en Modo Cine"
              hint="Filtra dominios de anuncios y trackers en YouTube / HBO / Filmin. Más rápido en N100 que una extensión."
              checked={!!settings.adBlock}
              onToggle={(v) => update({ adBlock: v })}
              testId="toggle-adblock"
            />
            <Field
              label="Carpeta de descargas de YouTube"
              hint="Vacío = Vídeos\\AlizceTV\\ por defecto. Botón 'Descargar vídeo' aparece sobre la ventana de YouTube."
            >
              <div className="flex gap-3">
                <input
                  data-testid="input-ytdlp-path"
                  readOnly
                  placeholder="(por defecto: Vídeos\\AlizceTV)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider"
                  value={settings.youtubeDownloads || ""}
                />
                <Focusable
                  id="pick-ytdir"
                  testId="btn-pick-ytdir"
                  onSelect={async () => {
                    const file = await settingsService.pickFile({ title: "Carpeta de descargas", filters: [{ name: "Cualquier archivo", extensions: ["*"] }] });
                    if (file) {
                      const dir = file.replace(/[\\/][^\\/]+$/, "");
                      update({ youtubeDownloads: dir });
                    }
                  }}
                  className="px-5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
                >
                  <FolderSearch size={16} /> Examinar
                </Focusable>
              </div>
            </Field>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <Focusable
            id="save-settings"
            testId="btn-save-settings"
            onSelect={save}
            className="h-12 px-6 rounded-full bg-cyan-400 text-black font-mono tracking-widest uppercase text-sm flex items-center gap-2"
          >
            {saved ? <><Check size={16}/> Guardado</> : <><Save size={16}/> Guardar ajustes</>}
          </Focusable>
          <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">
            {isElectron ? "Se guarda en %APPDATA%\\AlizceTV\\config.json" : "Modo demo — los cambios no persisten"}
          </span>
        </div>
      </main>
      <GamepadLegend />
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-mono tracking-[0.25em] uppercase text-slate-400 mb-2">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onToggle, testId }) {
  return (
    <div className="flex items-start justify-between gap-6" data-testid={testId}>
      <div className="min-w-0 flex-1">
        <div className="font-title text-base text-white uppercase tracking-wider">{label}</div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{hint}</p>
      </div>
      <Focusable
        id={`${testId}-switch`}
        testId={`${testId}-switch`}
        onSelect={() => onToggle(!checked)}
        className={`shrink-0 w-14 h-8 rounded-full relative transition-colors ${checked ? "bg-cyan-400" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${checked ? "left-7" : "left-1"}`}
        />
      </Focusable>
    </div>
  );
}
