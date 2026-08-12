#!/usr/bin/env node
/**
 * i18n extraction: replaces hardcoded UI strings in .tsx files with t("auto.<slug>")
 * and records the Norwegian source text in src/i18n/locales/no.json under "auto".
 *
 * Usage: node scripts/i18n-extract.mjs <file...>
 */
import fs from "node:fs";
import path from "node:path";

const NO_PATH = "src/i18n/locales/no.json";
const locale = JSON.parse(fs.readFileSync(NO_PATH, "utf8"));
locale.auto = locale.auto || {};
const textToKey = new Map(Object.entries(locale.auto).map(([k, v]) => [v, k]));

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "tekst";

const keyFor = (text) => {
  if (textToKey.has(text)) return textToKey.get(text);
  let base = slug(text);
  let key = base;
  let i = 2;
  while (locale.auto[key] !== undefined) key = `${base}_${i++}`;
  locale.auto[key] = text;
  textToKey.set(text, key);
  return key;
};

// A string is translatable UI copy when it has letters, is not code-ish.
const isUiText = (s) => {
  const t = s.trim();
  if (t.length < 2 || t.length > 300) return false;
  if (!/[a-zA-ZæøåÆØÅ]{2,}/.test(t)) return false;
  if (/^[a-z0-9_-]+$/.test(t)) return false;            // css class / id / enum
  if (/https?:|@|\.(tsx?|json|png|jpg|svg|pdf)$/i.test(t)) return false;
  if (/[{}<>$`=;"\\|]/.test(t)) return false;
  if (/\b(const|let|return|function|useState|import|export|null|undefined|true|false)\b/.test(t)) return false;
  if (/^[A-Z0-9_]+$/.test(t)) return false;             // CONSTANT
  if (/[()]/.test(t)) return false;                      // any parens = likely code
  const opens = (t.match(/\(/g) || []).length, closes = (t.match(/\)/g) || []).length;
  if (opens !== closes) return false;
  return true;
};

const PROPS = ["placeholder", "title", "label", "description", "emptyMessage", "tooltip", "confirmText", "cancelText", "submitLabel"];

let totalKeys = 0;
for (const file of process.argv.slice(2)) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  let used = false;

  const wrap = (raw) => {
    const text = raw.replace(/\s+/g, " ");
    used = true;
    totalKeys++;
    return `t(${JSON.stringify(`auto.${keyFor(text.trim())}`)})`;
  };

  // 1. JSX text nodes: >Tekst<
  src = src.replace(/([^\s=\-+*/&|!])>([^<>{}]+)</g, (m, prev, text) => {
    if (!isUiText(text)) return m;
    const lead = text.match(/^\s*/)[0];
    const tail = text.match(/\s*$/)[0];
    return `${prev}>${lead}{${wrap(text.replace(/\s+/g, " "))}}${tail}<`;
  });

  // 2. String props
  const propRe = new RegExp(`\\b(${PROPS.join("|")})="([^"\\n]+)"`, "g");
  src = src.replace(propRe, (m, prop, text) => (isUiText(text) ? `${prop}={${wrap(text)}}` : m));

  // 3. Object-literal UI copy: { label: "Ny avviksmelding", description: "..." }
  //    Skipped near DB writes so stored data is never translated.
  const OBJ_KEYS = ["label", "title", "description", "heading", "subtitle", "helpText", "emptyText"];
  const objRe = new RegExp(`\\b(${OBJ_KEYS.join("|")}):\\s*"([^"\\n]+)"`, "g");
  src = src.replace(objRe, (m, key, text, offset) => {
    if (!isUiText(text)) return m;
    const around = src.slice(Math.max(0, offset - 400), offset + 200);
    if (/\.(insert|update|upsert|rpc)\(|supabase\s*$/.test(around)) return m;
    return `${key}: ${wrap(text)}`;
  });

  // 4. toast / alerts
  src = src.replace(/\b(toast\.(?:success|error|info|warning)|toast)\(\s*"([^"\n]+)"/g, (m, fn, text) =>
    isUiText(text) ? `${fn}(${wrap(text)}` : m
  );

  if (used && src !== before) {
    if (!/from "@\/i18n\/t"/.test(src)) {
      const lastImport = [...src.matchAll(/^import .*;$/gm)].pop();
      const insertAt = lastImport ? lastImport.index + lastImport[0].length : 0;
      src = src.slice(0, insertAt) + `\nimport { t } from "@/i18n/t";` + src.slice(insertAt);
    }
    fs.writeFileSync(file, src);
    console.log(`updated ${file}`);
  }
}

fs.writeFileSync(NO_PATH, JSON.stringify(locale, null, 2) + "\n");
console.log(`total strings extracted: ${totalKeys}, auto keys: ${Object.keys(locale.auto).length}`);
