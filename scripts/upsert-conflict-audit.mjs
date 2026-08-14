#!/usr/bin/env node
/**
 * Vakt mot "silent upsert failures".
 *
 * Bakgrunn: AI-oppsettet skrev til company_risk_assessments m.fl. med
 * onConflict: "company_id", mens databasen har UNIQUE (company_id, department_id).
 * PostgREST feiler da – men koden sjekket ikke { error }, så alt så vellykket ut.
 *
 * Kjør: node scripts/upsert-conflict-audit.mjs
 * Feiler (exit 1) hvis en upsert bruker feil konflikt-nøkkel.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Fasit hentet fra databasen (pg_constraint, contype in ('u','p')).
// Oppdater denne når du legger til/endrer UNIQUE-constraints.
const EXPECTED = {
  company_organization: "company_id,department_id",
  company_risk_assessments: "company_id,department_id",
  company_action_plans: "company_id,department_id",
  company_routines: "company_id,department_id",
  company_ks_organization: "company_id",
  setup_wizard_progress: "company_id",
  content_translations: "company_id,content_hash,target_language",
  ik_mat_dismissed_auto_deviations: "company_id,deviation_title",
};

const ROOTS = ["src", "supabase/functions"];
const FILE_RE = /\.(ts|tsx)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (FILE_RE.test(p)) out.push(p);
  }
  return out;
}

const norm = (s) => s.split(",").map((x) => x.trim()).sort().join(",");
const problems = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      const m = line.match(/onConflict:\s*["'`]([^"'`]+)["'`]/);
      if (!m) return;
      const used = m[1];
      // finn tabellnavn på samme linje, ellers let bakover
      let table = null;
      for (let j = i; j >= Math.max(0, i - 12) && !table; j--) {
        const t = lines[j].match(/\.from\(\s*["'`]([a-z0-9_]+)["'`]\s*\)/);
        if (t) table = t[1];
      }
      if (!table || !(table in EXPECTED)) return;
      if (norm(used) !== norm(EXPECTED[table])) {
        problems.push(`${file}:${i + 1}  ${table} bruker "${used}", forventet "${EXPECTED[table]}"`);
      }
    });
  }
}

if (problems.length) {
  console.error("Feil onConflict-nøkler funnet:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log("OK: alle onConflict-nøkler matcher databasens UNIQUE-constraints.");
