#!/usr/bin/env node
/**
 * Fills missing keys in en/pl/lt/lv from the Norwegian source via Lovable AI Gateway.
 * Usage: LOVABLE_API_KEY=... node scripts/i18n-translate.mjs
 */
import fs from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("Missing LOVABLE_API_KEY"); process.exit(1); }

const NAMES = { en: "English", pl: "Polish", lt: "Lithuanian", lv: "Latvian" };
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
  if (!res.ok) throw new Error(`${lang} ${res.status} ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

for (const lang of Object.keys(NAMES)) {
  const target = load(lang);
  const have = flat(target);
  const missing = Object.keys(no).filter((k) => have[k] === undefined || have[k] === "");
  console.log(`${lang}: ${missing.length} missing`);
  const CHUNK = 60;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const slice = missing.slice(i, i + CHUNK);
    const payload = Object.fromEntries(slice.map((k) => [k, no[k]]));
    let out;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { out = await translate(lang, payload); break; }
      catch (e) { console.warn("retry", e.message.slice(0, 120)); await new Promise(r => setTimeout(r, 3000 * (attempt + 1))); }
    }
    if (!out) { console.error("chunk failed, skipping"); continue; }
    for (const k of slice) setDeep(target, k, out[k] ?? no[k]);
    console.log(`  ${lang} ${Math.min(i + CHUNK, missing.length)}/${missing.length}`);
    fs.writeFileSync(`src/i18n/locales/${lang}.json`, JSON.stringify(target, null, 2) + "\n");
  }
}
console.log("done");
