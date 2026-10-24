const fs = require("fs");
const path = require("path");

const filePath = "C:\\alizcetv\\frontend\\src\\hooks\\useFocusEngine.js";
const backupPath = filePath + ".before_clean2";
fs.copyFileSync(filePath, backupPath);
console.log("Backup:", backupPath);

let content = fs.readFileSync(filePath, "utf8");
const originalLen = content.length;

// 1) Reemplazar comentarios de cabecera (lineas 1-5)
content = content.replace(
  /^\/\/ Spatial focus engine for TV \/ gamepad navigation\r?\n[\s\S]*?\/\/ - Button mapping is read from window\.alizce\.settings when available\r?\n/,
  "// Spatial focus engine for TV navigation with keyboard (arrows, Enter, Esc)\n" +
  "// - Discovers focusable elements via [data-focusable=\"true\"]\n" +
  "// - Lets native text inputs capture their own keystrokes\n" +
  "// - Gamepad handling has been removed: only games use it, not AlizceTV UI\n"
);

// 2) Eliminar CACHED_MAP + mapListeners + getButtonMap + setButtonMap + onButtonMapChange + init
content = content.replace(
  /\/\/ Load button map from Electron settings once, cache in-memory and refresh on event\r?\n[\s\S]*?\/\/ Load map from Electron settings on module init\r?\nif \(typeof window !== "undefined" && window\.alizce\?\.settings\) \{[\s\S]*?\n\}\r?\n\r?\n/,
  ""
);

// Guardar
fs.writeFileSync(filePath, content, "utf8");

console.log("---");
console.log("Original:", originalLen, "chars");
console.log("Final:", content.length, "chars");
console.log("Reduccion:", originalLen - content.length, "chars");
