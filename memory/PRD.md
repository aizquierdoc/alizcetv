# AlizceTV — PRD

## Problem Statement (original)
Aplicación tipo TV box para Windows 11 Home llamada **AlizceTV**. Debe permitir acceso unificado a plataformas de streaming, 3 directorios de red con archivos de vídeo (SMB a 192.168.1.200: Películas, Series, Descargas) y a CoinOps para jugar arcades. Compatible con pad 8BitDo Ultimate 2C y teclado para navegación tipo Smart TV (focus, no ratón). Diseño moderno dark, glassmorphism, aurora animada. Tipografía AZONIX. Reloj 24h con fecha arriba a la derecha. "Continuar viendo" con mini-capturas de los 3 últimos vídeos no terminados. Reproductor con selector de aspect ratio, subtítulos y pistas de audio (desactivadas si no están disponibles).

## Target Platform
- Prototipo web React (demo navegable).
- Siguiente fase: empaquetado como app Windows 11 vía Electron o Tauri.

## User Choices
- Entregable: Prototipo web interactivo navegable.
- Streaming: Netflix, Prime Video, Disney+, HBO Max, Movistar+, Apple TV+, YouTube, Twitch, Filmin (lanzadores a web oficial).
- Red local: 192.168.1.200 — carpetas Películas, Series, Descargas (simuladas con contenido ejemplo).
- Fondo: Aurora oscura animada + partículas sutiles.
- Pad: Gamepad API real + navegación por focus tipo Smart TV (no ratón).

## Architecture
- Frontend: React 19 + React Router + Tailwind + Framer-free CSS animations + lucide-react.
- Backend: FastAPI (sin cambios, placeholder; app actualmente 100% frontend).
- Fuente: AZONIX (CDNFonts) + Outfit (Google Fonts) + JetBrains Mono.
- Focus Engine: hook `useFocusEngine` con navegación espacial (nearest-rect por dirección), Keyboard (flechas / Enter / Esc) + Gamepad API polling (D-Pad, sticks, botones A/B).
- Mock data en `/app/frontend/src/data/mockData.js`.

## What's been implemented (2026-01-01)
- Pantalla principal con:
  - TopBar (logo AZONIX + estado de red SMB + reloj 24h con fecha en español).
  - Sección "Continuar viendo" con 3 tiles y barra de progreso + tiempo restante.
  - Grid de 9 plataformas de streaming (abre web oficial en nueva pestaña).
  - Sección "Red Local" con 3 carpetas SMB (Películas / Series / Descargas).
  - Tile hero "CoinOps Arcade" (banner synthwave).
- Browser de carpetas con grid de pósters (año, resolución, barra de progreso en Descargas).
- Reproductor de vídeo full-screen con:
  - Vídeo HTML5 (demo Big Buck Bunny).
  - OSD glass auto-hide 4.5s.
  - Controles: Play/Pause, −10s, +10s, barra de progreso con tiempos.
  - Selector de aspect ratio: 16:9, 4:3, 21:9, Ajustar, Estirar, Zoom.
  - Menú de subtítulos con tracks por archivo + opción Desactivado + estado deshabilitado si no hay subs.
  - Menú de audio con tracks por archivo + estado deshabilitado si solo hay 1 pista.
- Pantalla Arcade con 8 juegos retro (Street Fighter II, Mortal Kombat, Marvel vs Capcom, Pac-Man, Metal Slug 3, KOF 98, Donkey Kong, Galaga).
- Fondo aurora animada + partículas + grano SVG.
- Glassmorphism con backdrop-blur en todos los paneles.
- Focus ring cian con glow + escala 1.07 + outline-pulse (visible a 3m).
- Scroll-into-view automático del tile enfocado (TV behaviour).
- Leyenda de gamepad flotante abajo a la derecha.
- data-testid en todos los elementos focalizables.

## Prioritized backlog
### P0 (si se decide empaquetar como app Windows)
- Empaquetado Electron o Tauri con integración SMB real vía biblioteca nativa.
- Lanzamiento de ejecutable CoinOps externo (`child_process.spawn`).
- Lanzamiento de apps nativas de streaming (deep link / UWP launch).
- Guardado persistente del progreso de "Continuar viendo" (LocalStorage / archivo).

### P1
- Captura automática de miniaturas (ffmpeg) de los últimos vídeos reproducidos.
- Soporte real de pistas de subtítulos y audio múltiples con ffmpeg / shaka-player / vidstack.
- Buscador global por título.
- Favoritos y recientemente añadido.
- Modo "noche" (brillo reducido) + salvapantallas.

### P2
- Perfiles de usuario.
- Trailers (YouTube) al enfocar un título.
- Integración con TMDB/OMDb para metadatos y pósters reales.
- Sincronización de progreso entre dispositivos.

## Notes
- La integración SMB real NO está implementada: los directorios aparecen simulados con contenido ejemplo (requiere Electron/Tauri).
- Los lanzadores de streaming abren la **web oficial** en una nueva pestaña. Las apps nativas se lanzarán con deep links cuando se empaquete.
- CoinOps está representado como pantalla de selección arcade (demo); el lanzamiento real requerirá llamada a ejecutable externo.
