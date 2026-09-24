# Avdelinger i timer og ansatte + avdelingsleder-rolle (Leons Markedskapital)

## Hva kunden får
1. **Ukesrapport per avdeling/prosjekt** – I timerapporten (PDF/Excel) kan man velge uke, prosjekt og avdeling. Rapporten viser bare ansatte som faktisk har ført timer på prosjektet, gruppert per avdeling med sum.
2. **Ansatte filtrert på avdeling** – Ansattlisten og timelisten ("Alle ansatte") får en avdelingsvelger.
3. **Tre brukertyper**
   - Bedriftsadmin: ser alt.
   - Avdelingsleder: ser bare ansatte, timer og rapporter i egen(e) avdeling(er). Kan godkjenne/endre timer der.
   - Ansatt: ser bare seg selv.
   Avdelingsleder settes på ansattkortet (bryter "Avdelingsleder" per avdeling). Rollen finnes allerede delvis i systemet – den kobles nå inn i timer, ansatte og rapporter.
4. **Standard arbeidsdag 7,5 timer** – Tolkning: norsk normal arbeidsdag (37,5 t/uke). Ny timeføring foreslår 7,5 t (f.eks. 07:00–15:00 med 30 min pause), hurtigknappen "8 timer" blir "7,5 timer". Bedriftsadmin kan endre standarden under innstillinger (7,5 som standard).

## Teknisk
- Gjenbruk `user_departments.is_department_admin` og `is_department_admin_for()` – ingen ny rolle i `user_roles`.
- RLS på `time_entries`, `time_clock_entries` og profiler-lesing: utvid SELECT/UPDATE med avdelingsleder for ansatte i samme avdeling (`primary_department_id` eller `user_departments`). Selskapsgrense beholdes.
- `TimeReportDialog` + `timeReportPdf`/`timeEntryExport`: filtre for avdeling, prosjekt og uke; gruppering per avdeling.
- `TimeEntryList`/ansattliste: avdelingsvelger; avdelingsleder låst til egne avdelinger.
- Innstilling `standard_daily_hours` (default 7.5) i bedriftens timeregistrerings-innstillinger; brukes i `NewTimeEntryDialog` og hurtigvalg.
- Test som bedriftsadmin, avdelingsleder og ansatt på PC og mobil; testdata slettes.
