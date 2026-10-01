# =============================================================================
# AlizceTV - Build Windows installer (one-shot script)
# =============================================================================
# Uso:
#   1. Abre PowerShell en la carpeta raiz del proyecto (donde esta /electron y /frontend)
#   2. Si es la primera vez: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   3. Ejecuta: .\electron\build-windows.ps1
#
# El script:
#   - Verifica Node.js y Yarn
#   - Descarga mpv.exe automaticamente si no existe
#   - Instala dependencias de frontend y electron
#   - Compila React + empaqueta Electron NSIS
#   - Abre la carpeta con el instalador cuando termina
# =============================================================================

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path "$Root\frontend")) {
    # script lanzado desde fuera: asumir que esta en /electron
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
    $Root = Split-Path -Parent $Root
}
$FrontendDir = Join-Path $Root "frontend"
$ElectronDir = Join-Path $Root "electron"
$MpvDir      = Join-Path $ElectronDir "vendor\mpv"
$MpvExe      = Join-Path $MpvDir "mpv.exe"

function Section($msg) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
}

Section "AlizceTV - Build Windows Installer"
Write-Host "Carpeta del proyecto: $Root"
Write-Host "Frontend:  $FrontendDir"
Write-Host "Electron:  $ElectronDir"

# -----------------------------------------------------------------------------
# 1. Verificar requisitos
# -----------------------------------------------------------------------------
Section "1/5  Verificando requisitos"

function Need-Cmd($cmd, $install) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "[FALTA] $cmd no esta en el PATH." -ForegroundColor Red
        Write-Host "        Instalalo: $install" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK]    $cmd $(& $cmd --version 2>$null | Select-Object -First 1)"
}

Need-Cmd node  "https://nodejs.org  (version 18 o superior)"
Need-Cmd npm   "viene con Node.js"
Need-Cmd yarn  "npm install -g yarn"

# -----------------------------------------------------------------------------
# 2. Descargar mpv.exe si falta
# -----------------------------------------------------------------------------
Section "2/5  Comprobando mpv.exe"

if (Test-Path $MpvExe) {
    Write-Host "[OK] Ya existe mpv.exe en $MpvExe"
} else {
    Write-Host "mpv.exe no encontrado. Descargando build oficial para Windows x64..."
    New-Item -ItemType Directory -Path $MpvDir -Force | Out-Null

    # mpv-player-windows releases - ultima x86_64 (v3) estable
    $MpvZip = Join-Path $env:TEMP "mpv-latest.7z"
    $MpvUrl = "https://sourceforge.net/projects/mpv-player-windows/files/64bit/mpv-x86_64-20240908-git-fa72b1d.7z/download"

    Write-Host "URL: $MpvUrl"
    try {
        Invoke-WebRequest -Uri $MpvUrl -OutFile $MpvZip -UseBasicParsing
    } catch {
        Write-Host "[AVISO] Fallo la descarga automatica. Descargalo manualmente desde:" -ForegroundColor Yellow
        Write-Host "   https://sourceforge.net/projects/mpv-player-windows/files/64bit/" -ForegroundColor Yellow
        Write-Host "   y copia mpv.exe a: $MpvExe" -ForegroundColor Yellow
        Read-Host "Pulsa Enter cuando lo hayas copiado"
    }

    if (Test-Path $MpvZip) {
        # Descomprimir .7z — necesita 7-Zip
        $Z7 = "C:\Program Files\7-Zip\7z.exe"
        if (Test-Path $Z7) {
            & $Z7 e $MpvZip "-o$MpvDir" mpv.exe -y | Out-Null
            Remove-Item $MpvZip -Force
            if (Test-Path $MpvExe) {
                Write-Host "[OK] mpv.exe extraido en $MpvExe"
            } else {
                Write-Host "[AVISO] No se pudo extraer mpv.exe. Copialo a mano." -ForegroundColor Yellow
            }
        } else {
            Write-Host "[AVISO] No tienes 7-Zip instalado. Descomprime manualmente $MpvZip" -ForegroundColor Yellow
            Write-Host "         y copia mpv.exe a $MpvExe" -ForegroundColor Yellow
            Read-Host "Pulsa Enter cuando lo hayas copiado"
        }
    }
}

# -----------------------------------------------------------------------------
# 3. Instalar dependencias
# -----------------------------------------------------------------------------
Section "3/5  Instalando dependencias React (yarn install)"
Push-Location $FrontendDir
yarn install
Pop-Location

Section "4/5  Instalando dependencias Electron (npm install)"
Push-Location $ElectronDir
npm install
Pop-Location

# -----------------------------------------------------------------------------
# 4. Compilar
# -----------------------------------------------------------------------------
Section "5/5  Compilando AlizceTV.exe (electron-builder)"
Push-Location $ElectronDir
npm run dist
$Code = $LASTEXITCODE
Pop-Location

if ($Code -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] La compilacion fallo con codigo $Code" -ForegroundColor Red
    Write-Host "Copia los mensajes de error de arriba y pegalos al asistente para que lo arregle." -ForegroundColor Yellow
    exit $Code
}

# -----------------------------------------------------------------------------
# Final
# -----------------------------------------------------------------------------
$DistDir = Join-Path $ElectronDir "dist"
Section "LISTO"
Write-Host "Instalador generado en:"
Get-ChildItem -Path $DistDir -Filter "*.exe" | ForEach-Object {
    Write-Host "   $($_.FullName)" -ForegroundColor Green
}
Write-Host ""
Write-Host "Abriendo la carpeta..."
Invoke-Item $DistDir
