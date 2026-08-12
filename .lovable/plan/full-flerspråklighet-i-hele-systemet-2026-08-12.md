# Full flerspråklighet i hele systemet

## Situasjonen i dag

- 5 språk er satt opp (norsk, engelsk, polsk, litauisk, latvisk) med 378 nøkler i hver fil.
- Men bare 2 av 469 skjermfiler bruker faktisk oversettelsene. Resten har norsk tekst hardkodet rett i koden.
- Derfor endrer språkvelgeren i praksis nesten ingenting utenom håndbok-PDF og noen få steder.

Å oversette alt manuelt er urealistisk å gjøre i én omgang. Planen er en industrialisert prosess: automatisk uthenting av tekster, AI-oversettelse til 4 språk, og utrulling modul for modul slik at systemet er brukbart hele veien.

## Slik gjør vi det

### 1. Verktøykjede (engangsjobb)
- Skript som skanner en fil, finner norsk brukertekst (JSX-tekst, knapper, labels, toast/feilmeldinger) og bytter den ut med `t("modul.nokkel")`.
- Skript som sender alle nye norske nøkler til AI-oversettelse og fyller `en/pl/lt/lv`.
- Paritetstest i CI: bygget feiler hvis et språk mangler nøkler, og en lint-regel flagger ny hardkodet norsk tekst i JSX.

### 2. Utrulling i puljer (prioritert etter hva utenlandske arbeidere faktisk bruker)
1. **Pulje A – daglig bruk:** innlogging, meny/sidebar, dashboard, timeføring, avvik, SJA, sjekklister, dagsrapporter, varsler.
2. **Pulje B – ansattflater:** min side, arbeidskontrakter, personal/HR, dokumenter, opplæring, IK MAT-registreringer.
3. **Pulje C – admin/oppsett:** oppsettveivisere, rapporter, innstillinger, adminsider (lav prioritet – admin er stort sett norsk).

Hver pulje: kjør uthenting → AI-oversettelse → manuell gjennomgang av nøkkeltekster (juridiske begreper som verneombud, avvik, HMS) → test i alle 5 språk.

### 3. Innhold fra databasen
Kundens egne tekster (rutiner, sjekklistepunkter, avviksbeskrivelser) ligger i databasen og kan ikke oversettes statisk. Disse får samme "Oversett"-knapp som håndboken bruker i dag (AI-oversettelse ved behov), først på sjekklister og SJA.

### 4. Brukerens språkvalg
Språkvalget lagres på brukerprofilen i tillegg til nettleseren, slik at det følger med mellom telefon og PC. E-poster og PDF-er bruker samme valg.

## Teknisk

- `react-i18next` er allerede initialisert i `src/main.tsx` – vi bygger videre på den, ingen ny pakke.
- Nøkkelstruktur per modul: `ks.*`, `hms.*`, `ikmat.*`, `hr.*`, `time.*`, `common.*`.
- PDF-generatorene får samme mønster som `src/utils/handbookPdfLabels.ts` (etikettsett per språk + Unicode-font).
- Ny kolonne `profiles.preferred_language` for lagret språkvalg.
- CI-jobb `i18n-parity` som sammenligner nøkler på tvers av de 5 språkfilene.

## Omfang

Dette er en stor jobb (469 filer). Forslag: jeg starter med Pulje A nå, viser deg resultatet, og så tar vi B og C i egne runder.
