#!/usr/bin/env node
/**
 * i18n-audit: verifiserer at ingenting norsk gjenstår.
 *
 * Sjekker tre ting:
 *  1) Manglende nøkler per språk (parity mot no.json)
 *  2) Uoversatte nøkler per språk (verdi identisk med norsk, minus tillatte unntak)
 *  3) Hardkodede norske UI-tekster i src/**\/*.tsx
 *
 * Bruk:
 *   node scripts/i18n-audit.mjs             # rapport i terminal
 *   node scripts/i18n-audit.mjs --json      # maskinlesbar rapport
 *   node scripts/i18n-audit.mjs --lang=lv   # kun ett språk
 *   node scripts/i18n-audit.mjs --limit=50  # antall eksempler som listes
 * Exit-kode 1 hvis noe mangler.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const onlyLang = (args.find((a) => a.startsWith("--lang=")) || "").split("=")[1];
const limit = Number((args.find((a) => a.startsWith("--limit=")) || "--limit=25").split("=")[1]);

const LOCALE_DIR = "src/i18n/locales";
const BASE = "no";
const LANGS = ["en", "pl", "lt", "lv"].filter((l) => !onlyLang || l === onlyLang);

const load = (l) => JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, `${l}.json`), "utf8"));
const flatten = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, `${p}${k}.`, out);
    else out[`${p}${k}`] = String(v);
  }
  return out;
};

const base = flatten(load(BASE));

/** Strenger som med rimelighet er identiske på tvers av språk. */
const identicalOk = (s) => {
  const t = s.trim();
  if (t.length <= 2) return true;
  if (!/[a-zA-ZæøåÆØÅ]/.test(t)) return true;                       // tall, symboler, datoformat
  if (/^[A-ZÆØÅ0-9\s./+-]+$/.test(t)) return true;                  // akronymer: HMS, SJA, PDF, IK MAT
  if (/^(ok|email|e-post|status|import|export|kontroll|info|total|app|logo|pdf|csv|qr|id|url|km|kg|nok|admin|standard|start|stop|test|sms|api|chat)$/i.test(t)) return true;
  return false;
};

const report = { locales: {}, hardcoded: [] };

for (const lang of LANGS) {
  const cur = flatten(load(lang));
  const missing = [];
  const untranslated = [];
  for (const [key, noVal] of Object.entries(base)) {
    if (!(key in cur) || cur[key] === "" ) { missing.push({ key, no: noVal }); continue; }
    if (cur[key] === noVal && !identicalOk(noVal)) untranslated.push({ key, no: noVal });
  }
  const extra = Object.keys(cur).filter((k) => !(k in base));
  report.locales[lang] = { total: Object.keys(base).length, missing, untranslated, extra };
}

/* ---------- 3) Hardkodet norsk i .tsx ---------- */
const NORWEGIAN_HINTS = /[æøåÆØÅ]|\b(og|eller|ikke|som|for å|til|fra|med|uten|kan|skal|må|ingen|alle|velg|legg til|lagre|slett|endre|opprett|søk|avbryt|lukk|neste|forrige|tilbake|ny|nytt|siste|antall|dato|navn|beskrivelse|status|prosjekt|bedrift|ansatt|bruker|rapport|innstillinger|oversikt)\b/i;

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|__snapshots__|__fixtures__/.test(p)) continue;
      walk(p, acc);
    } else if (e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
};

const isUiText = (s) => {
  const t = s.trim();
  if (t.length < 3 || t.length > 300) return false;
  if (!/[a-zA-ZæøåÆØÅ]{3,}/.test(t)) return false;
  if (/^[a-z0-9_.:-]+$/.test(t)) return false;
  if (/https?:|@|\.(tsx?|json|png|jpg|jpeg|svg|pdf|webp)$/i.test(t)) return false;
  if (/[{}<>$`=;\\|]/.test(t)) return false;
  if (/^[A-Z0-9_]+$/.test(t)) return false;
  return NORWEGIAN_HINTS.test(t);
};

const UI_PROPS = ["placeholder", "title", "label", "description", "emptyMessage", "tooltip", "alt", "confirmText", "cancelText"];
const propRe = new RegExp(`\\b(${UI_PROPS.join("|")})="([^"\\n]+)"`, "g");
const jsxTextRe = /([^\s=\-+*/&|!])>([^<>{}]+)</g;
const toastRe = /\b(?:toast\.(?:success|error|info|warning)|toast)\(\s*["']([^"'\n]+)["']/g;

for (const file of walk("src")) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  const hits = [];
  const push = (text, index) => {
    const line = src.slice(0, index).split("\n").length;
    hits.push({ line, text: text.trim().replace(/\s+/g, " ").slice(0, 120) });
  };
  for (const m of src.matchAll(jsxTextRe)) if (isUiText(m[2])) push(m[2], m.index);
  for (const m of src.matchAll(propRe)) if (isUiText(m[2])) push(m[2], m.index);
  for (const m of src.matchAll(toastRe)) if (isUiText(m[1])) push(m[1], m.index);
  if (hits.length) report.hardcoded.push({ file, count: hits.length, hits: hits.slice(0, limit) });
  void lines;
}

/* ---------- Rapport ---------- */
const totalMissing = LANGS.reduce((n, l) => n + report.locales[l].missing.length, 0);
const totalUntranslated = LANGS.reduce((n, l) => n + report.locales[l].untranslated.length, 0);
const totalHardcoded = report.hardcoded.reduce((n, f) => n + f.count, 0);

if (asJson) {
  console.log(JSON.stringify({ ...report, summary: { totalMissing, totalUntranslated, totalHardcoded } }, null, 2));
} else {
  console.log(`\n=== i18n-audit (${Object.keys(base).length} nøkler i ${BASE}.json) ===\n`);
  for (const lang of LANGS) {
    const r = report.locales[lang];
    console.log(`${lang.toUpperCase()}  manglende: ${r.missing.length}  uoversatt: ${r.untranslated.length}  ekstra: ${r.extra.length}`);
    for (const m of r.missing.slice(0, limit)) console.log(`   MANGLER  ${m.key}  ← "${m.no}"`);
    for (const u of r.untranslated.slice(0, limit)) console.log(`   NORSK    ${u.key}  = "${u.no}"`);
    if (r.missing.length + r.untranslated.length > limit * 2) console.log(`   ... (bruk --limit for flere)`);
  }
  console.log(`\nHardkodet norsk i .tsx: ${totalHardcoded} treff i ${report.hardcoded.length} filer`);
  for (const f of report.hardcoded.slice(0, limit)) {
    console.log(`   ${f.file} (${f.count})`);
    for (const h of f.hits.slice(0, 3)) console.log(`      ${h.line}: ${h.text}`);
  }
  console.log(
    `\nOppsummering: ${totalMissing} manglende, ${totalUntranslated} uoversatte, ${totalHardcoded} hardkodede.\n`
  );
}

process.exit(totalMissing + totalUntranslated + totalHardcoded > 0 ? 1 : 0);
