#!/usr/bin/env node
import fs from "node:fs";
const langs = ["no", "en", "pl", "lt", "lv"];
const load = (l) => JSON.parse(fs.readFileSync(`src/i18n/locales/${l}.json`, "utf8"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]);
const base = new Set(flat(load("no")));
let bad = false;
for (const l of langs.slice(1)) {
  const keys = new Set(flat(load(l)));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  console.log(`${l}: missing ${missing.length}, extra ${extra.length}`);
  if (missing.length) { bad = true; console.log("  e.g.", missing.slice(0, 5).join(", ")); }
}
process.exit(bad ? 1 : 0);
