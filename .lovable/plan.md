## Mål

Gjøre papirkurven til et faktisk sikkerhetsnett: når en kunde sier "jeg har mistet noe", skal du som admin alltid kunne hente det tilbake — uansett om det ble slettet, overskrevet, eller forsvant pga. en bug.

I dag dekker audit/papirkurv kun 3 tabeller for SSM Marine (KS-rutiner, stoffkartotek, prosjekter). Det forklarer hvorfor Eiriks HMS-rutiner ikke kunne reddes. Vi utvider betraktelig.

---

## Hva som blir mulig etter denne endringen

- Alle slettede rader (avvik, rutiner, sjekklister, prosjekter, dokumenter, kjemikalier, ansatte-dokumenter, kurs, møter, SJA, kontroller, m.m.) kan gjenopprettes i 90 dager.
- Alle endringer på "store" lister (f.eks. JSONB-rutiner i `company_routines`, `company_ks_organization`, handbøker) lagrer et fullt snapshot før hver endring, så du kan rulle tilbake til hvilken som helst tidligere versjon.
- Admin-papirkurven får søk på tvers av tabeller, bedrift, dato og bruker — så du kan finne "alt Eirik mistet 25. mai" på sekunder.
- Bulk-gjenoppretting: marker flere rader og restore i ett klikk.

---

## Omfang — tabeller som dekkes (gruppert)

**Kjerne-innhold (full audit + soft delete):**
- HMS: `company_routines`, `customer_routine_instances`, `hms_sja`, `hms_sja_templates`, `hms_forsvarlighetsvurderinger`, `hms_self_declarations`, `audits`, `audit_form_responses`, `company_aarshjul_activities`, `company_risk_assessments`, `chemical_risk_assessments`, `ergonomic_risk_assessments`, `equipment_exposure_assessments`
- KS Bygg: `ks_module2_projects`, `ks_module2_routines`, `ks_module2_checklists`, `ks_module2_sja`, `ks_module2_avvik`, `ks_module2_meetings`, `ks_module2_change_orders`, `ks_module2_claims`, `ks_daily_reports`, `ks_change_orders`, `ks_calculations`, `ks_calculation_items`, `company_ks_routines`, `company_ks_documents`, `company_ks_organization`, `company_ks_goals`
- IK MAT: `ik_mat_custom_checklists`, `ik_mat_custom_cleaning_tasks`, `ik_mat_scheduled_tasks`, `ik_mat_traceability_records`, `ik_mat_temperature_equipment`, `ik_mat_temperature_logs`, `ik_mat_suppliers`
- IK ALKOHOL: alle `ik_alkohol_*` (rutiner, kontroller, hendelser, opplæring, risiko, m.m.)
- FDV: `fdv_buildings`, `fdv_controls`, `fdv_documents`, `fdv_floor_plans`, `fdv_risk_assessments`
- Avvik & felles: `deviations`, `deviation_comments`, `deviation_attachments`, `company_action_plans`, `action_plan_followups`, `company_goals`, `company_laws_regulations`, `company_module_documents`, `ik_hms_company_documents`, `ik_hms_stoffkartotek`, `company_chemical_entries`
- HR: `employee_documents`, `employee_courses`, `employee_meetings`, `employee_absence`, `employee_messages`, `employee_surveys`, `employment_contracts`, `hr_meetings`, `hr_meeting_templates`, `hms_card_requests`, `driving_log_entries`, `driving_log_expenses`
- Setup & avdelinger: `company_departments`, `department_routines`, `department_goals`, `department_risk_assessments`, `department_action_plans`, `department_organization`, `company_organization`, `org_chart_nodes`

**Eksplisitt ikke dekket** (for stort/uvesentlig): logger, rate-limits, telemetri, oversettelser, globale chemicals, AI-suggestions-stats.

---

## Teknisk gjennomføring

### 1. Generell audit-trigger (utvidet)
Eksisterende `log_audit_change()` brukes som basis. Lager en hjelpefunksjon `attach_audit_trigger(table_name)` som setter trigger på INSERT/UPDATE/DELETE. Kjøres på alle tabellene i listen over via én migrasjon.

