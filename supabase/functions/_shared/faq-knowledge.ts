// FAQ-kunnskapsbase som injiseres i AI-assistentenes systemprompter.
// Holdes synkronisert manuelt med src/data/faqContent.ts.

export const FAQ_HMS = `# FAQ – IK HMS (Helse, miljø og sikkerhet)

## Kom i gang
Sp: Hva er IK HMS-modulen i HMS Proffen?
Sv: Et komplett internkontrollsystem for HMS. Dekker mål, risikovurderinger, rutiner, vernerunder, avvik, stoffkartotek, personalhåndbok og organisasjonskart – tilpasset bransje.
Sp: Hvordan kommer jeg i gang første gang?
Sv: Gå til IK HMS > Oppsett og kjør AI-oppsettet. Svar på spørsmål om bransje, ansatte og aktiviteter; systemet genererer mål, risikovurderinger og rutiner.
Sp: Kan jeg endre det AI-en lager?
Sv: Ja, alt kan redigeres, slettes eller suppleres manuelt.

## Risiko og avvik
Sp: Forskjell på risikovurdering og avvik?
Sv: Risikovurdering kartlegger farer på forhånd. Avvik er noe som faktisk har skjedd og må lukkes.
Sp: Hvordan registrerer ansatte avvik?
Sv: Fra mobilen via Avvik > Nytt avvik, eller via QR-kode på arbeidsplassen. Avviket får saksnummer og varsler ansvarlig.
Sp: Hva skjer når et avvik meldes?
Sv: Status Åpen. Ansvarlig varsles, behandler (årsak, tiltak, frist) og lukker det. Historikk lagres for tilsyn.

## Verneombud og vernerunder
Sp: Må vi ha verneombud?
Sv: Ja hvis 5 eller flere ansatte. Systemet henter ansattall fra Brønnøysundregistrene. Under 5 kan ha skriftlig avtale om unntak.
Sp: Hvor ofte vernerunder?
Sv: Minst én gang i året, mange kjører kvartalsvis. Bruk HMS > Vernerunder.

## Stoffkartotek
Sp: Hva må ligge i stoffkartoteket?
Sv: Alle kjemikalier og produkter som kan utgjøre helsefare. SDS skal være tilgjengelig for alle ansatte.
Sp: Kan jeg importere SDS automatisk?
Sv: Ja, last opp PDF – AI leser produktnavn, faresetninger, verneutstyr og kategori, og lager risikovurdering.

## Personalhåndbok og dokumentasjon
Sp: Hvor finner ansatte personalhåndboken?
Sv: Under Personalhåndbok i menyen. Tilgjengelig på mobil/PC, signeres digitalt.
Sp: Eksportere HMS-håndbok til tilsyn?
Sv: IK HMS > Dokumentasjon > Generer rapport. Komplett PDF med mål, organisasjon, risiko, rutiner og avvik.

## Tilgang og brukere
Sp: Hvordan inviterer jeg ansatte?
Sv: Brukere > Inviter. E-post med innloggingslenke. Velg rolle (admin, ansatt, verneombud osv.).
Sp: Ansatt har sluttet – hva gjør jeg?
Sv: Deaktiver brukeren. Historikk og signaturer beholdes; tilgang fjernes umiddelbart.`;

export const FAQ_MAT = `# FAQ – IK MAT (Mat- og serveringskontroll)

## Kom i gang
Sp: Hva er IK MAT?
Sv: Internkontrollsystem for mat-/serveringsvirksomheter basert på HACCP og Mattilsynets krav. Dekker temperaturlogg, renhold, sporbarhet, sjekklister, avvik og leverandøravtaler.
Sp: Hvordan setter jeg opp IK MAT?
Sv: IK MAT > Oppsett. Beskriv virksomheten, ansatte og utstyr. AI lager mål, HACCP-plan, renholdsplan og rutiner.

## Temperaturkontroll
Sp: Hvor ofte logge temperaturer?
Sv: Daglig logging av kjøleskap (under 4 °C) og frysere (under -18 °C). Systemet minner deg på det.
Sp: Hva ved temperaturavvik?
Sv: Avvik utenfor grenseverdier oppretter automatisk et avvik (IKM-Rut-0001) med tiltaksforslag.

## Sjekklister og renhold
Sp: Hvordan fungerer daglige sjekklister?
Sv: IK MAT > Sjekklister: daglige, ukentlige, månedlige rutiner. Ansatte huker av på mobilen og signerer.
Sp: Kan jeg lage egne sjekklister?
Sv: Ja, i Oppsett > Sjekklister. Bestem hyppighet og ansvarlig.

## HACCP og sporbarhet
Sp: Må jeg ha HACCP-plan?
Sv: Ja, alle som håndterer mat. AI-oppsettet foreslår basert på virksomhetstype.
Sp: Sporbarhet på råvarer?
Sv: IK MAT > Sporbarhet. Skann strekkode eller registrer batchnummer, leverandør, mottaksdato. Etiketter kan skrives ut.

## Kjøkkenplan og utstyr
Sp: Hva er kjøkkenplan-verktøyet?
Sv: Visuelt verktøy for å tegne kjøkkenet og plassere soner (varm/kald, ren/uren) – dokumenterer flytmotstrøm overfor Mattilsynet.
Sp: Hvordan legge inn kjøleskap/frysere?
Sv: Oppsett > Utstyr. Hvert apparat får ID og inngår i temperaturloggen.

## Tilsyn
Sp: Hva viser jeg Mattilsynet?
Sv: Dokumentasjonssenter > Generer rapport. Samlet PDF med mål, HACCP, rutiner, sjekklister, temperaturlogg og avvik.`;

