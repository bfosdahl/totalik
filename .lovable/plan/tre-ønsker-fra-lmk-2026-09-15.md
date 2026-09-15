# Tre ønsker fra LMK

## 1. Velge kunde fra kundelisten i prosjekt
I «Nytt prosjekt» (både vanlig og enkeltprosjekt) kommer det et felt «Velg kunde» øverst under Byggherre:
- Søk i kundelisten (`/ks/kunder`) og velg kunde — navn, org.nr., kontaktperson, telefon, e-post og adresse fylles inn automatisk
- Feltene kan fortsatt redigeres manuelt etterpå
- «Ny kunde» kan velges direkte i dialogen; kunden lagres da i kunderegisteret samtidig som prosjektet opprettes
- Prosjektet kobles til kunden, så kundekortet viser prosjektet med én gang

## 2. Org.nr. henter bedriftsinfo automatisk
Skriv inn 9 siffer i org.nr.-feltet, og systemet henter fra Brønnøysundregistrene:
- Firmanavn
- Forretningsadresse (gate, postnummer, sted)

Gjelder både prosjektdialogen og kundekortet (ny/rediger kunde). Liten «henter…»-indikator mens det slås opp, og stille fallback hvis nummeret ikke finnes — da skriver man inn selv.

## 3. Meldinger til alle ansatte på dashbordet
Nytt «Oppslagstavle»-kort øverst på dashbordet:
- Administrator skriver en melding til alle ansatte (tittel + tekst, valgfri gyldig-til-dato)
- Viktige meldinger kan festes øverst med «Fest øverst» — de vises alltid først, med markering
- Ansatte ser meldingene på dashbordet og kan kvittere «Lest»; leste, ikke-festede meldinger skjules etter kvittering
- Administrasjon av meldingene (opprett, rediger, fest/løsne, slett) skjer fra samme kort

## Teknisk

- Ny tabell `company_announcements`: `company_id`, `title`, `body`, `is_pinned`, `publish_at`, `expires_at`, `created_by`, soft delete-felt. GRANT + RLS: lesing for innloggede i samme selskap, skriving kun for `is_company_admin`.
- Ny tabell `company_announcement_reads` (`announcement_id`, `profile_id`, `read_at`) med RLS på egen rad.
- Ny hook `useCompanyAnnouncements.ts` og komponent `src/components/dashboard/AnnouncementsBoard.tsx`, plassert øverst i `src/pages/Index.tsx`.
- Ny hjelpefunksjon `src/lib/brregLookup.ts` (fetch mot `data.brreg.no/enhetsregisteret/api/enheter/{orgnr}`, returnerer navn + adresse), gjenbrukt i `NewProjectDialog.tsx`, `NewSimpleProjectDialog.tsx` og `Ks2Kunder.tsx`.
- Ny komponent `CustomerPicker.tsx` (combobox mot `company_customers`) brukt i `NewProjectDialog.tsx` og `NewSimpleProjectDialog.tsx`; setter `customer_id` på `ks_module2_projects` og fyller `client_*`-feltene.
- Oppretting av ny kunde fra prosjektdialog gjenbruker samme insert som kundesiden.

## Rekkefølge
1. Org.nr.-oppslag (raskest, gjenbrukes av de andre)
2. Kundevelger i prosjekt
3. Oppslagstavle på dashbord
