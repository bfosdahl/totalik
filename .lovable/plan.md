# Plan: Full avdelingsisolering på tvers av alle moduler

## Bakgrunn

Når en bedrift har avdelinger skal hver avdeling fungere som en "selvstendig bedrift" under hovedbedriften. Alt brukeren oppretter, endrer eller sletter mens hun er inne i en avdeling skal **bare** påvirke den avdelingen – aldri hovedbedriften eller andre avdelinger.

I dag er bare **14 av ~140 tabeller** avdelingsfiltrert (bl.a. `deviations`, `audits`, `ergonomic_risk_assessments`, `ik_mat_temperature_*`, `department_*`, `hms_forsvarlighetsvurderinger`, `time_entries`). De aller fleste IK-MAT, IK-HMS, IK-Alkohol og felles moduler deler fortsatt data på tvers av hele bedriften.

Dette er en **stor endring** (database + hooks + RLS + UI for ~100+ tabeller). Jeg foreslår å rulle det ut i prioriterte faser i stedet for én gigant-migrasjon, slik at vi kan teste hver modul nøye før vi går videre.

## Prinsipp som brukes overalt

For hver tabell:

1. Legg til kolonne `department_id uuid NULL REFERENCES company_departments(id) ON DELETE SET NULL` + index `(company_id, department_id)`.
2. Hook filtrerer:
   - Avdelingsvisning: `.eq('department_id', filterDepartmentId)`
   - Hovedbedriftsvisning: `.is('department_id', null)`
3. Hook setter `department_id: filterDepartmentId` ved alle INSERT.
4. UPDATE/DELETE arver automatisk filteret (siden vi henter kun synlige rader).
5. Eksisterende rader beholder `department_id = NULL` → tilhører hovedbedriften (ingen data forsvinner).

RLS-politikkene fortsetter å sjekke `company_id`. Avdelingsfiltrering gjøres i hooks (samme mønster som vi alt bruker for `deviations`, `audits` osv.). Dette unngår 100+ nye RLS-policies og holder mønsteret konsistent.

## Faseplan

### Fase 1 – IK MAT (mest akutt etter dagens hendelse)
Tabeller:
- `ik_mat_suppliers`
- `ik_mat_checklist_responses`, `ik_mat_custom_checklists`
- `ik_mat_cleaning_plan_responses`, `ik_mat_custom_cleaning_tasks`
- `ik_mat_daily_rounds`, `ik_mat_daily_round_completions`
- `ik_mat_daily_task_settings`, `ik_mat_daily_task_completions`
- `ik_mat_scheduled_tasks`, `ik_mat_task_completions`
- `ik_mat_traceability_records`
- `ik_mat_dismissed_auto_deviations`

### Fase 2 – IK HMS
Tabeller:
- `company_routines`, `company_risk_assessments`, `company_action_plans`, `action_plan_followups`
- `company_goals`
- `company_organization`, `org_chart_nodes`
- `hms_sja`, `hms_self_declarations`, `hms_vernerunde_templates`
- `ik_hms_company_documents`, `ik_hms_stoffkartotek`
- `chemical_risk_assessments`, `company_chemical_entries`, `equipment_exposure_assessments`
- `gdpr_documentation`, `gdpr_checklist_responses`
- `company_aarshjul_activities` (+ overrides/hidden_defaults)
- `company_laws_regulations`

### Fase 3 – IK Alkohol
Alle `ik_alkohol_*` tabeller (organisasjon, rutiner, mål, risiko, kontroller, hendelser, lovverk, opplæring, compliance, lisenser, vakt, vedlegg).

### Fase 4 – Felles / personal / dokumenter
- `company_module_documents` (Mine dokumenter)
- `employee_absence`, `employee_meetings`, `employee_messages`, `employee_surveys`, `employee_courses`, `employee_documents`, `employment_contracts`
- `hr_meetings`, `hr_meeting_templates`
- `driving_log_entries`, `driving_log_expenses`
- `anonymous_messages`, `anonymous_message_discussions`
- `hms_card_requests`
- `notification_settings`-relaterte (vurderes – kan være globalt per bruker)

### Fase 5 – KS Bygg / FDV (egen vurdering)
KS Bygg er allerede prosjektbasert (`project_id` isolerer naturlig). Vi vurderer om avdelingsfiltrering trengs her, eller om "avdeling eier prosjekt" er nok. FDV-bygg kan trolig tilordnes avdeling. Tas etter Fase 1–4 er stabilt.

## Det jeg trenger fra deg før jeg starter

For å unngå at jeg lager noe du ikke vil ha, vil jeg gjerne avklare:

1. **Skal jeg starte med Fase 1 (IK MAT) nå?** Det er den mest akutte etter dagens hendelse, og gir oss et tydelig mønster å gjenta i fase 2–4.
2. **Synlighet for hovedadmin:** Når company_admin står i "Hovedbedrift"-visning, skal de da se *bare* hovedbedriftens data (slik vi gjør nå med deviations), eller skal de kunne se "alt på tvers"? I dag = bare hovedbedrift.
3. **Eksisterende data:** All eksisterende data forblir på hovedbedriften (`department_id = NULL`). Skal jeg gi deg et verktøy for å flytte rader til en avdeling i etterkant, eller holder det at nye avdelinger starter tomme?

Når du svarer ja på Fase 1 setter jeg i gang med migrasjon + hook-oppdateringer for alle IK MAT-tabellene over.
