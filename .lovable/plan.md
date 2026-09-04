# Bedre timerapporter (PDF + Excel)

Kunden savner en lesbar timerapport. Vedlegget «Uke 35, 2026» er en utskriftsvennlig PDF med logo, én linje per timeføring gruppert på dato, og en oppsummering til slutt. Vi lager tilsvarende – og rydder samtidig opp i Excel-fila.

## Hva du får

**1. Ny knapp «Timerapport (PDF)»**
- Velg fritt fra-dato og til-dato (hurtigvalg: denne uken, forrige uken, denne måneden).
- Liggende A4 med firmalogo øverst og periodetittel, f.eks. «26.08–01.09.2026».
- Kolonner som i vedlegget: Dato, Kunde, Prosjekt, Prosjektnummer, Underprosjekt, Bruker, Varighet (7 t 30 m + 07:00–15:00), Pause, Tagger, Overtid (50/100 %), KM, Kostnader, Materialforbruk, Notat.
- Sortert på dato, med gjentatt tabelloverskrift på hver side.
- Egen oppsummering til slutt: Timer, Pause, Kostnader, KM og materialforbruk per type.

**2. Ryddigere Excel**
- Ny første fane «Timeliste» med nøyaktig de samme kolonnene som PDF-en, riktige kolonnebredder, frosset toppen og sumlinje.
- Dagens lønnsfaner beholdes uendret for de som bruker dem til lønn.

**3. Tre nye felt på timeføring**
- Prosjektnummer (fylles automatisk fra valgt prosjekt, kan overstyres)
- Underprosjekt (fritekst)
- Tagger (fritekst/flervalg, f.eks. «hjelp høyspent»)

**4. Tilgang**
- Admin/leder: hele bedriften, med filtre på ansatt, prosjekt og kunde.
- Ansatt: kun sine egne timer i valgt periode.

## Teknisk

- Database: tre nye kolonner på `time_entries` (`project_number`, `subproject`, `tags`). Ingen endring i RLS – eksisterende regler dekker feltene. Prosjektnummer backfilles fra `ks_module2_projects` der `ks_project_id` er satt.
- Ny `src/utils/timeReportPdf.ts` (jsPDF + autotable, `registerPdfFont` for æøå, logo via `loadImageAsBase64`). Pause utledes fra `start_time`/`end_time` minus `hours` når den ikke er oppgitt.
- Utvider `src/utils/timeEntryExport.ts` med «Timeliste»-fanen; eksisterende funksjoner og faner beholdes.
- Nye felt legges inn i `NewTimeEntryDialog.tsx` (samlet under «Detaljer», så skjemaet ikke blir tyngre) og i admin-redigering.
- Knappene kobles på `TimeRegistration.tsx`, `TimeOversikt.tsx`, `Payroll.tsx` og `Ks2Timeregistrering.tsx`.
- QA: generer PDF for en reell uke, konverter sidene til bilder og kontroller at ingen kolonner klippes eller overlapper før levering.

## Rekkefølge
1. Database-kolonner + backfill av prosjektnummer
2. PDF-generator + QA på sider
3. Excel-fane
4. Nye felt i skjema og admin-redigering
5. Knapper og periodevelger på de fire sidene
