const fs = require("fs");

const content = `# AlizceTV — Contexto del Proyecto

## Descripción

**AlizceTV** es un sistema de TV personalizado para un mini PC Chuwi Larkbox X conectado a una TV LG, con Windows 10/11.

## Stack

- **Electron** (app de escritorio, \`main.js\` + \`preload.js\`)
- **React + craco + Tailwind + shadcn/ui** (frontend)
- **MPV** (reproductor de vídeo para pelis e IPTV)
- **Brave** (navegador en modo cine para Netflix, HBO, Prime, etc.)
- **VacuumTube** (fork de YouTube para TV)
- **MagicRemoteService** (mando LG Magic Remote → eventos de teclado)

## Rutas

| Elemento | Ruta |
|---|---|
| Repo Git | \`C:\\alizcetv\\\` |
| GitHub | https://github.com/aizquierdoc/alizcetv |
| Frontend (React) | \`C:\\alizcetv\\frontend\\\` |
| Backend (Electron) | \`C:\\alizcetv\\electron\\\` |
| Electron \`src\` | \`C:\\alizcetv\\electron\\src\\\` |
| Renderer (build React copiado) | \`C:\\alizcetv\\electron\\renderer\\\` |
| Build Electron (\`pack\`) | \`C:\\alizcetv\\electron\\dist\\win-unpacked\\\` |
| App compilada | \`C:\\win-unpacked\\\` |
| Backups | \`C:\\alizcetv\\backups\\\` |
| Config usuario | \`%APPDATA%\\AlizceTV\\config.json\` |
| IPTV cache | \`%APPDATA%\\AlizceTV\\iptv-cache.json\` |
| Carátulas juegos | \`%APPDATA%\\AlizceTV\\juegos-covers\\\` |

## Flujo de compilación

\`\`\`powershell
# 1) Compilar frontend
cd C:\\alizcetv\\frontend
npm run build

# 2) Copiar build al renderer de Electron
cd C:\\alizcetv\\electron
node scripts/copy-react.js

# 3) Empaquetar Electron
npm run pack

# 4) Copiar a C:\\win-unpacked
Copy-Item C:\\alizcetv\\electron\\dist\\win-unpacked\\* C:\\win-unpacked\\ -Recurse -Force

# 5) Arrancar
Start-Process "C:\\win-unpacked\\AlizceTV.exe"
\`\`\`

**Reglas:**
- Editar **solo** en \`C:\\alizcetv\\\`, nunca en \`win-unpacked\\\`, \`renderer\\\` ni \`dist\\\`.
- Cerrar la app antes de \`copy-react\` o \`pack\`.
- Si guardas \`config.json\` a mano: **UTF-8 SIN BOM** (\`[System.Text.UTF8Encoding]::new($false)\`).

## Estado actual (octubre 2026)

### Completado

1. **Continuar viendo** eliminado (módulo, backend, mocks).
2. **Chips de plataformas** con logos cuadrados (11 columnas, sin texto, sin flecha), Spotify añadido.
3. **Barra flotante** (\`GamepadLegend\`) eliminada de todas las páginas.
4. **Sección Juegos** (\`/juegos\`) con:
   - Chips de carátula (aspect 2:3).
   - Tipo \`arcade\` (chip más grande, leyenda "Arcade") o \`otro\`.
   - Tamaño adaptativo según número de chips.
   - Centrado horizontal y vertical.
   - Añadir/eliminar juegos desde Ajustes → Juegos (modal).
   - Carátulas: selección manual (JPG/PNG) o presets.
   - Lanzamiento de \`.exe\` con \`spawn\` directo (sin CMD).
5. **Gamepad eliminado** de \`useFocusEngine.js\` (solo teclado).
6. **\`ButtonMappingSection.jsx\`** eliminado.
7. **\`CinemaExitWatcher.jsx\`** eliminado (Escape cierra modo cine vía \`globalShortcut\` en main).
8. **Mojibake corregido** en \`Settings.jsx\`.
9. **TMDB API** validada y guardada.
10. **IPTV** con 418 canales ocultos.
11. **\`launchExe\`** cambiado a \`spawn\` directo.

### Pendiente

1. **Refresco en caliente de \`/juegos\`** cuando cambias carátula/eliminas juego desde Ajustes. El polling y \`useLocation\` están, pero no se refleja sin reiniciar.
2. **Adaptación a TV 4K** — pendiente.
3. **Tildes en headers** — la fuente \`Azonix\` no tiene glifos para tildes. Solución: añadir fallback \`'Outfit', sans-serif\` en \`.font-title\`.

## Estructura de archivos clave

### Frontend (React)

\`\`\`
frontend/src/
├── App.js                    ← Router (rutas: /, /folder/:id, /player, /juegos, /settings, /iptv)
├── pages/
│   ├── Home.jsx              ← Home (NetworkSources, StreamingGrid)
│   ├── Settings.jsx          ← Ajustes (SMB, IPTV, TMDB, Juegos, MPV)
│   ├── Juegos.jsx            ← Página /juegos
│   ├── Iptv.jsx              ← Página IPTV
│   ├── NetworkBrowser.jsx    ← Navegador de carpetas SMB
│   └── VideoPlayer.jsx       ← Reproductor MPV
├── components/
│   ├── TopBar.jsx            ← Cabecera (logo, reloj, IP, ajustes)
│   ├── Focusable.jsx         ← Envoltorio con foco (data-focusable)
│   ├── StreamingGrid.jsx     ← Chips de plataformas
│   ├── NetworkSources.jsx    ← Chips de Red Local
│   ├── IptvChannelManager.jsx
│   └── ui/                   ← shadcn/ui
├── hooks/
│   └── useFocusEngine.js     ← Navegación con teclado (flechas, Enter, Esc)
├── services/
│   └── alizceApi.js          ← Puente IPC (settingsService, juegoService, iptvService, mpvService, tmdbService, platformService, haService)
└── data/
    └── mockData.js           ← Datos mock (plataformas, networkFolders, etc.)
\`\`\`

### Backend (Electron)

\`\`\`
electron/src/
├── main.js                   ← Proceso principal (IPC handlers: settings, smb, juego, mpv, iptv, platform, tmdb, etc.)
├── preload.js                ← Puente seguro (expone window.alizce)
├── platforms.js              ← Definición de plataformas (Netflix, Prime, etc.)
├── iptv.js                   ← Lógica IPTV
├── tmdb.js                   ← Cliente TMDB
└── adblock.js                ← Filtro de anuncios
\`\`\`

## Modelo de datos (\`config.json\`)

\`\`\`json
{
  "smbHost": "192.168.1.200",
  "smbShares": ["Películas", "Series", "Descargas"],
  "smbUser": "guest",
  "smbPassword": "",
  "mpvPath": "",
  "mpvTheme": "awesome-osc",
  "platformModes": {},
  "tmdbApiKey": "2df91823476dc18512e561f391c285ae",
  "lastScanAt": null,
  "buttonMap": null,
  "juegos": [
    { "id": "juego_xxx", "path": "C:\\\\Windows\\\\notepad.exe", "name": "notepad", "title": "Notepad", "type": "otro", "cover": "" }
  ],
  "iptvSources": [ { "id": "iptv-xxx", "name": "TDT", "type": "m3u", "url": "...", "host": "", "user": "", "pass": "" } ],
  "iptvCache": {},
  "iptvHidden": { "iptv-xxx": ["Canal1", "Canal2"] },
  "iptvFavorites": {},
  "youtubeDownloads": "",
  "adBlock": true
}
\`\`\`

## Comportamiento del mando

- **Magic Remote**: se configura en Windows via MagicRemoteService. Traduce los botones del mando LG a **eventos de teclado** (flechas, Enter, Escape).
- **\`useFocusEngine\`**: solo procesa **teclado** (\`keydown\`). El gamepad ya no se procesa en AlizceTV.
- **Gamepad**: solo lo usan **los juegos lanzados** desde AlizceTV, fuera de la app.

## Último commit en GitHub

- **\`ff41b50\`** (octubre 2026): "feat(juegos): seccion Juegos con EXEs configurables, caratulas, chips adaptativos, fix encoding"
- Pendiente de subir: gamepad eliminado, \`ButtonMappingSection\` borrado, \`CinemaExitWatcher\` borrado, mojibake corregido.

## Contexto del siguiente paso

**Vamos a trabajar en el apartado Juegos** (\`/juegos\`, \`Settings.jsx\` → sección "Juegos", \`juegoService\` en \`alizceApi.js\`, IPCs \`juego:*\` en \`main.js\`).

**Pendiente principal:**
- **Refresco en caliente de \`/juegos\`** cuando cambias carátula o eliminas un juego desde Ajustes. Los datos se guardan bien, pero \`/juegos\` no se entera sin reiniciar.

## Archivos para el nuevo asistente

**Mínimo imprescindible:**
1. \`frontend/src/services/alizceApi.js\`
2. \`electron/src/main.js\`
3. \`electron/src/preload.js\`
4. \`frontend/src/pages/Juegos.jsx\`
5. \`frontend/src/pages/Settings.jsx\`
6. \`frontend/src/App.js\`
7. \`frontend/src/components/Focusable.jsx\`

**Opcional:**
8. \`frontend/package.json\` + \`electron/package.json\`
9. \`frontend/src/data/mockData.js\`

**NO dar:**
- \`C:\\win-unpacked\\\`
- \`C:\\alizcetv\\electron\\dist\\\`
- \`C:\\alizcetv\\electron\\renderer\\\`
- \`node_modules\`
- \`backups/\`
`;

const outPath = "C:\\\\alizcetv\\\\PROJECT_CONTEXT.md";
fs.writeFileSync(outPath, content, "utf8");
console.log("Creado:", outPath);
console.log("Longitud:", content.length, "chars");