export const FAQ_KS = `# FAQ – KS BYGG (Kvalitetssikring for bygg og anlegg)

## Kom i gang
Sp: Hva er KS BYGG-modulen?
Sv: Komplett KS-system for bygg/anlegg: prosjektstyring, sjekklister, SJA, vernerunder, byggesak, SHA-plan, underleverandører, daglige rapporter, økonomi, endringsmeldinger.
Sp: Forskjell på prosjekttypene?
Sv: Standard = fullskala. Lite prosjekt = forenklet. Mini = lettvekt for små oppdrag. Sidemenyen tilpasses automatisk.
Sp: Hvordan opprette nytt prosjekt?
Sv: KS BYGG > Prosjekter > Nytt prosjekt. Velg type, fyll inn kunde, adresse, roller. Standardrutiner kobles automatisk til.

## Sjekklister og SJA
Sp: Hvordan fylle ut sjekkliste på byggeplass?
Sv: Åpne prosjektet på mobil > Sjekklister > velg mal og fyll ut. Ta bilder, kommentarer, signer digitalt.
Sp: Hva er SJA og når brukes det?
Sv: Sikker Jobb Analyse – kort risikovurdering for arbeid med høy risiko (arbeid i høyden, varme arbeider, gravearbeid). Gjøres rett før oppstart, alle signerer.
Sp: Kan flere signere samme sjekkliste/SJA?
Sv: Ja – send mobilen rundt; hver person signerer på samme enhet med navn og tidspunkt.

## Byggesak og SAK10
Sp: Hva ligger i byggesak-modulen?
Sv: SAK10-blanketter (5174 søknad, 5181 ansvarsrett, 5167 gjennomføringsplan m.fl.). Fyll ut i appen og send PDF til kommunen.
Sp: Hva er Prosjekt-hjelperen / Bygg Proffen?
Sv: AI-assistent som kjenner prosjektet og hjelper med valg av rutiner, sjekklister, SAK10-krav og dokumentasjon.

## SHA-plan og HMS
Sp: Hvem fyller ut SHA-planen?
Sv: Byggherrens koordinator (KP/KU). Kobles til konkrete brukere; eksterne SHA-PDF-er kan lastes opp.
Sp: Hvordan håndteres avvik på byggeplass?
Sv: Prosjekt > HMS Avvik. Avvik får løpenummer, ansvarlig varsles, lukkes med tiltak, inngår i sluttrapport.

## Underleverandører
Sp: Hvordan registrere underleverandører?
Sv: Prosjekt > Underleverandører. Last opp egenerklæring og KS-håndbok. Mangler UE dokumentasjon kan moduler skjules.

## Daglige rapporter og økonomi
Sp: Hva registreres i daglig rapport?
Sv: Vær, bemanning, utført arbeid, hendelser, bilder. Nummer DR-YYYY-XXXX, samles i prosjektrapport.
Sp: Laste opp fakturaer/kvitteringer?
Sv: Prosjekt > Økonomi. Filer lagres sikkert med signerte lenker. Endringsmeldinger EM-XXXX sporer merkostnader.

## Sluttdokumentasjon
Sp: Generere sluttrapport?
Sv: Prosjekt > Dokumentasjon > Generer rapport. Velg elementer (include in rapport), last ned samlet PDF.
Sp: Hvor lenge lagres prosjektdokumentene?
Sv: Så lenge bedriften har aktivt abonnement. Anbefal å laste ned og arkivere lokalt etter prosjektslutt.`;
