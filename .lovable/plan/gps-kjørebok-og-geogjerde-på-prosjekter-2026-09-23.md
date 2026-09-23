# GPS-kjørebok og geogjerde på prosjekter

To utvidelser av det som allerede finnes: kjøreboken under "Min side" og timeregistrering/mannskapsliste i KS Bygg. Ingen nye moduler.

## 1. Kjørebok med GPS (utvider dagens kjørebok)

Dagens "Start tur"-dialog beholdes, men får GPS på toppen:

- Velg bil (allerede der), type kjøring (yrkes/privat/arbeidsreise), formål og valgfri destinasjon.
- "Start kjøretur" henter posisjon, fyller startadresse automatisk (kan overstyres) og starter sporing.
- Under turen: telefonen logger posisjon jevnlig, viser kjørt lengde, varighet og et tydelig merke "GPS-sporing aktiv". Stopp på over 3 minutter registreres som stopp.
- Mister vi GPS-signal, kommer det et rødt varsel i turkortet og en melding på telefonen; turen fortsetter og fortsetter å logge når signalet er tilbake.
- "Stopp kjøretur" setter sluttid, sluttadresse, total lengde og varighet. Brukeren får en kontrollside der alt kan rettes (adresser, km, formål, passasjerer) før lagring.
- Er turen knyttet til en bil i bilparken, legges kjørelengden til bilens kilometerstand.
- Ruten lagres og kan vises på kart på turen.
- Filtrering og eksport (Excel/PDF) utvides med: ansatt, kjøretøy, prosjekt, periode, yrkes-/privatkjøring. Turen får et valgfritt prosjektfelt.

Manuell registrering fungerer nøyaktig som i dag for de som ikke vil bruke GPS.

## 2. Geogjerde på prosjekter og stempling

Prosjektoppsett (KS Bygg → prosjektinfo):

- Ny bryter "Bruk geogjerde på dette prosjektet".
- Prosjektets adresse vises på kart; punktet kan flyttes, og radius velges (50/100/250/500 m eller egen verdi).
- Lagres på prosjektet.

Bedriftsinnstilling: "Tillat stempling utenfor området" — ja (krever begrunnelse) eller blokkér.

Start/stopp arbeidstid på prosjekt:

- Ved start og stopp hentes posisjon og det lagres dato/tid, prosjekt, posisjon, innenfor/utenfor og avstand i meter.
- Melding til ansatt: "Du er innenfor prosjektområdet" eller "Du er utenfor prosjektområdet (320 m). Vil du likevel starte?" med begrunnelsesfelt.
- Ingen sporing mellom start og stopp.

Mannskapsliste (Ks2Mannskap) får en ny seksjon "På plassen nå": hvem som er inne, inn- og uttidspunkt, grønn/rød/grå status og eventuell begrunnelse.

Administratorvisning i timeregistrering: fargeprikk grønn (innenfor), rød (utenfor), grå (ingen posisjon), klikkbar for kart som viser hvor stemplingen skjedde.

## Personvern

Posisjon lagres bare ved stempling, og under kjøretur til brukeren trykker stopp. Alle registreringer lagres med dato og klokkeslett, og appen viser tydelig når sporing er aktiv. Kort forklaring vises første gang brukeren gir posisjonstilgang.

## Teknisk

- Kart: Leaflet + OpenStreetMap-fliser (nytt avhengighet `leaflet`, `react-leaflet`); adresseoppslag via Kartverket/Nominatim som i dagens `Ks2ProjectMap`.
- Posisjon i nettleser: `navigator.geolocation.watchPosition` (kjørebok) og `getCurrentPosition` (stempling). Avstand og kjørelengde beregnes med haversine, med filtrering av unøyaktige punkter (>50 m nøyaktighet) og små bevegelser (<20 m).
- Database (migrasjoner med GRANT + RLS per bedrift):
  - `driving_log_entries`: nye felt `project_id`, `tracking_mode`, `start_lat/lng`, `end_lat/lng`, `gps_distance_km`, `duration_minutes`, `stops` (jsonb), `gps_lost` (bool).
  - Ny `driving_log_track_points` (entry_id, lat, lng, accuracy, recorded_at) for ruten.
  - `ks_module2_projects`: `geofence_enabled`, `geofence_lat`, `geofence_lng`, `geofence_radius_m`.
  - `company_ks_settings` (eller tilsvarende bedriftsinnstilling): `geofence_allow_outside`.
  - `time_clock_entries` + `time_entries`: `clock_in_lat/lng`, `clock_out_lat/lng`, `geofence_status_in/out` ('inside'|'outside'|'unknown'), `geofence_distance_in/out_m`, `geofence_reason`.
  - Kilometerstand: `company_vehicles.current_odometer` oppdateres ved lagret tur.
- Ny hook `useGeolocationTracker` (kjørebok) og `useGeofenceCheck` (stempling); gjenbrukes av `StartTripDialog`, `ActiveTripCard`, `CompleteTripDialog`, `StartStopTimer`/`TimeClock`, `Ks2Timeregistrering` og `Ks2Mannskap`.
- Eksport: `src/utils/drivingLogExport.ts` utvides med de nye filtrene og kolonnene.

## Rekkefølge

1. Migrasjoner + kartbibliotek.
2. GPS-kjørebok (start/under/stopp/kontroll/kilometerstand).
3. Filtrering og eksport i kjøreboken.
4. Geogjerde på prosjekt (kart, radius, bedriftsinnstilling).
5. Stempling med posisjonskontroll + meldinger.
6. Mannskapsliste og adminstatus med kart.
7. Test som ansatt og leder på PC og mobil, testdata slettes.
