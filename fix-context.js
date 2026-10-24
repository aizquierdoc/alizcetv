const fs = require("fs");

const filePath = "C:\\alizcetv\\PROJECT_CONTEXT.md";
let content = fs.readFileSync(filePath, "utf8");
const originalLen = content.length;

const pairs = [
  [0x00C3, 0x00A1, 0x00E1], // Ã¡ -> á
  [0x00C3, 0x00A9, 0x00E9], // Ã© -> é
  [0x00C3, 0x00AD, 0x00ED], // Ã­ -> í
  [0x00C3, 0x00B3, 0x00F3], // Ã³ -> ó
  [0x00C3, 0x00BA, 0x00FA], // Ãº -> ú
  [0x00C3, 0x00B1, 0x00F1], // Ã± -> ñ
  [0x00C3, 0x0160, 0x00DA], // Ãš -> Ú
  [0x00C3, 0x00A0, 0x00E0], // Ã  -> à
  [0x00C3, 0x00A8, 0x00E8], // Ã¨ -> è
  [0x00C3, 0x00AC, 0x00EC], // Ã¬ -> ì
  [0x00C3, 0x00B2, 0x00F2], // Ã² -> ò
  [0x00C3, 0x00B9, 0x00F9], // Ã¹ -> ù
  [0x00C3, 0x00A7, 0x00E7], // Ã§ -> ç
  [0x00C3, 0x00A3, 0x00E3], // Ã£ -> ã
  [0x00C2, 0x00BF, 0x00BF], // Â¿ -> ¿
  [0x00C2, 0x00A1, 0x00A1], // Â¡ -> ¡
  [0x00C2, 0x00B7, 0x00B7], // Â· -> ·
];

for (const [b1, b2, target] of pairs) {
  const from = String.fromCharCode(b1) + String.fromCharCode(b2);
  const to = String.fromCharCode(target);
  content = content.split(from).join(to);
}

const triples = [
  [0x00E2, 0x20AC, 0x201D, 0x2014], // â€” -> —
  [0x00E2, 0x20AC, 0x201C, 0x2013], // â€“ -> –
  [0x00E2, 0x20AC, 0x00A6, 0x2026], // â€¦ -> …
  [0x00E2, 0x20AC, 0x0153, 0x201C], // â€œ -> "
  [0x00E2, 0x20AC, 0x009D, 0x201D], // â€ -> "
];
for (const [b1, b2, b3, target] of triples) {
  const from = String.fromCharCode(b1) + String.fromCharCode(b2) + String.fromCharCode(b3);
  const to = String.fromCharCode(target);
  content = content.split(from).join(to);
}

fs.writeFileSync(filePath, content, "utf8");

console.log("Original:", originalLen, "chars");
console.log("Final:", content.length, "chars");