`audit_log` lagrer allerede `old_data`/`new_data` som jsonb — det er nok til full gjenoppretting. Vi legger til indekser: `(company_id, created_at desc)`, `(table_name, record_id)`, `(action) where action in ('DELETE','SOFT_DELETE')`.

### 2. Soft delete utvidet
For tabeller som mangler `is_deleted`, `deleted_at`, `deleted_by`: legg til kolonnene + default `false/null`. Oppdater RLS-policies så vanlige brukere ikke ser slettede rader, men system_admin gjør det.

For tabeller der det er ugjørbart å endre skjema (f.eks. brukes overalt), lar vi audit-loggen alene dekke gjenoppretting — DELETE-handlingen lagrer fortsatt full rad i `old_data`.

### 3. Snapshot-tabell for JSONB-blobs
Ny tabell `content_snapshots`:
- `id`, `company_id`, `table_name`, `record_id`, `snapshot_data jsonb`, `created_at`, `created_by`, `reason text`
- Trigger på `company_routines`, `company_ks_organization`, `company_organization`, `ik_hms_stoffkartotek` (jsonb-tunge tabeller) som lager snapshot før hver UPDATE.
- Beholdes i 90 dager (cron-jobb rydder eldre).

### 4. Gjenopprettings-RPC
`restore_deleted_record(table_name, record_id)` — SECURITY DEFINER, kun system_admin:
- Henter siste `DELETE` eller `SOFT_DELETE` fra `audit_log`
- Setter `is_deleted=false` ved soft delete, eller `INSERT` raden tilbake ved hard delete
- Logger gjenopprettingen som egen audit-rad (`action='RESTORE'`)

`restore_snapshot(snapshot_id)` — gjenoppretter en JSONB-versjon.

### 5. Cron-rensing
pg_cron-jobb daglig:
- Sletter audit-rader eldre enn 90 dager (unntatt RESTORE-handlinger som beholdes lenger)
- Sletter snapshots eldre enn 90 dager
- Permanent-sletter soft-deleted rader eldre enn 90 dager

### 6. Admin-papirkurv UI
Utvider `/admin/papirkurv` (eller oppretter hvis den ikke finnes):
- Filtre: bedrift, modul, tabell, dato-fra/til, bruker som slettet, søk i innhold
- Tabs: "Slettede rader" | "Tidligere versjoner (snapshots)" | "Gjenopprettings-historikk"
- Forhåndsvisning av rad-data før restore
- Bulk-select + restore
- "Hvem slettet hva" — viser bruker og tidspunkt

---

## Filer som endres / opprettes

- **Ny migrasjon** `expand_audit_trash_bin_coverage`:
  - `attach_audit_trigger(name text)` helper-funksjon
  - Triggere på ~70 tabeller
  - Legg til `is_deleted/deleted_at/deleted_by` der det mangler
  - Ny tabell `content_snapshots` + RLS + trigger på JSONB-tunge tabeller
  - `restore_deleted_record()` + `restore_snapshot()` RPC-er
  - Indekser på `audit_log`
  - pg_cron-jobb for rensing

- **Edge function** `restore-content` (kaller RPC-ene, sjekker system_admin)
- **Ny side** `src/pages/admin/AdminTrashBin.tsx` (eller utvider eksisterende)
- **Nytt hook** `src/hooks/useTrashBin.ts`

---

## Risiko & kompromiss

- **Lagringsvekst:** ~70 tabeller med audit kan generere mye data. 90-dagers rensing + indekser holder det håndterbart. Estimat: 100-500 MB/måned for en travel kunde.
- **Skrive-ytelse:** triggere legger til ~1-3 ms per skriving. Akseptabelt.
- **Restore-konflikter:** hvis en rad refererer til en annen slettet rad, kan FK feile. RPC fanger og rapporterer.
- **Bestående bug-tap:** dette redder *fremtidige* tap. Data som aldri ble lagret (som Eiriks AI-rutiner) kan fortsatt ikke gjenopprettes — men disse bugs vi har fikset, så det skal ikke skje igjen.

---

## Leveranseplan

1. Migrasjon med skjema-endringer, triggere, RPC-er, snapshots-tabell, cron
2. Edge function `restore-content`
3. Admin-papirkurv UI med filtre, forhåndsvisning, bulk-restore
4. Kort testing på SSM Marine (slett noe, gjenopprett det)

Vil du jeg setter i gang?
