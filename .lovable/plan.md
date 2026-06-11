
# Plan: Eiriks tilbakemeldinger – Timeføring, Sjekklister, Bilder

## 1. Admin timeoversikt (HØY)

**Ny side:** `/admin/timer` – full oversikt med filter på periode, person, prosjekt.
- Kolonner per person: Normaltimer · 50% overtid · 100% overtid · Total · Lønnsgrunnlag (estimert)
- Periode-presets: Denne uken / Forrige uke / Denne måned / Forrige måned / Egendefinert
- Eksport til Excel/CSV (bruker eksisterende `timeEntryExport.ts` som mal)
- Filter: kun godkjente timer (toggle for å vise alle)

**Dashboard-widget:** Nytt kort på admin-dashboard ("Timer denne måned") med totaltall + lenke til /admin/timer. Vises kun for `company_admin` / `system_admin`.

## 2. Timeføring – overtid i samme føring (HØY)

**`NewTimeEntryDialog`** utvides:
- Hovedperiode 07:00–18:00 (normaltid beregnes automatisk)
- Knapp "+ Legg til overtid-segment" → segment med start, slutt, sats (50% / 100%)
- Flere segmenter mulig. Validering: segmenter må ligge innenfor hovedperioden, ikke overlappe
- Normaltimer = total – sum(overtid-segmenter)
- Sammendrag vises live: "8t normal + 3t (50%) + 0t (100%)"

**DB:** `time_entries` har allerede `regular_hours`, `overtime_50_hours`, `overtime_100_hours`. Vi legger til kolonne `overtime_segments jsonb` for detaljert lagring (revisjon/PDF). Eksisterende rader påvirkes ikke.

**Mobil:** Beholder kompakt layout, overtid-segmenter rendres som collapsible kort.

## 3. Sjekklister & Rutiner – gjenbruk på tvers (HØY)

**Problem:** Sjekklister/rutiner laget i hovedmenyen lagres i `company_ks_checklist_templates` / `company_routines` (eller `customer_routine_instances`), mens prosjekt-modal kun viser admin-bibliotek eller prosjekt-spesifikke maler.

**Løsning – «Bedriftsbibliotek»:**
- Når man inne i et KS-prosjekt åpner "Legg til sjekkliste" / "Legg til rutine", vises nå to faner:
  1. **Total-IK Bibliotek** (admin-maler – som i dag)
  2. **Mine bedriftsmaler** (alle globale maler bedriften har laget – ny)
- Trykk "Legg til" → kopier til prosjektet (eksisterende adopt-logikk gjenbrukes)
- Hovedmenyens "Opprett sjekkliste/rutine" får tydelig tekst: *"Denne malen blir tilgjengelig i alle prosjekter"*

**Filer som berøres:**
- `Ks2ProjectDetail` sjekkliste-/rutine-modal → ny tabs-UI
- Ny hook `useCompanyGlobalTemplates` som henter fra `company_ks_checklist_templates` + `company_routines` filtrert på `company_id` og `is_template = true`
- Mark eksisterende globalt opprettede rader med `is_template = true` (migration + UI-toggle)

## 4. Dagsrapporter – raskere bilder (MEDIUM)

- **Opplasting:** Wrap `daily-report-photos`-upload med `compressImageFile({ maxDim: 2000, quality: 0.85 })` (allerede finnes) – reduserer typisk 5MB → ~400KB
- **Thumbnails:** Generer 400px-versjon klient-side, last opp parallelt til samme bucket som `<path>.thumb.jpg`
- **Visning:** `DailyReportPhotoGallery` laster `.thumb.jpg` i grid, full-size kun ved lightbox-åpning
- **Caching:** Øk signed-URL fra 1t → 24t, cache i React Query for å unngå re-signing ved re-render
- **Lazy loading:** `loading="lazy"` på alle `<img>` i grid

## 5. Tekniske endringer

```text
DB-migration:
  ALTER TABLE time_entries ADD COLUMN overtime_segments jsonb;
  ALTER TABLE company_ks_checklist_templates ADD COLUMN is_template boolean DEFAULT true;
  ALTER TABLE company_routines (sjekk – kanskje allerede der)

Nye filer:
  src/pages/admin/AdminTimer.tsx
  src/components/dashboard/AdminHoursWidget.tsx
  src/components/timeregistration/OvertimeSegments.tsx
  src/hooks/useCompanyGlobalTemplates.ts
  src/hooks/useAdminHoursSummary.ts

Endrede filer:
  src/components/timeregistration/NewTimeEntryDialog.tsx  (overtid-segmenter)
  src/components/ks2/DailyReportPhotoGallery.tsx          (thumbnails)
  src/hooks/useKsDailyReports.ts                          (compress + thumb upload)
  src/components/ks2/Ks2ProjectDetail.tsx (eller subkomp)  (bibliotek-tabs)
  src/pages/admin/AdminDashboard.tsx                       (widget)
  App.tsx router                                            (/admin/timer)
```

## Rekkefølge (4 commits)

1. **Sjekklister/rutiner-bibliotek** (mest kritisk for daglig bruk)
2. **Timeføring overtid-segmenter**
3. **Admin timeoversikt + dashboard-widget**
4. **Dagsrapport bilde-optimalisering**

Hver del testes isolert. Jeg gir kort oppsummering etter hver del og en samlet sluttrapport.
