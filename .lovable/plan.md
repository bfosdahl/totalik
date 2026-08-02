Bygge ferdig sensor-løsningen for IK Mat uten fysisk hardware. Alt gjøres i rekkefølge A → D.

## A) Simuleringsmodus – teste hele sensorkjeden uten fysisk sensor

- Legg til `simulation_mode` (boolean) og `simulated_payload` (jsonb) på `public.ik_mat_sensors`.
- Opprett `ik-mat-sensor-simulate` Edge Function:
  - Genererer realistic temperatur/fukt/batteri-data basert på sensorprofil.
  - Sender payload til samme webhook-handler som fysisk sensor.
  - Støtter scenarier: normal, åpen dør (stigende temp), lavt batteri, offline.
- UI: Knapp i `IkMatSensorer.tsx` for "Start simulering" / "Stopp simulering" per sensor.
- Sikkerhet: Simulering kan kun aktiveres av `company_admin` og logges i `ik_mat_sensor_payload_log` med `source: 'simulation'`.

## B) Integrasjonsguide / API-dokumentasjon for leverandører

- Opprett `SensorVendorDocs.tsx` (modal/sidepanel i `IkMatSensorer.tsx`).
- Viser:
  - Webhook-URL med `endpoint_id` og `company_id`.
  - Eksempel på TTN-payload (uplink_message.decoded_payload).
  - HMAC-signeringsinstruksjoner.
  - Push vs. Pull-modus forklaring.
  - Test-knapp som kaller `ik-mat-sensor-webhook` med en test-payload.
- Lagre generert dokument som Markdown i `src/docs/sensor-vendor-integration.md`.

## C) Varslingsoppsett – e-post/SMS-mal for avvik

- Utvid `public.company_notification_settings` med sensor-relaterte felter:
  - `sensor_alarm_email` (boolean)
  - `sensor_alarm_email_recipients` (text[])
  - `sensor_alarm_sms` (boolean) – placeholder, ikke faktisk SMS uten gateway
- Opprett `ik-mat-sensor-notify` Edge Function:
  - Hentes av `ik-mat-sensor-watchdog` når avvik oppdages.
  - Sender e-post via Resend til valgte mottakere med sensor, temperatur, tid, avvik-ID.
  - Bruker eksisterende `RESEND_API_KEY` og `notify-*` malmønster.
- UI: Alarmmottakere i `SensorAlarmSettings.tsx`.

## D) Dashboard-forbedringer – live-visning, filtre, eksport

- Utvid `IkMatSensorer.tsx` med:
  - Live-statuskort: antall sensorer online/offline/alarm.
  - Filtrering på status, type, lokasjon.
  - Temperaturgraf per sensor (siste 24 timer) fra `ik_mat_temperature_logs`.
  - Eksport av temperaturhistorikk til CSV.
- Sikkerhet: RLS på alle nye/spørringer må filtreres på `company_id`.

## Avhengigheter og tekniske detaljer

- Bruker eksisterende tabeller: `ik_mat_sensors`, `ik_mat_sensor_endpoints`, `ik_mat_sensor_payload_log`, `ik_mat_sensor_alerts`, `ik_mat_temperature_logs`.
- Eksisterende Edge Functions utvides: `ik-mat-sensor-webhook`, `ik-mat-sensor-watchdog`, `ik-mat-sensor-poll`.
- Ny Edge Function: `ik-mat-sensor-simulate`, `ik-mat-sensor-notify`.
- Ingen nye tredjeparts-sekreter kreves; bruker `RESEND_API_KEY` og `ADMIN_ACTIONS_SECRET`.

## Akseptansekriterier

- En bruker kan aktivere simulering på en sensor og se temperaturdata uten hardware.
- Leverandørdokumentasjonen kan kopieres/klistres inn i e-post til sensorleverandør.
- Alarm-epost sendes til valgte mottakere når watchdog oppdager avvik.
- Dashboardet viser live status, filtre og CSV-eksport.