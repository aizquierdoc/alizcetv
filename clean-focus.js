const fs = require("fs");
const path = require("path");

const filePath = "C:\\alizcetv\\frontend\\src\\hooks\\useFocusEngine.js";
const backupPath = filePath + ".before_clean";
fs.copyFileSync(filePath, backupPath);
console.log("Backup:", backupPath);

let content = fs.readFileSync(filePath, "utf8");
const originalLen = content.length;
const originalLines = content.split("\n").length;

// 1) Cabecera
content = content.replace(
  /^\/\/ Spatial focus engine for TV \/ gamepad navigation[\s\S]*?\/\/ - Button mapping is read from window\.alizce\.settings when available/,
  "// Spatial focus engine for TV navigation with keyboard (arrows, Enter, Esc)\n" +
  "// - Discovers focusable elements via [data-focusable=\"true\"]\n" +
  "// - Lets native text inputs capture their own keystrokes\n" +
  "// - Gamepad handling has been removed: only games use it, not AlizceTV UI"
);

// 2) DEFAULT_BUTTON_MAP
content = content.replace(
  /\/\/ Default button mapping \(can be overridden by user in Settings\)\nexport const DEFAULT_BUTTON_MAP = \{[\s\S]*?\n\};\n\n/,
  ""
);

// 3) CACHED_MAP + getButtonMap + setButtonMap + onButtonMapChange + init
content = content.replace(
  /\/\/ Load button map from Electron settings once, cache in-memory and refresh on event\nlet CACHED_MAP = \{[\s\S]*?\n\}\n\n\/\/ Load map from Electron settings on module init\nif \(typeof window !== "undefined" && window\.alizce\?\.settings\) \{[\s\S]*?\n\}\n\n/,
  ""
);

// 4) Destructuring de useFocusEngine: quitar onPlayPause, onMinimize, onShutdown, onFavorite, onCloseApp
content = content.replace(
  /const \{ enabled = true, onBack, onMenu, onPlayPause, onMinimize, onShutdown, onFavorite, onCloseApp \} = options;/,
  "const { enabled = true, onBack, onMenu } = options;"
);

// 5) useEffect del teclado: quitar onPlayPause del array de deps
content = content.replace(
  /\}, \[enabled, move, confirm, onBack, onPlayPause\]\);/,
  "}, [enabled, move, confirm, onBack]);"
);

// 6) useEffect del teclado: quitar referencia a onPlayPause en el cuerpo
content = content.replace(
  /else if \(key === " "\)      \{ if \(onPlayPause\) onPlayPause\(\); else confirm\(\); \}/,
  'else if (key === " ")      confirm();'
);

// Guardar
fs.writeFileSync(filePath, content, "utf8");

const newLines = content.split("\n").length;
console.log("---");
console.log("Original:", originalLines, "lineas /", originalLen, "chars");
console.log("Final:", newLines, "lineas /", content.length, "chars");
console.log("Reduccion:", originalLen - content.length, "chars");
