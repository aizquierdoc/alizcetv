# AlizceTV — Build Windows installer

Esta carpeta es el envoltorio Electron de AlizceTV. Permite generar un instalador
`AlizceTV-Setup-1.0.0.exe` para Windows 11 con integración real de SMB (red local),
reproductor MPV embebido y lanzador para CoinOps.

## Requisitos previos (en el PC Windows donde compilarás)

1. **Node.js 18+** desde https://nodejs.org
2. **Yarn** `npm install -g yarn`
3. **mpv.exe** (reproductor):
   - Descarga el build Windows x86_64 desde https://sourceforge.net/projects/mpv-player-windows/files/64bit/
   - Descomprime `mpv.exe` dentro de `electron/vendor/mpv/mpv.exe`
4. **Icono** `build/icon.ico` (256x256 .ico). Cuando me pases el logo lo reemplazamos.

## Compilar paso a paso

Desde una terminal en la raíz del proyecto (`/app` o donde lo tengas en Windows):

```powershell
# 1. Instalar dependencias React
cd frontend
yarn install

# 2. Instalar dependencias Electron
cd ..\electron
npm install

# 3. Generar instalador (compila React + empaqueta Electron + NSIS)
npm run dist
```

Resultado: `electron/dist/AlizceTV-Setup-1.0.0.exe`

Para versión portable (sin instalación):
```powershell
npm run dist-portable
```

## Primer uso tras instalar

1. Abre AlizceTV desde el escritorio o menú inicio.
2. Pulsa el icono de ⚙ **Ajustes** arriba a la derecha.
3. Configura:
   - **Host SMB**: `192.168.1.200` (ya viene por defecto)
   - **Carpetas compartidas**: Películas, Series, Descargas (editables)
   - **Ruta de CoinOps.exe**: pulsa "Examinar" y selecciona tu `CoinOps.exe`
   - **Ruta de MPV** (opcional, por defecto usa el bundled)
4. Vuelve a Inicio y navega con pad 8BitDo o teclado.

## Controles

| Acción          | Teclado        | 8BitDo Ultimate 2C |
|-----------------|----------------|--------------------|
| Navegar         | Flechas        | D-Pad / Stick izq. |
| Aceptar         | Enter / Espacio| Botón A            |
| Volver          | Esc / Backspace| Botón B            |
| Menú            | M              | Botón Y            |

## Arquitectura

```
electron/
├── src/
│   ├── main.js       Electron main (ventana, IPC, SMB, MPV, CoinOps)
│   └── preload.js    Context bridge (window.alizce)
├── scripts/
│   └── copy-react.js Copia frontend/build → electron/renderer
├── vendor/mpv/       Colocar mpv.exe aquí (empaquetado en el instalador)
├── build/icon.ico    Icono de la app
└── renderer/         (generado) React build empaquetado
```

El `main.js` expone estas APIs a React vía `window.alizce`:

- `alizce.smb.listShare(share)` – lista raíz de un recurso SMB
- `alizce.smb.listFolder(share, folder)` – lista subcarpeta
- `alizce.mpv.play({ share, folder, title })` – lanza MPV sobre un UNC
- `alizce.mpv.command([...])` – comando IPC JSON de MPV (set subs, aspect, pause…)
- `alizce.mpv.stop()` – cierra MPV
- `alizce.mpv.onEvent(cb)` – escucha propiedades observadas (tiempo, pause, tracks)
- `alizce.coinops.launch()` – lanza el ejecutable de CoinOps configurado
- `alizce.settings.get() / set(patch) / pickFile(opts)` – ajustes persistentes
- `alizce.cw.get() / upsert(entry)` – progreso "Continuar viendo" persistido

Cuando la app corre en navegador normal (no Electron), `window.alizce` es `undefined`
y el frontend cae automáticamente al modo demo con datos mock.
