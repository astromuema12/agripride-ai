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
function subKeys(s, sub) {
  const re = new RegExp(sub + ":\\s*\\{");
  const m = re.exec(s); if (!m) return [];
  let d=1,i=m.index+m[0].length;
  while(d>0&&i<s.length){if(s[i]==="{")d++;else if(s[i]==="}")d--;i++;}
  return leafKeys(s.substring(m.index+m[0].length,i-1));
}
const en = fs.readFileSync("src/lib/i18n/translations/en.ts","utf-8");
const sw = fs.readFileSync("src/lib/i18n/translations/sw.ts","utf-8");
const el = findSection(en,"livestock");
const sl = findSection(sw,"livestock");
console.log("=== LIVESTOCK TOP KEYS ===");
console.log("EN:", leafKeys(el).join(", "));
console.log("SW:", leafKeys(sl).join(", "));
const subs=["categories","animal","health","vaccination","milk","breeding","feeding","healthLabels","vaccinationLabels"];
console.log("\n=== SUB-SECTIONS ===");
for(const sub of subs){
  const ek = subKeys(el, sub);
  const sk = subKeys(sl, sub);
  const miss = ek.filter(x=>!sk.includes(x));
  const extra = sk.filter(x=>!ek.includes(x));
  console.log(sub+": EN("+ek.length+") SW("+sk.length+")" + (miss.length?" MISSING-IN-SW:"+miss.join(","):"") + (extra.length?" EXTRA-IN-SW:"+extra.join(","):"") + (!miss.length&&!extra.length?" MATCH":""));
}
console.log("\n=== FARM FINANCE ===");
const ef = findSection(en,"farmFinance");
const sf = findSection(sw,"farmFinance");
const efk = leafKeys(ef);
const sfk = leafKeys(sf);
console.log("EN:", efk.join(", "));
console.log("SW:", sfk.join(", "));
const ffMiss = efk.filter(x=>!sfk.includes(x));
const ffExtra = sfk.filter(x=>!efk.includes(x));
if(ffMiss.length) console.log("MISSING IN SW:", ffMiss.join(", "));
if(ffExtra.length) console.log("EXTRA IN SW:", ffExtra.join(", "));
if(!ffMiss.length&&!ffExtra.length) console.log("FARM FINANCE MATCHES!");
