# Estado de AlizceTV — Configuración funcionando

## Fecha
10/10/2026

## MagicRemoteService
- Botón "Atrás" → CTRL + W
- Botón "Retroceso" → Botón derecho (clic derecho)
- Botón "Rojo" → ESC
- Botón "Verde" → ALT + INICIO
- Botón "Amarillo" → Botón derecho
- Botón "Azul" → Teclado

## Brave (perfil brave-cinema-profile)
- Atajos por defecto de Brave:
  - Atrás: Alt+ArrowLeft
  - Cerrar pestaña: Ctrl+F4 (Ctrl+W quitado)
  - Cerrar ventana: Ctrl+Shift+W / Alt+F4
- Extensión "Back or Close" instalada en:
  C:\win-unpacked\resources\brave-extensions\back-or-close\
- Atajo de la extensión "Back or Close": (ver capturas en C:\win-unpacked\atajos\)

## VacuumTube
- Fork: https://github.com/aizquierdoc/VacuumTube
- Parches aplicados:
  - src/index.js → before-input-event para Ctrl+W
  - src/preload/modules/mouse.js → Ctrl+W y Escape → volver atrás
- Script de parches: C:\win-unpacked\parches\aplicar-parches.ps1
- Ejecutable parcheado: C:\Program Files\VacuumTube\VacuumTube.exe

## Comportamiento actual
- Ctrl+W (mando) → volver atrás en todas las apps.
- Ctrl+W (mando) en el home de una app → cerrar la ventana (Brave) o volver al menú (VacuumTube).
- Clic derecho (botón Retroceso del mando) → volver atrás en VacuumTube.

## Backup de MagicRemoteService

### Carpeta
C:\win-unpacked\backups\MagicRemoteService-20261010-124435

### Registro de Windows
C:\win-unpacked\backups\MagicRemoteService-registro.reg

### Cómo restaurar
1. Cerrar MagicRemoteService.
2. Doble clic en el .reg para importarlo.
3. Reiniciar MagicRemoteService.

### Claves del registro
HKLM\Software\WOW6432Node\MagicRemoteService\
  - Device\latele → configuración del dispositivo
  - Remote\Bind\0xXXXX → mapeo de teclas (cada botón tiene su clave)
