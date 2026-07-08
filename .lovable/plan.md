# Parkert senere: frittstående nyhetsbrev-løsning

Bygg ett eget Lovable-prosjekt for nyhetsbrev, f.eks. `nyhetsbrev.athenahms.no`, som henter kontaktlister fra Total-IK, Kurskontoret og fremtidige prosjekter via API. Første MVP bør ha kontakt-sync, segmenter, enkel kampanjeoversikt og sending via Resend/Audiences/Broadcasts, slik at editor, statistikk og avmelding slipper å bygges fra scratch i Total-IK og Kurskontoret.

Når vi tar dette opp igjen: start med alternativ A/hybrid — sync til Resend Audiences først, og bygg eventuell egen full modul senere hvis behovet blir stort nok.

---

# Plan: Forbedringer i timeføring og lønnsgrunnlag

Tre punkter fra Eirik (SSM Marine). Jeg implementerer alt sammen.

## 1. Fra–til-klokkeslett på timelinjer

**Status i dag:** `time_entries` lagrer bare `hours` (desimal). Det finnes ingen fra/til-felter. Derfor kan vi ikke vise eller validere det.

**Endring:**
- Legg til `start_time time` og `end_time time` på `time_entries` (nullable for bakoverkompatibilitet).
- Oppdater registreringsdialogene (`NewTimeEntryDialog`, `DailyTimeView`, `WeeklyTimeView`) så ansatte velger fra/til; `hours` beregnes automatisk. Hvis man bare vil føre desimaltimer (som før) er feltene valgfrie.
- Vis `08:00–16:00` ved siden av beskrivelse i alle timelister: `TimeOversikt`, `Payroll`, daglig/ukentlig oversikt, og admin-detaljer.

## 2. Admin redigerer/justerer ansattes timer

**Status i dag:** Admin kan godkjenne/avvise, men ikke endre timer eller beskrivelse i ettertid.

**Endring:**
- Ny dialog `AdminEditTimeEntryDialog` med felt for: dato, fra–til, timer, prosjekt, beskrivelse, hour_type, og påkrevd **«Årsak til endring»**.
- Rediger-knapp synlig for `company_admin`/`system_admin` på hver timelinje (i `Payroll` og `TimeRegistration`).
- Alle endringer logges automatisk i `audit_log` (eksisterende generisk audit-trigger fanger dette opp — vi legger til triggeren på `time_entries` hvis den mangler).
- Lagrer årsak som en kommentar/note (ny kolonne `admin_edit_reason text` + `admin_edited_by uuid` + `admin_edited_at timestamptz` på `time_entries`).

## 3. Varsel til ansatt når admin endrer

Tre kanaler samtidig:
- **In-app (bjelle):** Insert i `notification_log` med tittel «Timene dine ble justert av admin» + lenke til dagen.
- **E-post (Resend):** Ny edge function `notify-time-entry-edited` sender e-post med gammel/ny verdi + årsak. BCC ben@athenahms.no.
- **Push:** Hvis ansatt har push_subscription, sendes push via eksisterende `send-push-notification`-funksjon.

Alle tre trigges fra edge-funksjonen `admin-edit-time-entry` som også gjør selve oppdateringen (atomisk: oppdater rad → log → varsler).

## 4. Forbedret lønnsgrunnlag-eksport (begge sider)

**TimeOversikt (`/time-oversikt`):**
- Behold sammendraget Normal/50%/100%/Totalt
- Legg til kolonner for **tillegg** (diett, km, passasjer, reisetimer, smuss) — hentes fra `time_entry_allowances` + `company_allowance_types`
- Ny fane **«Detaljer»** med: Dato | Ansatt | Fra | Til | Timer | Type (normal/50%/100%) | Prosjekt | Beskrivelse | Status

**Payroll (`/payroll`):**
- Splitt «Timer (sum)» i `Normal | 50% overtid | 100% overtid` i sammendraget
- Behold tillegg/grunnlønn-kolonner
- Detaljfanen får fra–til + tydelig hour_type-kolonne
- Ekstra fane **«Tillegg detaljert»**: én rad per tillegg med ansatt, dato, type, antall, sats, beløp

## Teknisk

**Migrering:**
```sql
ALTER TABLE public.time_entries
  ADD COLUMN start_time time,
  ADD COLUMN end_time time,
  ADD COLUMN admin_edit_reason text,
  ADD COLUMN admin_edited_by uuid,
  ADD COLUMN admin_edited_at timestamptz;

SELECT public.attach_audit_trigger('time_entries');
```

**Filer som endres:**
- `supabase/migrations/<ny>.sql`
- `supabase/functions/admin-edit-time-entry/index.ts` (ny)
- `supabase/functions/notify-time-entry-edited/index.ts` (ny — e-post)
- `src/components/timeregistration/NewTimeEntryDialog.tsx`
- `src/components/timeregistration/DailyTimeView.tsx`, `WeeklyTimeView.tsx` (vis fra–til)
- `src/components/timeregistration/AdminEditTimeEntryDialog.tsx` (ny)
- `src/pages/TimeOversikt.tsx` (eksport + detaljfane + rediger-knapp)
- `src/pages/Payroll.tsx` (rediger-knapp + bedre eksport-kall)
- `src/utils/timeEntryExport.ts` (ny detalj- og tilleggsfane, splittede overtidskolonner)
- `src/hooks/useAdminHoursSummary.ts` (returnere fra/til + tilleggsbeløp)

## Rekkefølge

1. Migrering + edge functions først
2. Eksportforbedringer (kan ferdigstilles uten UI)
3. Vis fra–til i UI
4. Admin-edit-dialog med varslinger
5. Test med Eirik’s test-konto før vi sier ifra
