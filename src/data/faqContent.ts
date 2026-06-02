// Sentral FAQ-kunnskapsbase for HMS Proffen, MAT Proffen og Bygg Proffen.
// Brukes både av /hjelp-siden og av AI-assistentene i edge-funksjonene.

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export interface FaqModule {
  key: "hms" | "mat" | "ks";
  title: string;
  subtitle: string;
  sections: FaqSection[];
}

export const FAQ_MODULES: FaqModule[] = [
  {
    key: "hms",
    title: "IK HMS",
    subtitle: "Helse, miljø og sikkerhet",
    sections: [
      {
        title: "Kom i gang",
        items: [
          {
            q: "Hva er IK HMS-modulen i HMS Proffen?",
            a: "Et komplett internkontrollsystem for helse, miljø og sikkerhet. Den dekker mål, risikovurderinger, rutiner, vernerunder, avvik, stoffkartotek, personalhåndbok og organisasjonskart – alt på ett sted og tilpasset din bransje.",
          },
          {
            q: "Hvordan kommer jeg i gang første gang?",
            a: "Gå til IK HMS > Oppsett og kjør AI-oppsettet. Du svarer på noen spørsmål om bransje, ansatte og aktiviteter, og systemet genererer mål, risikovurderinger og rutiner som passer bedriften.",
          },
          {
            q: "Kan jeg endre det AI-en lager?",
            a: "Ja. Alt AI-en lager kan redigeres, slettes eller suppleres manuelt. Du eier innholdet – AI-en gir bare et solid utgangspunkt.",
          },
        ],
      },
      {
        title: "Risiko og avvik",
        items: [
          {
            q: "Hva er forskjellen på risikovurdering og avvik?",
            a: "En risikovurdering kartlegger farer på forhånd og setter tiltak for å redusere sannsynlighet og konsekvens. Et avvik er noe som faktisk har skjedd eller blitt oppdaget, og som må lukkes med tiltak.",
          },
          {
            q: "Hvordan registrerer ansatte avvik?",
            a: "Ansatte melder avvik fra mobilen via Avvik > Nytt avvik, eller via QR-koden som henges opp på arbeidsplassen. Avviket får automatisk saksnummer og varsler riktig person.",
          },
          {
            q: "Hva skjer når et avvik blir meldt?",
            a: "Avviket havner i status Åpen. Ansvarlig får varsel, behandler det (årsak, tiltak, frist) og lukker det når tiltaket er gjennomført. All historikk lagres for tilsyn.",
          },
        ],
      },
      {
        title: "Verneombud og vernerunder",
        items: [
          {
            q: "Må vi ha verneombud?",
            a: "Ja hvis bedriften har 5 eller flere ansatte. Systemet henter ansattall fra Brønnøysundregistrene og krever verneombud når grensen passeres. Mindre bedrifter kan inngå skriftlig avtale om unntak.",
          },
          {
            q: "Hvor ofte bør vi gjennomføre vernerunder?",
            a: "Minst én gang i året er anbefalt minimum. Mange bedrifter kjører kvartalsvise runder. Bruk HMS > Vernerunder for å planlegge, gjennomføre og signere digitalt.",
          },
        ],
      },
      {
        title: "Stoffkartotek",
        items: [
          {
            q: "Hva må ligge i stoffkartoteket?",
            a: "Alle kjemikalier og produkter som brukes i bedriften som kan utgjøre helsefare. Sikkerhetsdatablad (SDS) skal være tilgjengelig for alle ansatte.",
          },
          {
            q: "Kan jeg importere sikkerhetsdatablad automatisk?",
            a: "Ja. Last opp PDF-en, så leser AI-en ut produktnavn, faresetninger, verneutstyr og kategori. Du får en risikovurdering på kjøpet.",
          },
        ],
      },
      {
        title: "Personalhåndbok og dokumentasjon",
        items: [
          {
            q: "Hvor finner ansatte personalhåndboken?",
            a: "Under Personalhåndbok i menyen. Den er tilgjengelig på mobil og PC, og ansatte signerer digitalt for å bekrefte at de har lest den.",
          },
          {
            q: "Hvordan eksporterer jeg HMS-håndboken til tilsyn?",
            a: "Gå til IK HMS > Dokumentasjon og klikk Generer rapport. Du får en komplett PDF med mål, organisasjon, risiko, rutiner og avvik.",
          },
        ],
      },
      {
        title: "Tilgang og brukere",
        items: [
          {
            q: "Hvordan inviterer jeg ansatte?",
            a: "Gå til Brukere og klikk Inviter. Den ansatte får e-post med innloggingslenke. Du velger rolle (administrator, ansatt, verneombud osv.).",
          },
          {
            q: "En ansatt har sluttet – hva gjør jeg?",
            a: "Deaktiver brukeren fra Brukere. Historikk, signaturer og avvik beholdes for sporbarhet, men personen mister tilgang umiddelbart.",
          },
        ],
      },
    ],
  },
  {
    key: "mat",
    title: "IK MAT",
    subtitle: "Mat- og serveringskontroll",
    sections: [
      {
        title: "Kom i gang",
        items: [
          {
            q: "Hva er IK MAT?",
            a: "Et internkontrollsystem for mat- og serveringsvirksomheter, basert på HACCP-prinsippene og Mattilsynets krav. Det dekker temperaturlogg, renhold, sporbarhet, sjekklister, avvik og faste leverandøravtaler.",
          },
          {
            q: "Hvordan setter jeg opp IK MAT?",
            a: "Gå til IK MAT > Oppsett. Du beskriver virksomheten (kafé, restaurant, kantine osv.), antall ansatte og utstyr. AI-en lager mål, HACCP-plan, renholdsplan og rutiner tilpasset driften.",
          },
        ],
      },
      {
        title: "Temperaturkontroll",
        items: [
          {
            q: "Hvor ofte må jeg logge temperaturer?",
            a: "Anbefalt minimum er daglig logging av kjøleskap (under 4 °C) og frysere (under -18 °C). Systemet minner deg på det og oppretter automatisk avvik ved manglende logg.",
          },
          {
            q: "Hva skjer ved temperaturavvik?",
            a: "Hvis du registrerer en temperatur utenfor grenseverdiene, opprettes det automatisk et avvik (IKM-Rut-0001) med forslag til tiltak.",
          },
        ],
      },
      {
        title: "Sjekklister og renhold",
        items: [
          {
            q: "Hvordan fungerer daglige sjekklister?",
            a: "Under IK MAT > Sjekklister finner du daglige, ukentlige og månedlige rutiner. Ansatte huker av på mobilen, signerer, og kan legge til kommentarer.",
          },
          {
            q: "Kan jeg lage egne sjekklister?",
            a: "Ja. Opprett, rediger og dupliser i Oppsett > Sjekklister. Du bestemmer hyppighet og hvem som er ansvarlig.",
          },
        ],
      },
      {
        title: "HACCP og sporbarhet",
        items: [
          {
            q: "Må jeg ha en HACCP-plan?",
            a: "Ja, alle som håndterer mat er pålagt å ha et system basert på HACCP-prinsippene. AI-oppsettet lager forslag basert på din virksomhetstype.",
          },
          {
            q: "Hvordan registrerer jeg sporbarhet på råvarer?",
            a: "Bruk IK MAT > Sporbarhet. Skann strekkode eller registrer batchnummer, leverandør og mottaksdato. Du kan også skrive ut etiketter.",
          },
        ],
      },
      {
        title: "Kjøkkenplan og utstyr",
        items: [
          {
            q: "Hva er kjøkkenplan-verktøyet?",
            a: "Et visuelt verktøy der du tegner kjøkkenet og plasserer soner (varm/kald, ren/uren). Brukes for å dokumentere flytmotstrøm og hygienesoner overfor Mattilsynet.",
          },
          {
            q: "Hvordan legger jeg inn kjøleskap og frysere?",
            a: "Under Oppsett > Utstyr. Hvert apparat får egen ID og inngår automatisk i temperaturloggen.",
          },
        ],
      },
      {
        title: "Tilsyn",
        items: [
          {
            q: "Hva viser jeg Mattilsynet?",
            a: "Klikk Generer rapport i Dokumentasjonssenteret. Du får en samlet PDF med mål, HACCP, rutiner, sjekklister, temperaturlogg og avvik – klar å sende eller skrive ut.",
          },
        ],
      },
    ],
  },
  {
    key: "ks",
    title: "KS BYGG",
    subtitle: "Kvalitetssikring for bygg og anlegg",
    sections: [
      {
        title: "Kom i gang",
        items: [
          {
            q: "Hva er KS BYGG-modulen?",
            a: "Et komplett kvalitetssikringssystem for bygg- og anleggsbransjen. Den dekker prosjektstyring, sjekklister, SJA, vernerunder, byggesak, SHA-plan, underleverandører, daglige rapporter, økonomi og endringsmeldinger.",
          },
          {
            q: "Hva er forskjellen på prosjekttypene?",
            a: "Standard er fullskala prosjekt med alle moduler. Lite prosjekt er forenklet for mindre jobber. Mini er en lettvektsversjon for små oppdrag. Sidemenyen tilpasses automatisk.",
          },
          {
            q: "Hvordan oppretter jeg et nytt prosjekt?",
            a: "Gå til KS BYGG > Prosjekter > Nytt prosjekt. Velg type, fyll inn kunde, adresse og roller. Standardrutiner og maler kobles automatisk til.",
          },
        ],
      },
      {
        title: "Sjekklister og SJA",
        items: [
          {
            q: "Hvordan fyller jeg ut en sjekkliste på byggeplass?",
            a: "Åpne prosjektet i mobilen, gå til Sjekklister, velg malen og fyll ut. Du kan ta bilder, legge til kommentarer og signere digitalt. Alt lagres direkte i prosjektet.",
          },
          {
            q: "Hva er SJA og når skal jeg bruke det?",
            a: "Sikker Jobb Analyse – en kort risikovurdering for spesifikke arbeidsoperasjoner med høy risiko (f.eks. arbeid i høyden, varme arbeider, gravearbeid). Gjøres like før oppstart, alle involverte signerer.",
          },
          {
            q: "Kan flere signere samme sjekkliste eller SJA?",
            a: "Ja. Bruk send mobilen rundt-flyten: hver person signerer på samme enhet. Signaturene lagres med navn og tidspunkt.",
          },
        ],
      },
      {
        title: "Byggesak og SAK10",
        items: [
          {
            q: "Hva ligger i byggesak-modulen?",
            a: "Skjemaer for byggesaksbehandling etter SAK10: blankett 5174 (søknad), 5181 (ansvarsrett), 5167 (gjennomføringsplan) m.fl. Du fyller ut i appen og sender PDF direkte til kommunen.",
          },
          {
            q: "Hva er Prosjekt-hjelperen (Bygg Proffen)?",
            a: "En AI-assistent som kjenner prosjektet ditt og hjelper med valg av rutiner, sjekklister, SAK10-krav og dokumentasjon. Åpne den fra prosjektsiden.",
          },
        ],
      },
      {
        title: "SHA-plan og HMS",
        items: [
          {
            q: "Hvem fyller ut SHA-planen?",
            a: "Byggherrens koordinator (KP/KU). Du kan koble KP og KU til konkrete brukere i prosjektet og samle digitale signaturer. Eksterne SHA-PDF-er kan også lastes opp.",
          },
          {
            q: "Hvordan håndteres avvik på byggeplass?",
            a: "Under Prosjekt > HMS Avvik. Avvik får løpenummer, ansvarlig varsles, og lukkes med tiltak. Inngår i sluttrapporten.",
          },
        ],
      },
      {
        title: "Underleverandører",
        items: [
          {
            q: "Hvordan registrerer jeg underleverandører?",
            a: "Gå til Prosjekt > Underleverandører. Last opp egenerklæring og KS-håndbok. Hvis UE ikke har egen dokumentasjon, kan modulene skjules for å forenkle prosjektet.",
          },
        ],
      },
      {
        title: "Daglige rapporter og økonomi",
        items: [
          {
            q: "Hva registreres i daglig rapport?",
            a: "Vær, bemanning, utført arbeid, hendelser og bilder. Rapporten får nummer DR-YYYY-XXXX og samles til prosjektrapport.",
          },
          {
            q: "Kan jeg laste opp fakturaer og kvitteringer?",
            a: "Ja, under Prosjekt > Økonomi. Filene lagres sikkert og kan lastes ned via signerte lenker. Endringsmeldinger (EM-XXXX) sporer merkostnader.",
          },
        ],
      },
      {
        title: "Sluttdokumentasjon",
        items: [
          {
            q: "Hvordan genererer jeg sluttrapport for prosjektet?",
            a: "Gå til Prosjekt > Dokumentasjon > Generer rapport. Velg hvilke elementer som skal inkluderes (include in rapport), og last ned samlet PDF med sjekklister, bilder, avvik, vernerunder og signaturer.",
          },
          {
            q: "Hvor lenge lagres prosjektdokumentene?",
            a: "Dokumentene lagres så lenge bedriften har aktivt abonnement. Vi anbefaler å laste ned sluttrapporten og arkivere lokalt etter prosjektslutt.",
          },
        ],
      },
    ],
  },
];

/**
 * Returnerer FAQ for ett modul som kompakt klartekst – brukes for å injisere
 * kunnskap i systemprompten til AI-assistentene (HMS Proffen, MAT Proffen,
 * Bygg Proffen). Holdes kort for å spare token.
 */
export function getFaqAsPlainText(moduleKey: "hms" | "mat" | "ks"): string {
  const mod = FAQ_MODULES.find((m) => m.key === moduleKey);
  if (!mod) return "";
  const lines: string[] = [`# FAQ – ${mod.title} (${mod.subtitle})`];
  for (const sec of mod.sections) {
    lines.push("", `## ${sec.title}`);
    for (const it of sec.items) {
      lines.push(`Sp: ${it.q}`, `Sv: ${it.a}`);
    }
  }
  return lines.join("\n");
}
