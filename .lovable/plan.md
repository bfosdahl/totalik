# Vaktpåminnelser: pushvarsel på mobil + e-post

Ja, dette lar seg løse. To typer varsler for ansatte som står i arbeidsplanen:

1. **Ved tildeling** — den ansatte får beskjed med en gang en vakt legges inn (e-post finnes allerede, push kommer i tillegg).
2. **Påminnelse før arbeidsdagen** — automatisk varsel om morgenen (og eventuelt kvelden før) med dato, klokkeslett, sted/prosjekt og rolle.

## Hva som bygges

### 1. Ekte pushvarsler
Systemet har i dag knapper for å slå på push, men varslene blir bare loggført – ingenting sendes ut til telefonen. Dette fullføres:
- Faktisk utsending av webpush til registrerte telefoner/nettlesere.
- Trykk på varselet åpner arbeidsplanen.
- Døde abonnementer (avinstallert app, tilbakekalt tillatelse) ryddes automatisk.

Merk: På iPhone må Totalik være lagt til på hjemskjermen for at pushvarsler skal virke. Det står allerede en «Last ned app»-veiledning i systemet; vi legger inn en tydelig påminnelse i varslingsinnstillingene.

### 2. Morgenpåminnelse
En jobb kjører hver morgen og sender til alle ansatte som har vakt den dagen:
- Pushvarsel: «I dag 07:00–15:30 – Prosjekt Storgata 4, Bergen».
- E-post med samme innhold, i Totalik-mal.

Standard sendetid kl. 06:00 lokal tid, valgfritt også kveldsvarsel dagen før kl. 19:00.

### 3. Innstillinger
- Ansatt: skru av/på vaktpåminnelser på push og e-post hver for seg.
- Bedriftsadmin: velge om bedriften skal ha morgenvarsel, kveldsvarsel eller begge, og hvilket klokkeslett.

## Teknisk

- `send-push-notification`: bytt logg-stub med reell webpush-sending (VAPID-nøkler ligger allerede som hemmeligheter), håndter 404/410 ved å slette abonnementet.
- `public/sw.js` / `service-worker.js`: `push`- og `notificationclick`-håndterere.
- Ny Edge Function `notify-shift-reminders`: leser `work_schedules` for aktuell dato per bedrift, slår opp ansatt-e-post og push-abonnement, respekterer `user_notification_settings` og bedriftsinnstillinger, dedupliserer via `notification_log` slik at samme vakt aldri varsles to ganger.
- `pg_cron`: én jobb hver hele time som kaller funksjonen via `invoke_cron_edge_function`; funksjonen sender kun til bedrifter der lokal tid matcher valgt varslingstid. Én time-jobb i stedet for mange, for å holde kostnad og kompleksitet nede.
- Nye kolonner: varslingsvalg i `company_notification_settings` og `user_notification_settings` (push/e-post for vakter, tidspunkt).
- Ved oppretting av vakt: eksisterende e-postvarsel beholdes, push legges til i samme flyt.

## Utenfor omfang
- SMS.
- Endring av selve arbeidsplanleggeren eller vaktvisningen.
