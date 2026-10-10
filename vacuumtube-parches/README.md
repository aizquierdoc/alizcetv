# Parches de VacuumTube

Este directorio contiene el script para reaplicar los parches de Ctrl+W
sobre una nueva versión de VacuumTube (después de actualizar el fork).

## Qué hace el parche

Hace que Ctrl+W (el botón Atrás del mando) se comporte como el botón
derecho del ratón en VacuumTube:

  - Viendo un vídeo   -> sale al home de YouTube
  - En el home        -> va al menú lateral
  - En el menú lateral -> va a usuarios
  - En usuarios       -> cierra VacuumTube

## Cuándo usarlo

Cada vez que se actualice VacuumTube desde el repositorio original
(git fetch upstream && git merge upstream/main), hay que reaplicar
los parches, porque las actualizaciones pueden sobrescribir los archivos.

## Cómo usarlo

1. Asegúrate de tener el repo clonado en C:\alizcetv\VacuumTube
2. Abre PowerShell
3. Ejecuta:

   .\aplicar-parches.ps1

4. Recompila VacuumTube:

   cd C:\alizcetv\VacuumTube
   npm run windows:build

5. Copia el nuevo ejecutable (o app.asar) a la instalación.

## Si sale "Ya estaba parcheado"

Significa que el parche ya está aplicado. No pasa nada, el script
es idempotente: no duplica el código.

## Si sale "ERROR: no se encuentra el bloque original"

Significa que el archivo ha cambiado (por una actualización de
VacuumTube). Habrá que revisar el archivo manualmente y ajustar
el bloque a buscar en el script.
