import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderSearch, Save, HardDrive, Film, Gamepad2, Check, Key, RefreshCw, Loader2, ExternalLink, Radio } from "lucide-react";
import TopBar from "../components/TopBar";
import Focusable from "../components/Focusable";
import IptvChannelManager from "../components/IptvChannelManager";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { settingsService, tmdbService, isElectron, systemService, juegoService } from "../services/alizceApi";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [tmdbKey, setTmdbKey] = useState("");
  const [tmdbStatus, setTmdbStatus] = useState({ hasKey: false, lastScanAt: null, running: false });
  const [scanProgress, setScanProgress] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

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
    tmdbService.status().then(setTmdbStatus);
    refreshJuegos();

    const off = tmdbService.onProgress((msg) => {
      if (msg.type === "start") setScanProgress({ done: 0, total: 0, file: "Iniciando…" });
      if (msg.type === "progress") setScanProgress({ done: msg.done, total: msg.total, file: msg.file });
      if (msg.type === "complete") {
        setScanProgress(null);
        tmdbService.status().then(setTmdbStatus);
    refreshJuegos();
      }
      if (msg.type === "error") setScanProgress(null);
    });

    const t = setTimeout(focusFirst, 200);
    return () => { clearTimeout(t); off(); };
  }, [focusFirst]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const refreshJuegos = async () => {
    const list = await juegoService.list();
    setJuegos(list || []);
  };

  const pickFile = async (field, filters, title) => {
    const file = await settingsService.pickFile({ title, filters });
    if (file) update({ [field]: file });
  };

  const save = async () => {
    await settingsService.set(settings);
    console.log("SAVE: tmdbKey =", JSON.stringify(tmdbKey));
    if (tmdbKey && tmdbKey !== (settings.tmdbApiKey || "")) {
      console.log("SAVE: guardando tmdbApiKey =", JSON.stringify(tmdbKey));
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
      <TopBar />
      <main className="relative px-10 lg:px-14 pt-2 pb-24 max-w-5xl">
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
            Estás viendo la demo web. Para que los ajustes de SMB, Juegos y MPV
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

        {/* IPTV Channels */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center gap-3">
            <Radio size={20} className="text-amber-400" /> Canales IPTV
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Selecciona los canales que quieres ocultar de la parrilla. No se
            borran de la lista original, solo se filtran. Puedes restaurarlos
            cuando quieras.
          </p>
          <IptvChannelManager />
        </section>

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

        {/* Juegos */}
        <section className="mb-10">
          <h3 className="font-title text-xl text-white tracking-widest uppercase mb-5 flex items-center justify-between">
            <span className="flex items-center gap-3">
              <Gamepad2 size={20} className="text-pink-400" /> Juegos
            </span>
            <Focusable
              id="btn-add-juego"
              testId="btn-add-juego"
              onSelect={() => setModalOpen(true)}
              className="px-5 h-11 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
            >
              + Añadir juego
            </Focusable>
          </h3>
          <div className="glass rounded-2xl p-6">
            {juegos.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono tracking-wider py-6 text-center">
                Sin juegos configurados. Pulsa "Añadir juego".
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {juegos.map((j) => (
                  <div key={j.id} className="flex items-center gap-4 py-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                      {j.cover ? (
                        <img src={`file://${j.cover.replace(/\\/g, "/")}`} alt={j.title} className="w-full h-full object-cover" />
                      ) : (
                        <Gamepad2 size={24} className="text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-title text-base text-white uppercase tracking-wider truncate">
                        {j.title}
                      </div>
                      <div className="text-[10px] font-mono tracking-widest text-pink-300 uppercase">
                        {j.type === "arcade" ? "Arcade" : "Otro"}
                      </div>
                      <div className="text-[10px] font-mono tracking-widest text-slate-500 truncate">
                        {j.path}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Focusable
                        id={`change-cover-${j.id}`}
                        testId={`btn-change-cover-${j.id}`}
                        onSelect={async () => {
                          const path = await juegoService.pickCover();
                          if (path) {
                            const res = await juegoService.setCover({ id: j.id, coverSource: path });
                            if (res?.ok) refreshJuegos();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest uppercase border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        Cambiar carátula
                      </Focusable>
                      <Focusable
                        id={`remove-juego-${j.id}`}
                        testId={`btn-remove-juego-${j.id}`}
                        onSelect={async () => {
                          await juegoService.remove(j.id);
                          refreshJuegos();
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest uppercase border border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        Quitar
                      </Focusable>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {modalOpen && (
          <AddJuegoModal
            onClose={() => setModalOpen(false)}
            onAdded={() => { setModalOpen(false); refreshJuegos(); }}
          />
        )}

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

function AddJuegoModal({ onClose, onAdded }) {
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("otro");
  const [coverSource, setCoverSource] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePickExe = async () => {
    const p = await juegoService.pickExe();
    if (!p) return;
    setPath(p);
    if (!title) {
      const name = p.split(/[\\/]/).pop().replace(/\.exe$/i, "");
      setTitle(name);
    }
  };

  const handlePickCover = async () => {
    const p = await juegoService.pickCover();
    if (p) {
      setCoverSource(p);
      setCoverPreview("file://" + p.replace(/\\/g, "/"));
    }
  };

  const handleSave = async () => {
    console.log("handleSave START", { path, title, type, coverSource });
    if (!path) { alert("Selecciona un ejecutable"); return; }
    if (!title.trim()) { alert("Pon un título"); return; }
    setSaving(true);
    const res = await juegoService.add({ path, title: title.trim(), type, coverSource });
    console.log("handleSave RESULT", res);
    setSaving(false);
    if (res?.error) { alert(res.error); return; }
    onAdded && onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="glass rounded-2xl p-6 w-full max-w-2xl space-y-5">
        <h3 className="font-title text-2xl text-white uppercase tracking-wider flex items-center gap-3">
          <Gamepad2 size={22} className="text-pink-400" /> Añadir juego
        </h3>

        <div>
          <label className="block text-xs font-mono tracking-[0.25em] uppercase text-slate-400 mb-2">
            Ejecutable
          </label>
          <div className="flex gap-3">
            <input
              readOnly
              placeholder="Selecciona un .exe"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider"
              value={path}
            />
            <Focusable
              id="modal-pick-exe"
              testId="btn-modal-pick-exe"
              onSelect={handlePickExe}
              className="px-5 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
            >
              <FolderSearch size={16} /> Examinar
            </Focusable>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono tracking-[0.25em] uppercase text-slate-400 mb-2">
            Título
          </label>
          <input
            placeholder="Ej: Legacy of Kain Defiance"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-pink-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-[0.25em] uppercase text-slate-400 mb-2">
            Tipo
          </label>
          <select
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-pink-400"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="arcade">Arcade</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono tracking-[0.25em] uppercase text-slate-400 mb-2">
            Carátula
          </label>
          <div className="flex gap-3 items-start">
            <div className="w-20 h-24 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
              {coverPreview ? (
                <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <Gamepad2 size={28} className="text-slate-500" />
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <Focusable
                id="modal-pick-cover"
                testId="btn-modal-pick-cover"
                onSelect={handlePickCover}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 flex items-center gap-2 font-mono tracking-widest uppercase text-xs"
              >
                <FolderSearch size={14} /> Examinar
              </Focusable>
              <Focusable
                id="modal-clear-cover"
                testId="btn-modal-clear-cover"
                onSelect={() => { setCoverSource(""); setCoverPreview(""); }}
                className="px-4 py-2 rounded-xl bg-slate-700/40 border border-white/10 text-slate-300 flex items-center gap-2 font-mono tracking-widest uppercase text-xs"
              >
                Sin carátula
              </Focusable>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <Focusable
            id="modal-cancel"
            testId="btn-modal-cancel"
            onSelect={onClose}
            className="px-5 h-11 rounded-xl bg-slate-700/40 border border-white/10 text-slate-300 flex items-center gap-2 font-mono tracking-widest uppercase text-sm"
          >
            Cancelar
          </Focusable>
          <Focusable
            id="modal-save"
            testId="btn-modal-save"
            onSelect={handleSave}
            className={`px-5 h-11 rounded-xl bg-pink-500/30 border border-pink-400/50 text-pink-100 flex items-center gap-2 font-mono tracking-widest uppercase text-sm ${saving ? "opacity-50" : ""}`}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Focusable>
        </div>
      </div>
    </div>
  );
}
