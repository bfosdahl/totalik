# Prosjektbasert timeføring + administrerbare tillegg

## Hva som bygges

### 1. Prosjekt-hub (mobil + PC)
Ny side `/mine-prosjekter` (utvider eksisterende `MineProsjekterDashboard`) som viser alle KS-prosjekter brukeren har tilgang til. Klikk på prosjekt → snarvei-grid med:
- Timeføring (forhåndsutfylt med prosjekt)
- Sjekklister, SJA, Avvik, Vernerunde, Dagsrapport, Bilder

På mobil legges også «Mine prosjekter» som ny fane i bunnmenyen (erstatter eller flytter en av dagens).

### 2. Utvidet timeføring
Time-entry-dialogen får nye felter:
- **Prosjekt** (kobling til `ks_module2_projects` – viser også kunde fra `client_name`)
- **Kunde** (auto-fylt fra prosjekt, kan overstyres for ikke-prosjekt-arbeid)
- **Beskrivelse**
- **Timetype**: Normal, 50 % overtid, 100 % overtid
- **Tillegg** (multi-rad): velg type fra liste + antall (timer/dager/km/stk) + auto-beregnet beløp

### 3. Administrerbare satser (Innstillinger → Lønn & satser)
Ny admin-side hvor bedriftsadmin kan opprette/redigere tilleggstyper:
- Navn (f.eks. «Diett innenlands», «Brudd på hvile», «Reisetimer»)
- Enhet: time / dag / km / stk / fast
- Sats (kr per enhet)
- Aktiv/inaktiv

Standardtyper seedes automatisk for nye bedrifter (statens satser for diett/km, reisetimer, hvilebrudd).

## Database (migrasjon)

```text
time_entries (utvides)
  + customer_name           text
  + hour_type               text  -- 'normal' | 'overtime_50' | 'overtime_100'
  + ks_project_id           uuid  -- FK ks_module2_projects (project_id beholdes for legacy)

time_entry_allowances (ny)
  id, time_entry_id (FK cascade), allowance_type_id (FK),
  quantity numeric, rate_snapshot numeric, amount numeric,
  notes text, created_at

company_allowance_types (ny)
  id, company_id, name, unit ('hour'|'day'|'km'|'piece'|'fixed'),
  rate numeric, is_active bool, sort_order int, is_default bool
```

RLS: company_id-isolering på begge, ansatte ser/oppretter egne `time_entry_allowances` via `time_entries.user_id`. Trigger seeder standardtyper når en bedrift opprettes.

## UI-endringer
- `Ks2NewTimeEntryDialog` + ny generell `TimeEntryDialog` får prosjektvelger, timetype-radioer og tilleggs-seksjon (med + Legg til-knapp per linje)
- Ny side: `src/pages/admin/AllowanceTypes.tsx` (Innstillinger-meny)
- Ny side/utvidelse: `src/pages/MyProjects.tsx` med snarvei-grid per prosjekt
- Mobile FAB på prosjektside med samme snarveier
- Rapport-PDF og Tripletex-sync utvides senere (ikke i denne runden – tillegg lagres allerede strukturert)

## Hva som IKKE er med i denne runden
- Tripletex-sync av tillegg (sender bare timer/timetype foreløpig)
- Rapport-eksport av tillegg som egne linjer i PDF
- Automatisk beregning av reisetimer fra kjørebok
Disse kan tas i neste iterasjon når dere har testet flyten.

## Implementeringsrekkefølge
1. Migrasjon (utvide `time_entries`, opprette `company_allowance_types` + `time_entry_allowances`, seed-trigger, RLS)
2. Hook `useAllowanceTypes` + admin-side
3. Oppdater `TimeEntryDialog` + `Ks2NewTimeEntryDialog` med nye felter
4. Ny prosjekt-hub med snarvei-grid
5. Mobile bunnmeny + FAB-justering
