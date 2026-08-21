# Automatisk aktiveringsflyt for nye KS Bygg-kunder

Mål: en ny KS Bygg-kunde skal komme fra "modul aktivert" til "første prosjekt i gang med maler, rutiner og sjekklister" på under 10 minutter, uten manuell hjelp fra dere.

## Hva finnes allerede
- `KsOppsett.tsx` + `KsSetupChat.tsx`: AI-chat som setter opp firmanivå (kvalitetsmål, systemmål, sjekklistemaler).
- `Ks2WelcomeCard.tsx`: enkel steg-liste inne i et eksisterende prosjekt (maler, prosjektinfo, UE).
- `NewProjectDialog.tsx` + `Ks2ProjectSetupChat.tsx`: prosjektopprettelse med AI-hjelp.
- Admin-maler: `admin_checklist_templates`, `admin_routine_templates_v2`, `admin_project_type_templates`.

Problemet i dag: bitene finnes, men de henger ikke sammen. Kunden logger inn, ser et tomt dashboard og vet ikke hvor den skal starte (jf. Fasadeteknikk – bestilte, logget inn én gang, brukte aldri modulen).

## Foreslått løsning: én sammenhengende aktiveringsveiviser

### 1. Aktiveringsstatus i databasen
Ny tabell `ks_activation_progress` (per company):
- `company_id`, `current_step`, `completed_steps` (jsonb), `first_project_id`, `completed_at`, `dismissed_at`, tidsstempler.
- RLS: kun eget company (`get_user_company_id()`), admin-skriv, service_role for edge functions.

Dette gir både kunden en huskeliste og dere en rapport over hvem som står fast.

### 2. Veiviser i 5 steg (`/ks/aktivering`)
Én side, ett steg om gangen, alltid mulig å hoppe over:

1. **Bedriftsprofil** – bransje, entreprenørtype (total/hoved/under), antall ansatte, sentralgodkjenning ja/nei. Gjenbruker eksisterende AI-oppsett i bakgrunnen.
2. **Grunnmaler opprettes automatisk** – ett klikk. Systemet kopierer et kuratert basissett fra admin-malene, filtrert på bransje/entreprenørtype:
   - 6–10 sjekklister (oppstart, egenkontroll, vernerunde, sluttkontroll, m.m.)
   - 5–8 KS-rutiner (avviksbehandling, endringsmelding, dokumentstyring, UE-oppfølging)
   - Kvalitetsmål og systemmål
   - Standard dokumentmapper
   Med visning av hva som ble opprettet, og mulighet til å velge bort.
3. **Første prosjekt** – kort skjema (navn, adresse, byggherre, prosjekttype). Oppretter prosjektet og kobler på malsettet fra steg 2.
4. **Team** – inviter 1–3 kolleger (gjenbruker `invite-user`), sett prosjektleder/HMS-ansvarlig.
5. **Prøv det ut** – guidet mikro-oppgave: fyll ut én sjekkliste eller én dagsrapport, med direktelenke. Fullført steg = aktivert kunde.

Progresjonsbar øverst, "Fortsett der du slapp" ved neste innlogging.

### 3. Automatisk start
- Når modulen `IK_BYGG` aktiveres og det ikke finnes aktiveringsrad → rad opprettes.
- Første innlogging etter aktivering: redirect til `/ks/aktivering` (kan avvises, da vises et banner på KS-dashbordet i stedet).
- `Ks2WelcomeCard` blir konsistent med samme steg-modell i stedet for egen localStorage-logikk.

### 4. Oppfølging for dere
- Admin-visning (i `AdminLicenses`/`AdminMonitoring`-stil): hvilke KS-kunder har fullført aktivering, hvem står fast og hvor.
- Edge function `ks-activation-nudge` (daglig cron): e-post til kunder som ikke har fullført innen 3 og 10 dager, med lenke rett til neste steg. Bruker eksisterende e-postoppsett og innloggingsblokk.

## Teknisk oppsummering
- Migrasjon: `ks_activation_progress` + GRANT + RLS + `updated_at`-trigger.
- Ny side `src/pages/ks2/Ks2Aktivering.tsx` og steg-komponenter under `src/components/ks2/activation/`.
- Ny hook `useKsActivation.ts` (status, gå til steg, marker fullført).
- Ny hjelper `src/lib/applyKsBaseTemplates.ts` som kopierer admin-maler til `company_ks_*`-tabellene idempotent (kjører ikke på nytt hvis maler alt finnes).
- Rute i `App.tsx` + lenke i sidebar, samt redirect-logikk ved aktiv modul.
- Edge function `ks-activation-nudge` + cron.
- Oversettelser for alle 5 språk (NO/EN/PL/LT/LV).

## Avgrensninger
- Ingen endring i eksisterende prosjekter eller maler kunden alt har laget – alt er idempotent og legger kun til det som mangler.
- AI brukes kun til å foreslå utvalg av maler, ikke til å generere nytt innhold fra bunn.

## Spørsmål før bygging
1. Skal veiviseren være obligatorisk (redirect ved første innlogging) eller kun et banner kunden selv velger?
2. Skal steg 2 opprette malsettet automatisk med ett klikk, eller skal kunden hake av manuelt hva den vil ha?
