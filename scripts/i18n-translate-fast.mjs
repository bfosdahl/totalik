#!/usr/bin/env node
/**
 * Parallel version of i18n-translate.mjs.
 * Usage: LOVABLE_API_KEY=... node scripts/i18n-translate-fast.mjs [langs...]
 */
import fs from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("Missing LOVABLE_API_KEY"); process.exit(1); }

const NAMES = { en: "English", pl: "Polish", lt: "Lithuanian", lv: "Latvian" };
const LANGS = process.argv.slice(2).filter((l) => NAMES[l]);
const TARGETS = LANGS.length ? LANGS : Object.keys(NAMES);
const CHUNK = 40;
const CONCURRENCY = 8;

const load = (l) => JSON.parse(fs.readFileSync(`src/i18n/locales/${l}.json`, "utf8"));
const flat = (o, p = "") => Object.entries(o).reduce((acc, [k, v]) => {
  if (v && typeof v === "object") Object.assign(acc, flat(v, `${p}${k}.`));
  else acc[`${p}${k}`] = v;
  return acc;
}, {});
const setDeep = (o, key, val) => {
  const parts = key.split(".");
  let cur = o;
  for (const p of parts.slice(0, -1)) cur = cur[p] = cur[p] || {};
  cur[parts.at(-1)] = val;
};

const no = flat(load("no"));

async function translate(lang, entries) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": KEY },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: `Translate Norwegian UI strings for a Norwegian HSE/quality-management SaaS into ${NAMES[lang]}. Keep domain terms accurate (avvik=deviation/nonconformity, verneombud=safety representative, HMS=HSE, rutine=routine/procedure, sjekkliste=checklist, timeføring=time tracking). Keep placeholders like {{name}} and %s untouched. Keep it short and UI-appropriate. Return ONLY a JSON object mapping each input key to the translated string.` },
        { role: "user", content: JSON.stringify(entries) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`${lang} ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function runLang(lang) {
  const target = load(lang);
  const have = flat(target);
  const missing = Object.keys(no).filter((k) => have[k] === undefined || have[k] === "");
  console.log(`${lang}: ${missing.length} missing`);
  const chunks = [];
  for (let i = 0; i < missing.length; i += CHUNK) chunks.push(missing.slice(i, i + CHUNK));

  let idx = 0, done = 0, dirty = false;
  const save = () => fs.writeFileSync(`src/i18n/locales/${lang}.json`, JSON.stringify(target, null, 2) + "\n");

  const worker = async () => {
    while (idx < chunks.length) {
      const slice = chunks[idx++];
      const payload = Object.fromEntries(slice.map((k) => [k, no[k]]));
      let out;
      for (let a = 0; a < 4; a++) {
        try { out = await translate(lang, payload); break; }
        catch (e) {
          const msg = String(e.message);
          if (/ 4(29|02) /.test(msg)) await new Promise(r => setTimeout(r, 8000 * (a + 1)));
          else await new Promise(r => setTimeout(r, 1500 * (a + 1)));
        }
      }
      if (out) { for (const k of slice) setDeep(target, k, out[k] ?? no[k]); dirty = true; }
      done++;
      if (done % 5 === 0 && dirty) { save(); dirty = false; console.log(`  ${lang} ${done}/${chunks.length} chunks`); }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`${lang}: done`);
}

await Promise.all(TARGETS.map(runLang));
console.log("all done");
