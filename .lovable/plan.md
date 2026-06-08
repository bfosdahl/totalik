# Eirik runde 2 — 6 fikser

## 1. Skjul avsluttede prosjekter fra menyen
**Funn:** `Ks2Dashboard` har allerede filterknapper (Alle / Aktive / Fullførte) men default er "Alle". Sidebar/quick-list kan også vise fullførte.
**Fiks:**
- Default-filter endres til **"Aktive"** (status = planned/active).
- "Alle"-knappen renames til "Aktive + planlagte". Egen "Arkiv"-knapp viser kun completed/handover/warranty.
- Sjekker også `AppSidebar` — fullførte prosjekter ekskluderes der.
- Legg til "Marker som fullført"-knapp i prosjektdetalj (hvis ikke finnes) som setter status=completed.

## 2. AI-sjekkliste "vinkelsliper" forsvinner
**Funn:** `AiChecklistDialog` lagrer til `admin_checklist_templates` hvis systemadmin, ellers til `company_ks_checklist_templates`. Eirik er company_admin → lagres riktig sted, men sannsynligvis vises ikke "company-malene" i KS-malbibliotek-UI.
**Fiks:**
- Verifiser at `KsOppsett`/malbibliotek lister både admin-maler OG `company_ks_checklist_templates`.
- Hvis ikke: legg til seksjon "Mine egne maler" øverst med rediger/slett.
- Etter generering — vis "Åpne i malbibliotek"-lenke i toast.

## 3. Skjerm låses etter AI-rutinegenerering
**Funn:** Klassisk Radix Dialog scroll-lock-bug. Dialogen setter `pointer-events:none` på body som ikke ryddes opp.
**Fiks i `AiRoutineDialog`:**
- `onOpenAutoFocus={(e) => e.preventDefault()}` på DialogContent.
- Sørg for at body-styles ryddes ved unmount (cleanup-effect).
- Pakk innholdet i `ScrollArea` med eksplisitt `max-h-[80vh] overflow-y-auto`.

## 4. Les/vis rutine uten å gå i redigeringsmodus
**Fiks:**
- Legg til "Vis"-knapp (øye-ikon) i rutine-listen ved siden av "Rediger".
- Åpner read-only dialog med formattert innhold (tittel, formål, ansvar, beskrivelse, sjekkpunkter, lovverk).
- Knapper i dialog: "Lukk" + "Rediger" (bytter til redigeringsmodus).

## 5. Hovedmeny-rutiner ikke synlig i prosjekter
**Funn:** Hovedrutiner ligger i `company_ks_routines`. Prosjektrutiner i `ks_module2_routines` med `project_id`. To separate tabeller, ingen kobling.
**Fiks:**
- I prosjekt → "Rutiner": legg til knapp **"Hent fra firmabibliotek"** som åpner velger med alle aktive `company_ks_routines`.
- Markerte rutiner kopieres inn i `ks_module2_routines` med `project_id` satt og `source_routine_id` referanse.
- Endringer i prosjekt-kopi påvirker ikke originalen (snapshot-mønster).

## 6. Fjerne irrelevante standardrutiner (nybygg, bad, tømring)
**Funn:** Disse kommer trolig fra default-templates ved oppsett. Kan ikke hard-slettes hvis de er fra admin-template, men kan skjules.
**Fiks:**
- Legg til "Skjul"-knapp (eller "Slett" hvis det er company-rutine).
- Skjuling lagres i ny kolonne `is_hidden` på `company_ks_routines` (migrasjon).
- Filter-toggle: "Vis skjulte rutiner" i header.

## Tekniske detaljer

```text
Fil-endringer:
- src/pages/ks2/Ks2Dashboard.tsx       (1: default-filter, sidebar-ekskl.)
- src/components/layout/AppSidebar.tsx (1: hide completed)
- src/pages/ks2/KsOppsett.tsx          (2: vis company-checklist-maler)
- src/components/admin/AiChecklistDialog.tsx (2: bedre toast)
- src/components/routines/AiRoutineDialog.tsx (3: scroll-lock fix)
- src/pages/IkKsRutiner.tsx + IkHmsRutiner (4: view-dialog, 6: skjul-knapp)
- src/hooks/useKsModule2Routines.ts    (5: import-fra-bibliotek)
- src/components/ks2/RoutineImportDialog.tsx (5: ny komponent)
- migrasjon: ks_module2_routines + source_routine_id
- migrasjon: company_ks_routines + is_hidden bool default false
```

## Rekkefølge

1+3+4 først (UI-fikser, ingen DB) → publiser → 2+6 (DB-migrasjoner små) → 5 (større, ny dialog + tabell-endring).

Alternativt: kjør alt i én runde og publiser samlet. Foreslår sistnevnte — Eirik nevner alt henger sammen.

## Spørsmål før jeg går i gang

- **Pkt 1 (status "completed"):** Skal vi også vise prosjekter med status `handover`/`warranty` som "Aktive" eller flytte de til "Arkiv"?
- **Pkt 5 (import-mønster):** Skal prosjekt-kopier av rutiner være **statiske snapshots** (endringer i bibliotek påvirker ikke prosjekt) eller **lenkede** (endringer i bibliotek slår igjennom)? Snapshots er tryggere for revisjonsspor.
- **Pkt 6 (skjul):** Skjules pr. firma (alle ansatte ser det samme) eller pr. bruker?
