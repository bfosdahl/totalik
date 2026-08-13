#!/usr/bin/env node
/**
 * i18n for håndbok-sidene: oversetter gjenstående norske UI-strenger,
 * inkludert template-literals med interpolasjon (`${n} mål definert`).
 * PDF-genererende linjer (doc.*, addSectionHeader osv.) hoppes over.
 *
 * Bruk: node scripts/i18n-handbook.mjs <file...>
 */
import fs from "node:fs";

const NO_PATH = "src/i18n/locales/no.json";
const locale = JSON.parse(fs.readFileSync(NO_PATH, "utf8"));
locale.auto = locale.auto || {};
const textToKey = new Map(Object.entries(locale.auto).map(([k, v]) => [v, k]));

const slug = (s) =>
  s.toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "tekst";

const keyFor = (text) => {
  if (textToKey.has(text)) return textToKey.get(text);
  let base = slug(text), key = base, i = 2;
  while (locale.auto[key] !== undefined) key = `${base}_${i++}`;
  locale.auto[key] = text;
  textToKey.set(text, key);
  return key;
};

const NO_RE = /[æøåÆØÅ]|\b(og|eller|ikke|som|til|fra|med|uten|kan|skal|må|ingen|alle|velg|lagre|slett|endre|opprett|avbryt|lukk|antall|dato|navn|beskrivelse|bedrift|ansatt|ansatte|bruker|rapport|oversikt|signert|utført|definert|totalt|rutiner|rutine|avvik|revisjoner|lover|forskrifter|mål|roller|åpne|lukkede|planlagte|gjennomført|registrert|startet|pågår|løst|åpen|fullført)\b/i;

const isUiText = (s) => {
  const t = s.trim();
  if (t.length < 3 || t.length > 300) return false;
  if (!/[a-zA-ZæøåÆØÅ]{3,}/.test(t)) return false;
  if (/^[a-z0-9_./-]+$/.test(t)) return false;
  if (/https?:|@|\.(tsx?|json|png|jpg|svg|pdf)$/i.test(t)) return false;
  if (/[{}<>$`\\|=;]/.test(t)) return false;
  return NO_RE.test(t);
};

const SKIP_LINE = /doc\.|addSectionHeader|addTocEntry|addSectionTitle|addText\(|addKeyValue|splitTextToSize|console\.|\.insert\(|\.update\(|\.upsert\(|\.rpc\(|from\(/;

let count = 0;
for (const file of process.argv.slice(2)) {
  const before = fs.readFileSync(file, "utf8");
  const out = before.split("\n").map((line) => {
    if (SKIP_LINE.test(line)) return line;
    let l = line;

    // 1) template-literals med interpolasjon: `${x} mål definert`
    l = l.replace(/`([^`\n]*\$\{[^`\n]*)`/g, (m, body) => {
      // del opp i statiske biter og ${...}
      const parts = [];
      let buf = "", i = 0;
      while (i < body.length) {
        if (body[i] === "$" && body[i + 1] === "{") {
          if (buf) { parts.push({ text: buf }); buf = ""; }
          let depth = 1, j = i + 2, expr = "";
          while (j < body.length && depth > 0) {
            if (body[j] === "{") depth++;
            else if (body[j] === "}") { depth--; if (!depth) break; }
            expr += body[j]; j++;
          }
          parts.push({ expr });
          i = j + 1;
        } else { buf += body[i]; i++; }
      }
      if (buf) parts.push({ text: buf });
      let changed = false;
      const rebuilt = parts.map((p) => {
        if (p.expr !== undefined) return "${" + p.expr + "}";
        if (!isUiText(p.text)) return p.text;
        const lead = p.text.match(/^\s*/)[0], tail = p.text.match(/\s*$/)[0];
        changed = true; count++;
        return `${lead}\${t("auto.${keyFor(p.text.trim())}")}${tail}`;
      }).join("");
      return changed ? "`" + rebuilt + "`" : m;
    });

    // 2) enkle strenger i strengliteraler (kun norsk UI-tekst)
    l = l.replace(/"([^"\n]{3,200})"/g, (m, text, off) => {
      if (!isUiText(text)) return m;
      count++;
      const call = `t("auto.${keyFor(text.trim())}")`;
      return l[off - 1] === "=" ? `{${call}}` : call;
    });

    return l;
  }).join("\n");

  if (out !== before) {
    let src = out;
    if (!/from "@\/i18n\/t"/.test(src)) {
      const lastImport = [...src.matchAll(/^import .*;$/gm)].pop();
      const at = lastImport ? lastImport.index + lastImport[0].length : 0;
      src = src.slice(0, at) + `\nimport { t } from "@/i18n/t";` + src.slice(at);
    }
    fs.writeFileSync(file, src);
    console.log(`updated ${file}`);
  }
}

fs.writeFileSync(NO_PATH, JSON.stringify(locale, null, 2) + "\n");
console.log(`strings: ${count}, auto keys: ${Object.keys(locale.auto).length}`);
