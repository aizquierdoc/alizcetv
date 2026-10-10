# \# AlizceTV — Proyecto completo

# 

# Sistema de TV personalizado basado en Electron + Brave + VacuumTube + MPV.

# Incluye la app AlizceTV, los parches de VacuumTube, la extensión de Brave

# "Back or Close", y la configuración del mando LG Magic Remote.

# 

# \## Estructura

# 

# \- `electron/` → código de AlizceTV

# \- `frontend/` → interfaz web

# \- `brave-extensions/back-or-close/` → extensión de Brave

# \- `vacuumtube-parches/` → script y archivos de parches de VacuumTube

# \- `backups/` → estado actual y backups

# 

# \## Cómo se instala

# 

# 1\. Clonar los dos repos:

# &#x20;  - `git clone https://github.com/aizquierdoc/alizcetv.git`

# &#x20;  - `git clone https://github.com/aizquierdoc/VacuumTube.git`

# 2\. Aplicar parches a VacuumTube: `\& "C:\\alizcetv\\vacuumtube-parches\\aplicar-parches.ps1"`

# 3\. Compilar VacuumTube: `cd C:\\alizcetv\\VacuumTube; npm install; npm run windows:build`

# 4\. Instalar: `Start-Process "dist\\VacuumTube-Setup.exe"`

# 5\. Cargar la extensión de Brave en `brave://extensions/` (modo desarrollador).

# 6\. Configurar MagicRemoteService (botón Atrás = Ctrl+W).

# 7\. Configurar atajos de Brave (`brave://settings/system/atajos`).

# 

# \## Cómo se actualiza VacuumTube

# 

# ```powershell

# cd C:\\alizcetv\\VacuumTube

# git fetch upstream

# git merge upstream/main

# \& "C:\\alizcetv\\vacuumtube-parches\\aplicar-parches.ps1"

# npm run windows:build

# Start-Process "dist\\VacuumTube-Setup.exe"

