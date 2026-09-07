# Fem forbedringer fra LMK Bygg og Anlegg

## 1. Flere ansatte i arbeidsplanen samtidig
I «Ny vakt» blir «Ansatt» et flervalg: huk av flere navn (eller «Velg alle»), og samme vakt (dato/periode, ukedager, tid, prosjekt, sted, rolle) opprettes for alle valgte på én gang. Bekreftelse viser hvor mange vakter som ble laget.

## 2. Melding til alle eller utvalgte ansatte
Ny «Send melding»-knapp i personaladministrasjon (og fra ansattlisten). Velg mottakere: alle ansatte, en avdeling, eller kryss av enkeltpersoner. Skriv emne + fritekst, send én gang — hver mottaker får meldingen i «Mine meldinger», og varsel på e-post der det er slått på. Sendte gruppemeldinger vises samlet i «Sendt».

## 3. Snarvei til timeføring
Timeføring legges inn i personaladministrasjon-menyen (og som hurtigkort på ansatt-oversikten), så man ikke må lete etter den.

## 4. Kundekort med alle prosjekter
Ny side «Kunder» i KS Bygg. Systemet samler automatisk alle prosjekter per kunde (kundenavn på prosjektet). Hvert kundekort viser:
- Kontaktinfo som kan fylles ut og lagres (kontaktperson, telefon, e-post, adresse, org.nr., notat)
- Alle prosjekter på kunden – pågående og avsluttede – med status, periode og prosjektnummer
- Nøkkeltall: antall prosjekter, timer ført, avvik
- Søk og klikk rett inn i prosjektet

Kunder som skrives litt ulikt kan slås sammen manuelt.

## 5. «Siste 3 måneder» i timerapport
Hurtigvalget «Siste 3 måneder» legges inn i timerapport (PDF), Excel-eksport og timeoversikten, ved siden av denne uken / forrige uke / denne måneden / forrige måned.

## Teknisk

- Ny tabell `company_customers` (navn, kontaktperson, telefon, e-post, adresse, org.nr., notat, `company_id`, soft delete) med GRANT + RLS scoped på `company_id`. Kobling til prosjekt via ny nullable `customer_id` på `ks_module2_projects`; eksisterende `client_name` backfilles til kunderegisteret. Prosjekter uten kobling matches på navn.
- `CreateShiftDialog.tsx`: `employee_id` blir `employee_ids: string[]`, bulk-innsending via eksisterende `createSchedulesBulk`.
- Ny `BulkMessageDialog.tsx` + utvidelse av `useEmployeeMessages.ts` med `sendBulkMessage` (én rad per mottaker, felles `batch_id`).
- Ny `src/pages/ks2/Ks2Kunder.tsx` + `Ks2KundeDetalj.tsx`, rute i `App.tsx` og sidebar-lenke.
- `TimeReportDialog.tsx`, `TimeOversikt.tsx`, `timeEntryExport.ts`: nytt periodevalg `last_3_months`.
- Sidebar: `/time-registration` inn i personal-gruppen.

## Rekkefølge
1. Siste 3 måneder + snarvei til timeføring (raske)
2. Flere ansatte i arbeidsplanen
3. Gruppemelding
4. Kunderegister og kundekort
