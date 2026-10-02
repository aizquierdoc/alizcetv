# =============================================================================
# AlizceTV - Build Windows installer (one-shot script)
# =============================================================================
# Uso:
#   1. Abre PowerShell en la carpeta raiz del proyecto (donde esta /electron y /frontend)
#   2. Si es la primera vez: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   3. Ejecuta: .\electron\build-windows.ps1
#
# El script:
#   - Verifica Node.js, Yarn y 7-Zip (ofrece instalar 7-Zip con winget si falta)
#   - Descarga mpv.exe automaticamente (via GitHub API de shinchiro/mpv-winbuild-cmake)
#   - Instala dependencias de frontend y electron
#   - Compila React + empaqueta Electron NSIS
#   - Abre la carpeta con el instalador cuando termina
# =============================================================================

$ErrorActionPreference = "Continue"

# Resolve project root (parent of /electron directory)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
if (-not (Test-Path (Join-Path $Root "frontend"))) {
    # script lanzado desde otra ubicacion: ask user
    Write-Host "[ERROR] No encuentro /frontend junto a /electron." -ForegroundColor Red
    Write-Host "         Asegurate de que la estructura es:" -ForegroundColor Yellow
    Write-Host "           raiz\" -ForegroundColor Yellow
    Write-Host "             frontend\" -ForegroundColor Yellow
    Write-Host "             electron\build-windows.ps1" -ForegroundColor Yellow
    exit 1
}

$FrontendDir = Join-Path $Root "frontend"
$ElectronDir = Join-Path $Root "electron"
$MpvDir      = Join-Path $ElectronDir "vendor\mpv"
$MpvExe      = Join-Path $MpvDir "mpv.exe"
$DistDir     = Join-Path $ElectronDir "dist"

function Section($msg) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
}

function Fail($msg) {
    Write-Host ""
    Write-Host "[ERROR] $msg" -ForegroundColor Red
    Write-Host "Copia TODO el log de arriba y pegalo al asistente para que lo arregle." -ForegroundColor Yellow
    exit 1
}

Section "AlizceTV - Build Windows Installer"
Write-Host "Proyecto: $Root"
Write-Host "Frontend: $FrontendDir"
Write-Host "Electron: $ElectronDir"

# -----------------------------------------------------------------------------
# 1. Verificar requisitos basicos
# -----------------------------------------------------------------------------
Section "1/6  Verificando Node.js y Yarn"

function Need-Cmd($cmd, $install) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "[FALTA] $cmd no esta en el PATH." -ForegroundColor Red
        Write-Host "        Instalalo: $install" -ForegroundColor Yellow
        exit 1
    }
    $version = ""
    try { $version = (& $cmd --version 2>$null | Select-Object -First 1) } catch {}
    Write-Host "[OK]    $cmd $version"
}

Need-Cmd node  "https://nodejs.org  (version 18 o superior)"
Need-Cmd npm   "viene con Node.js"
Need-Cmd yarn  "npm install -g yarn"

# -----------------------------------------------------------------------------
# 2. Verificar / instalar 7-Zip (necesario para descomprimir mpv)
# -----------------------------------------------------------------------------
Section "2/6  Verificando 7-Zip"

$Z7Candidates = @(
    "C:\Program Files\7-Zip\7z.exe",
    "C:\Program Files (x86)\7-Zip\7z.exe",
    "$env:LOCALAPPDATA\Programs\7-Zip\7z.exe"
)
$Z7 = $null
foreach ($p in $Z7Candidates) { if (Test-Path $p) { $Z7 = $p; break } }

if (-not $Z7 -and (Test-Path $MpvExe)) {
    Write-Host "[OK] mpv.exe ya existe, 7-Zip no es necesario."
} elseif (-not $Z7) {
    Write-Host "[FALTA] 7-Zip no encontrado." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Intentando instalar 7-Zip con winget..." -ForegroundColor Cyan
        try {
            winget install -e --id 7zip.7zip --accept-source-agreements --accept-package-agreements --silent
            foreach ($p in $Z7Candidates) { if (Test-Path $p) { $Z7 = $p; break } }
        } catch { }
    }
    if (-not $Z7) {
        Write-Host "No se pudo instalar 7-Zip automaticamente." -ForegroundColor Yellow
        Write-Host "Instalalo manualmente desde https://www.7-zip.org/ y vuelve a ejecutar el script." -ForegroundColor Yellow
        Write-Host "(O descarga mpv.exe a mano y copialo a: $MpvExe)" -ForegroundColor Yellow
        $continue = Read-Host "Quieres continuar sin descargar mpv.exe? (s/N)"
        if ($continue -ne "s") { exit 1 }
    } else {
        Write-Host "[OK] 7-Zip instalado en $Z7"
    }
} else {
    Write-Host "[OK] 7-Zip encontrado: $Z7"
}

# -----------------------------------------------------------------------------
# 3. Descargar mpv.exe si falta
# -----------------------------------------------------------------------------
Section "3/6  Comprobando mpv.exe"

