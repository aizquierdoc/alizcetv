# AlizceTV — PRD

## Problem Statement
TV box app para Windows 11 Home llamada **AlizceTV**: acceso unificado a plataformas de streaming, 3 directorios de red SMB (192.168.1.200: Películas, Series, Descargas) y a CoinOps para arcades. Compatible con pad 8BitDo Ultimate 2C y teclado, navegación tipo Smart TV (focus, no ratón). Diseño dark glassmorphism con aurora animada, tipografía AZONIX. Reloj 24h con fecha arriba a la derecha. "Continuar viendo" con las últimas 3 reproducciones no terminadas. Reproductor con selector de aspect ratio, subtítulos y pistas de audio (desactivadas si no están disponibles).

## Target Platform
- **Prototipo web React**: demo navegable en el navegador.
- **AlizceTV.exe** (Windows 11): Electron 31 + NSIS installer, con integración SMB real (anónimo), MPV embebido (control IPC) y lanzamiento de CoinOps externo.

## User Choices
- Streaming: Netflix, Prime Video, Disney+, HBO Max, Movistar+, Apple TV+, YouTube, Twitch, Filmin (abren web oficial).
- Red: 192.168.1.200 Guest / anónimo. Carpetas Peliculas, Series, Descargas.
- CoinOps: ruta configurable desde Ajustes.
- Reproductor: MPV embebido vía IPC.
- Instalador: NSIS clásico con atajos escritorio + menú inicio.

## Architecture
```
/app/
├── frontend/           React 19 (renderer dentro de Electron también)
│   ├── src/
│   │   ├── pages/      Home, NetworkBrowser, VideoPlayer, Arcade, Settings
│   │   ├── components/ TopBar, AuroraBackground, Focusable, GamepadLegend, …
│   │   ├── hooks/      useFocusEngine (keyboard + Gamepad API spatial nav)
│   │   ├── services/   alizceApi.js (abstracción Electron vs mock web)
│   │   └── data/       mockData.js
└── electron/           Capa Electron / Windows build
    ├── src/
    │   ├── main.js     Ventana, IPC: SMB, MPV, CoinOps, Settings, ContinueWatching
    │   └── preload.js  contextBridge → window.alizce
    ├── scripts/        copy-react.js (bundling React build)
    ├── vendor/mpv/     mpv.exe (incluir manualmente antes del build)
    ├── build/icon.ico  Icono (reemplazar con logo final)
    └── package.json    electron-builder → NSIS + portable
```

## What's been implemented
### 2026-01-01 — MVP demo web
- Pantallas Home / NetworkBrowser / VideoPlayer / Arcade.
- Aurora animada + partículas + grano SVG.
- Focus Engine (keyboard + Gamepad API, navegación espacial).
- Reloj 24h con fecha ES.
- Continuar viendo con progreso.
- 9 plataformas streaming (abren web oficial).
- Reproductor con aspect ratio / subs / audio y estados deshabilitados.

### 2026-01-01 — Logo y Launcher inteligente multi-plataforma
- Logo generado: `A` monograma con gradiente cian→índigo→violeta, scan line de TV, glow aura, badge "TV" y bordes redondeados en fondo oscuro.
- Entregables: `electron/build/logo.svg`, `logo-512.png`, `icon-256.png`, `icon.ico` (multi-resolución 16/24/32/48/64/128/256). SVG también en `frontend/public/logo.svg` y usado en TopBar + favicon.
- **Platform launcher inteligente** (`electron/src/platforms.js`): matriz por plataforma con 3 modos (`uwp` / `cinema` / `external`).
  - Netflix, Prime, Disney+, Movistar+, Apple TV+, Twitch → **uwp** por defecto (protocolos `netflix://`, `primevideo://`, `disneyplus://`, `movistarplus://`, `com.apple.atv://`, `twitch://`).
  - HBO Max, YouTube, Filmin → **cinema** por defecto (no tienen UWP en Windows 2026). Se abren en una `BrowserWindow` fullscreen sin bordes con User-Agent Smart TV; Esc / B del pad cierra y vuelve a AlizceTV.
- Pantalla Ajustes amplía con selector por plataforma (botón `App` deshabilitado si no hay UWP, por ejemplo HBO Max solo deja elegir Cine o Externo).
- IPC: `platform.list()` / `platform.launch(id)` / `platform.setMode(id, mode)`.
- `electron/` completo con `main.js` + `preload.js` + `copy-react.js` + `package.json` para `electron-builder`.
- Config NSIS: instalador `AlizceTV-Setup-1.0.0.exe` + portable, accesos directos escritorio y menú inicio.
- IPC bridge `window.alizce` seguro con `contextIsolation: true`.
- **SMB real**: `@marsaud/smb2` en modo Guest (sin credenciales). Lee shares configurados y navega subcarpetas.
- **MPV embebido**: lanza mpv.exe en primer plano con `--input-ipc-server`, se conecta por named pipe `\\.\pipe\alizcetv-mpv`, controla play/pause/seek/aspect/sid/aid y observa time-pos / duration / track-list.
- **CoinOps launcher**: `spawn(coinopsPath)` configurable desde Ajustes.
- **Settings persistentes** en `%APPDATA%\AlizceTV\config.json` (electron-store).
- **Continuar viendo persistente**: últimos 10 en disco.
- **Pantalla Ajustes** (`/settings`) con pickers de archivo (Examinar) para CoinOps.exe y mpv.exe, inputs para host SMB y carpetas compartidas.
- **Fallback gracioso**: cuando `window.alizce` no existe (navegador normal), el frontend usa mock data y muestra banner "modo demo".
- README con instrucciones de build paso a paso para Windows.

## How to build AlizceTV.exe
1. En Windows, con Node 18+ y Yarn:
   ```powershell
   cd frontend && yarn install
   cd ..\electron && npm install
   # Descargar mpv.exe y copiarlo a electron/vendor/mpv/mpv.exe
   npm run dist
   ```
2. Resultado: `electron/dist/AlizceTV-Setup-1.0.0.exe`

## Prioritized backlog
### P1
- Deep links a apps nativas de streaming instaladas (Netflix UWP, Prime, etc.).
- Captura automática de miniatura real de los vídeos en progreso (via ffmpeg).
- Buscador global por título.
- Modo "noche" (brillo reducido) + salvapantallas.
- Metadatos TMDB (pósters, sinopsis) con caché local.

### P2
- Perfiles de usuario con progreso independiente.
- Trailers (YouTube) al enfocar un título.
- Sincronización de progreso entre dispositivos.
- Autodetección mDNS del host SMB.
- Scanning indexado de la red (SQLite) para búsquedas rápidas.

## Notes
- MPV se superpone fullscreen "ontop" sobre AlizceTV y se controla por IPC (no es embedding puro con `--wid=`, pero la UX se siente integrada; al cerrar MPV, el foco vuelve a AlizceTV).
- Los lanzadores de streaming abren la web oficial en el navegador por defecto (shell.openExternal). Para apps UWP nativas se necesita integración por `start ms-xbox-netflix://` o similar — queda en backlog P1.
