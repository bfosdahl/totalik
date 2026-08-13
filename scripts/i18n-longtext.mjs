#!/usr/bin/env node
/**
 * Extracts LONG Norwegian content strings (suggestions, examples, default texts)
 * that the regular extractor skips (>300 chars, parentheses, punctuation).
 *
 * Targets object-literal content props and plain string arrays inside data
 * constants, e.g.:
 *   { title: "...", description: "Vi vil forebygge ulykker, ..." }
 *   checkpoints: ["Kontroller at ...", "Sjekk at ..."]
 *
 * Usage: node scripts/i18n-longtext.mjs <file...>
 */
import fs from "node:fs";

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

const NORWEGIAN = /[æøåÆØÅ]|\b(og|for|skal|ikke|med|som|til|av|er|på|den|det|kan|vi|våre|ved|eller)\b/;

const isContent = (s) => {
  const t = s.trim();
  if (t.length < 25 || t.length > 1200) return false;
  if (!NORWEGIAN.test(t)) return false;
  if (!/[a-zA-ZæøåÆØÅ]{3,}/.test(t)) return false;
  if (/https?:\/\/|@[a-z]|\$\{|\{\{|<[a-z/]|\\n|\bSELECT\b|\bfrom\b\s*\(/i.test(t)) return false;
  if (/[{}<>`\\|]/.test(t)) return false;
  if (/\b(const|function|useState|import|export|supabase|className)\b/.test(t)) return false;
  return true;
};

// props whose values are user-visible copy
const CONTENT_KEYS = [
  "title", "description", "label", "text", "name", "goal_text", "content",
  "question", "answer", "tip", "summary", "subtitle", "heading", "hint",
  "placeholder", "message", "measure", "risk", "action", "purpose", "example",
];

let total = 0;
for (const file of process.argv.slice(2)) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  let used = false;

  const wrap = (raw) => {
    const text = raw.replace(/\s+/g, " ").trim();
    used = true;
    total++;
    return `t(${JSON.stringify(`auto.${keyFor(text)}`)})`;
  };

  const skipContext = (offset) => {
    const around = src.slice(Math.max(0, offset - 500), offset + 200);
    return /\.(insert|update|upsert|rpc)\(|systemPrompt|role:\s*"system"/.test(around);
  };

  // 1. object props: key: "long norwegian text"
  const propRe = new RegExp(`\\b(${CONTENT_KEYS.join("|")}):\\s*"((?:[^"\\\\\\n]|\\\\.){25,})"`, "g");
  src = src.replace(propRe, (m, key, text, offset) => {
    if (!isContent(text) || skipContext(offset)) return m;
    return `${key}: ${wrap(text)}`;
  });

  // 2. string array items in data constants: ["Lang norsk tekst", ...]
  src = src.replace(/"((?:[^"\\\n]|\\.){25,})"(\s*[,\]])/g, (m, text, tail, offset) => {
    if (!isContent(text) || skipContext(offset)) return m;
    // only inside array literals: look back for [ before the nearest ( or {
    const back = src.slice(Math.max(0, offset - 3000), offset);
    const lastOpen = Math.max(back.lastIndexOf("["), -1);
    const lastBrace = Math.max(back.lastIndexOf("{"), back.lastIndexOf("("));
    if (lastOpen === -1 || lastOpen < lastBrace) return m;
    return `${wrap(text)}${tail}`;
  });

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
console.log(`long strings extracted: ${total}, auto keys: ${Object.keys(locale.auto).length}`);