if (Test-Path $MpvExe) {
    Write-Host "[OK] mpv.exe ya existe ($MpvExe)"
} else {
    Write-Host "Descargando ultima version de mpv (shinchiro/mpv-winbuild-cmake)..."
    New-Item -ItemType Directory -Path $MpvDir -Force | Out-Null
    $MpvZip = Join-Path $env:TEMP "mpv-latest.7z"

    try {
        $api = "https://api.github.com/repos/shinchiro/mpv-winbuild-cmake/releases/latest"
        $headers = @{ "User-Agent" = "AlizceTV-Build" }
        $release = Invoke-RestMethod -Uri $api -Headers $headers -ErrorAction Stop
        # Pick the first x86_64 asset that is NOT a debug / v3 build
        $asset = $release.assets |
            Where-Object { $_.name -match "mpv-x86_64-\d+" -and $_.name -notmatch "(dbg|v3)" -and $_.name -match "\.7z$" } |
            Select-Object -First 1
        if (-not $asset) { $asset = $release.assets | Where-Object { $_.name -match "mpv-x86_64" -and $_.name -match "\.7z$" } | Select-Object -First 1 }
        if (-not $asset) { throw "No se encontro asset mpv-x86_64 en el release." }
        Write-Host "URL: $($asset.browser_download_url)"
        Invoke-WebRequest -Uri $asset.browser_download_url -Headers $headers -OutFile $MpvZip -UseBasicParsing
    } catch {
        Write-Host "[AVISO] Fallo la descarga automatica: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Descarga manual: https://github.com/shinchiro/mpv-winbuild-cmake/releases/latest" -ForegroundColor Yellow
        Write-Host "Baja el .7z que empiece por 'mpv-x86_64-', descomprimelo y copia mpv.exe a:" -ForegroundColor Yellow
        Write-Host "   $MpvExe" -ForegroundColor Yellow
        Read-Host "Pulsa Enter cuando lo hayas copiado (o Ctrl+C para abortar)"
    }

    if ((Test-Path $MpvZip) -and $Z7) {
        Write-Host "Extrayendo mpv.exe..."
        & $Z7 e $MpvZip "-o$MpvDir" mpv.exe -y | Out-Null
        Remove-Item $MpvZip -Force
        if (Test-Path $MpvExe) {
            Write-Host "[OK] mpv.exe extraido ($(Get-Item $MpvExe | ForEach-Object { [math]::Round($_.Length / 1MB, 1) }) MB)"
        } else {
            Fail "No se pudo extraer mpv.exe del 7z."
        }
    }

    if (-not (Test-Path $MpvExe)) {
        Write-Host "[AVISO] mpv.exe sigue sin existir. El .exe compilara pero la reproduccion no funcionara hasta que lo copies." -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------------------
# 3bis. Descargar yt-dlp.exe (para la descarga de videos de YouTube)
# -----------------------------------------------------------------------------
Section "3bis/6  Comprobando yt-dlp.exe"
$YtDlpDir = Join-Path $ElectronDir "vendor\ytdlp"
$YtDlpExe = Join-Path $YtDlpDir "yt-dlp.exe"

if (Test-Path $YtDlpExe) {
    Write-Host "[OK] yt-dlp.exe ya existe ($YtDlpExe)"
} else {
    Write-Host "Descargando yt-dlp.exe (ultima release de GitHub)..."
    New-Item -ItemType Directory -Path $YtDlpDir -Force | Out-Null
    try {
        $YtApi = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest"
        $headers = @{ "User-Agent" = "AlizceTV-Build" }
        $release = Invoke-RestMethod -Uri $YtApi -Headers $headers -ErrorAction Stop
        $asset = $release.assets | Where-Object { $_.name -eq "yt-dlp.exe" } | Select-Object -First 1
        if (-not $asset) { throw "No se encontro yt-dlp.exe en el release." }
        Invoke-WebRequest -Uri $asset.browser_download_url -Headers $headers -OutFile $YtDlpExe -UseBasicParsing
        $sizeMB = [math]::Round((Get-Item $YtDlpExe).Length / 1MB, 1)
        Write-Host "[OK] yt-dlp.exe descargado ($sizeMB MB)"
    } catch {
        Write-Host "[AVISO] Fallo la descarga automatica de yt-dlp: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Descarga manualmente: https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -ForegroundColor Yellow
        Write-Host "Y copialo a: $YtDlpExe" -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------------------
# 4. Instalar dependencias
# -----------------------------------------------------------------------------
Section "4/6  Instalando dependencias React (yarn install)"
Push-Location $FrontendDir
try {
    yarn install --frozen-lockfile 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) {
        # Primera instalacion sin lockfile
        yarn install 2>&1 | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -ne 0) { Fail "yarn install (frontend) fallo con codigo $LASTEXITCODE" }
    }
} finally { Pop-Location }

Section "5/6  Instalando dependencias Electron (npm install)"
Push-Location $ElectronDir
try {
    npm install 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { Fail "npm install (electron) fallo con codigo $LASTEXITCODE" }
} finally { Pop-Location }

# -----------------------------------------------------------------------------
# 5. Compilar
# -----------------------------------------------------------------------------
Section "6/6  Compilando AlizceTV.exe (electron-builder NSIS)"
Push-Location $ElectronDir
try {
    npm run dist 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { Fail "electron-builder fallo con codigo $LASTEXITCODE" }
} finally { Pop-Location }

# -----------------------------------------------------------------------------
# Final
# -----------------------------------------------------------------------------
Section "LISTO"
if (Test-Path $DistDir) {
    Write-Host "Instaladores generados:"
    Get-ChildItem -Path $DistDir -Filter "*.exe" -Recurse | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 1)
        Write-Host "   $($_.FullName)  ($sizeMB MB)" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Abriendo la carpeta..."
    try { Invoke-Item $DistDir } catch {}
} else {
    Write-Host "[AVISO] No se encontro la carpeta dist/." -ForegroundColor Yellow
}
