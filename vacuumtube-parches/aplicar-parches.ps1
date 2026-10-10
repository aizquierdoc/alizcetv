# ============================================
# aplicar-parches.ps1 (v2)
# Aplica los parches de Ctrl+W y Escape a VacuumTube
# Idempotente: si ya están aplicados, no hace nada.
# ============================================

$root = "C:\alizcetv\VacuumTube"
$mouse = "$root\src\preload\modules\mouse.js"
$index = "$root\src\index.js"

Write-Host "=== Aplicando parches a VacuumTube ===" -ForegroundColor Cyan
Write-Host ""

# ---------- Parche 1: mouse.js ----------
Write-Host "[1/2] mouse.js ..." -ForegroundColor Yellow

if (-not (Test-Path $mouse)) {
    Write-Host "  ERROR: no existe $mouse" -ForegroundColor Red
} else {
    $content = Get-Content $mouse -Raw

    if ($content -match "escape \(mando o teclado\)") {
        Write-Host "  Ya estaba parcheado. Saltando." -ForegroundColor Green
    } else {
        # Comprobar si ya tiene el bloque de Ctrl+W (versión anterior)
        if ($content -match "ctrl\+w to go back") {
            # Tiene el bloque antiguo de Ctrl+W. Hay que añadir el de Escape después.
            $oldBlock = @'
    //ctrl+w to go back (same as right click)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key?.toLowerCase() === 'w') {
            e.preventDefault()
            e.stopImmediatePropagation()
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    }, true)
'@

            $newBlock = @'
    //ctrl+w to go back (same as right click)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key?.toLowerCase() === 'w') {
            e.preventDefault()
            e.stopImmediatePropagation()
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    }, true)

    //escape (mando o teclado) -> volver atras (igual que clic derecho)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault()
            e.stopImmediatePropagation()
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    }, true)
'@

            $cNorm = $content -replace "`r`n", "`n"
            $oNorm = $oldBlock -replace "`r`n", "`n"

            if ($cNorm -match [regex]::Escape($oNorm)) {
                $new = $cNorm -replace [regex]::Escape($oNorm), $newBlock
                Set-Content $mouse $new -NoNewline -Encoding UTF8
                Write-Host "  Añadido parche de Escape (sobre el de Ctrl+W existente)." -ForegroundColor Green
            } else {
                Write-Host "  ERROR: no se encuentra el bloque de Ctrl+W en mouse.js" -ForegroundColor Red
            }
        } else {
            # No tiene ningún parche. Aplicamos el bloque completo (Ctrl+W + Escape) después del clic derecho.
            $oldBlock = @'
    //right click to go back
    window.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    })
'@

            $newBlock = @'
    //right click to go back
    window.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    })

    //ctrl+w to go back (same as right click)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key?.toLowerCase() === 'w') {
            e.preventDefault()
            e.stopImmediatePropagation()
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    }, true)

    //escape (mando o teclado) -> volver atras (igual que clic derecho)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault()
            e.stopImmediatePropagation()
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    }, true)
'@

            $cNorm = $content -replace "`r`n", "`n"
            $oNorm = $oldBlock -replace "`r`n", "`n"

            if ($cNorm -match [regex]::Escape($oNorm)) {
                $new = $cNorm -replace [regex]::Escape($oNorm), $newBlock
                Set-Content $mouse $new -NoNewline -Encoding UTF8
                Write-Host "  Aplicado bloque completo (Ctrl+W + Escape)." -ForegroundColor Green
            } else {
                Write-Host "  ERROR: no se encuentra el bloque del clic derecho en mouse.js" -ForegroundColor Red
            }
        }
    }
}

# ---------- Parche 2: index.js ----------
Write-Host "[2/2] index.js ..." -ForegroundColor Yellow

if (-not (Test-Path $index)) {
    Write-Host "  ERROR: no existe $index" -ForegroundColor Red
} else {
    $content = Get-Content $index -Raw

    if ($content -match "before-input-event") {
        Write-Host "  Ya estaba parcheado. Saltando." -ForegroundColor Green
    } else {
        $oldBlock = @'
    win.setMenuBarVisibility(false)
    win.setAutoHideMenuBar(false)
'@

        $newBlock = @'
    //interceptar ctrl+w antes de que electron lo procese
    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'w') {
            event.preventDefault()
            // Simular Escape (igual que el clic derecho)
            win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
            win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
        }
    })

    win.setMenuBarVisibility(false)
    win.setAutoHideMenuBar(false)
'@

        $cNorm = $content -replace "`r`n", "`n"
        $oNorm = $oldBlock -replace "`r`n", "`n"

        if ($cNorm -match [regex]::Escape($oNorm)) {
            $new = $cNorm -replace [regex]::Escape($oNorm), $newBlock
            Set-Content $index $new -NoNewline -Encoding UTF8
            Write-Host "  Parche aplicado." -ForegroundColor Green
        } else {
            Write-Host "  ERROR: no se encuentra el bloque original en index.js" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Parcheo completado ===" -ForegroundColor Cyan