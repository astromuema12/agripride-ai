const fs = require("fs");
function findSection(text, name) {
  const re = new RegExp("(?:^|\\n)\\s+" + name + ":\\s*\\{", "m");
  const m = re.exec(text);
  if (!m) return null;
  let d = 1, i = m.index + m[0].length;
  while (d > 0 && i < text.length) { if (text[i] === "{") d++; else if (text[i] === "}") d--; i++; }
  return text.substring(m.index + m[0].length, i - 1);
}
function leafKeys(s) { const k=[]; const r=/(\w+):\s*'/g; let m; while((m=r.exec(s))!==null) k.push(m[1]); return k; }
const en = fs.readFileSync("src/lib/i18n/translations/en.ts","utf-8");
console.log("=== TRANSLATION KEYS ===");
console.log("EN keys found in file");
