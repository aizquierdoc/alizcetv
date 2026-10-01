// Copies React production build into electron/renderer so electron-builder bundles it.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "..", "frontend", "build");
const DST = path.join(__dirname, "..", "renderer");

if (!fs.existsSync(SRC)) {
  console.error("[AlizceTV] No existe frontend/build. Ejecuta `yarn build` dentro de frontend/ primero.");
  process.exit(1);
}

fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });

function copyRecursive(from, to) {
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) copyRecursive(path.join(from, entry), path.join(to, entry));
  } else {
    fs.copyFileSync(from, to);
  }
}

copyRecursive(SRC, DST);
console.log("[AlizceTV] React build copiado a electron/renderer/");
