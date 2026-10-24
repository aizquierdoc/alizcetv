const fs = require("fs");
const path = require("path");

const filePath = "C:\\alizcetv\\frontend\\src\\hooks\\useFocusEngine.js";
const backupPath = filePath + ".before_clean3";
fs.copyFileSync(filePath, backupPath);
console.log("Backup:", backupPath);

let content = fs.readFileSync(filePath, "utf8");

if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  console.log("BOM eliminado");
}

let lines = content.split("\n");
const originalLines = lines.length;

const newHeader = [
  "// Spatial focus engine for TV navigation with keyboard (arrows, Enter, Esc)",
  "// - Discovers focusable elements via [data-focusable=\"true\"]",
  "// - Lets native text inputs capture their own keystrokes",
  "// - Gamepad handling has been removed: only games use it, not AlizceTV UI",
];
lines = [...newHeader, ...lines.slice(5)];

const startIdx = lines.findIndex((l) => l.includes("// Default button mapping"));
if (startIdx >= 0) {
  let endIdx = startIdx;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === "};") {
      endIdx = i;
      break;
    }
  }
  lines.splice(startIdx, endIdx - startIdx + 2);
  console.log("DEFAULT_BUTTON_MAP eliminado (lineas", startIdx + 1, "a", endIdx + 2, ")");
}

content = lines.join("\n");
fs.writeFileSync(filePath, content, "utf8");

console.log("---");
console.log("Original:", originalLines, "lineas /", content.length, "chars");
console.log("Final:", lines.length, "lineas /", content.length, "chars");
