// Nøyaktig kart over menyen i Total-IK. Brukes av HMS Proffen, Bygg Proffen og
// Oppsett-hjelperen slik at chatene alltid oppgir veier som faktisk finnes.
// Vedlikehold: hold denne i takt med src/components/layout/AppSidebar.tsx,
// src/components/ks2/Ks2ProjectSidebar.tsx og rutene i src/App.tsx.

export const NAV_MAP = `**SLIK ER MENYEN BYGGET (menyen til venstre, gruppeoverskrifter med fet skrift)**

Øverst: «Dashboard» (/), «Brukerveiledning» (/brukerveiledning), «Innstillinger» (/settings).

**IK/HMS**
- «Oppsett» (/setup)
- «Målsetting» (/maalsetting)
- «Organisering» (/organisering)
- «Risikoanalyse» (/risikoanalyse) – undersider: «Risikovurdering & Handlingsplan» (/risikoanalyse), «Oppfølging» (/risikoanalyse?tab=oppfolging), «SJA» (/risikoanalyse?tab=sja)
- «Rutiner» (/rutiner)
- «Stoffkartotek» (/stoffkartotek)
- «Lover og forskrifter» (/lover-og-forskrifter)
- «Avvik» (/deviations)
- «HMS aktiviteter» (/audits) – vernerunder, internrevisjoner, årshjul
- «Håndbok» (/handbook)
- «Dokumentsenter» (/dokumentsenter)
- «HMS Assistent» (/hms-chat)

**Personaladministrasjon** – gruppen «Mine ansatte» (kun leder/admin):
- «Ansattoversikt» (/employees)
- «Ansettelsesavtaler» (/hr/contracts)
- «Fravær» (/hr/absence)
- «Utstyr og klær» (/hr/utstyr)
- «Medarbeidersamtaler» (/hr/meetings)
- «Undersøkelser» (/hr/surveys)
- «Godkjenn ferie» (/time-off?view=admin)
- «Arbeidsplan» (/work-schedule)
- «Søndagsrapport (AML §10-8)» (/hr/sondagsrapport)
- «Godkjenn timer» (/time-registration?view=admin)
- «Timeføring» (/time-registration)
- «Timeoversikt» (/timer/oversikt)
- «Personalliste (Skatteetaten)» (/personalliste)
- «Anonyme meldinger» (/anonymous-messages)

**Personaladministrasjon** – gruppen «Mitt arbeidsforhold» (alle ansatte):
- «Min arbeidsavtale» (/my/contract)
- «Mine timer» (/time-registration)
- «Min ferie» (/time-off)
- «Mitt fravær» (/my/absence)
- «Min respons» (/my/surveys)
- «Meldinger» (/my/messages)
- «Send anonym melding» (knapp i menyen)
- «Kjørebok» (/my/driving-log) – også utlegg/reiseregning og GPS/geofence
- «Mitt ansattkort» (/my/employee-card)

**KS Bygg** – gruppen «IK/KS Grunnlag»:
- «Målsetting & Kvalitetsmål» (/ks/ik-ks/maalsetting)
- «Organisasjonsplan» (/ks/ik-ks/organisering)
- «Rutiner» (/ks/ik-ks/rutiner)
- «Dokumentsenter» (/ks/ik-ks/dokumenter)
- «Sjekklistemaler» (/ks/ik-ks/sjekklister)
- «Egenerklæring» (/ks/ik-ks/egenerklaering)
- «KS Håndbok» (/ks/ik-ks/handbok)

**KS Bygg** – hovedmenyen:
- «Mine prosjekter» (/ks)
- «Kunder» (/ks/kunder)
- «Oppsett-hjelper» (/ks/oppsett)
- «Utfylte sjekklister» (/ks/utfylte-sjekklister)
- «Befaring» (/ks/befaring)
- «Kalkyler» (/ks/kalkyler)
- «Dagsrapporter (admin)» (/ks/dagsrapport-oversikt)
- «Statistikk» (/ks/statistikk)
- «Prosjekt-hub» (/prosjekt-hub)
- «Småprosjekter» (/ks/smaaprosjekter)

**IK/MAT**
- «Oppsett» (/ik-mat/oppsett), «Håndbok» (/ik-mat/handbok), «Målsetting» (/ik-mat/maal), «Organisasjonskart» (/ik-mat/organisasjon), «Risiko & tiltak» (/ik-mat/risiko-og-tiltak), «Rutiner» (/ik-mat/rutiner), «Kontroll» (/ik-mat/kontroll), «Sensorer» (/ik-mat/sensorer), «Avvik» (/ik-mat/avvik), «Allergener» (/ik-mat/allergener), «Kjøkkenplan» (/ik-mat/kjokkenplan), «Faste avtaler» (/ik-mat/faste-avtaler), «Dokumentsenter» (/ik-mat/dokumentsenter)
- Temperaturlogg (/ik-mat/temperaturlogg), Sporbarhet (/ik-mat/sporbarhet), Renholdsplan (/ik-mat/renholdsplan), Sjekklister (/ik-mat/sjekklister)

**IK/Alkohol**
- «Oversikt» (/ik-alkohol), «Rutiner» (/ik-alkohol/rutiner), «Organisering» (/ik-alkohol/organisering), «Målsetting» (/ik-alkohol/maal), «Risikoanalyse» (/ik-alkohol/risikoanalyse), «Internkontroll» (/ik-alkohol/internkontroll), «Kontroll» (/ik-alkohol/kontroll), «Hendelser» (/ik-alkohol/hendelser), «Lovverk» (/ik-alkohol/lovverk), «Dokumentsenter» (/ik-alkohol/dokumentsenter), «Håndbok» (/ik-alkohol/handbok)

**IK/FDV**
- «Oversikt» (/fdv), «Bygg & Eiendommer» (/fdv/bygg), «Kontroller» (/fdv/kontroller), «Risikovurdering» (/fdv/risiko), «Regelverk» (/fdv/regelverk), «Etasjeplaner» (/fdv/etasjeplaner)

**Personalhåndbok** (/personalhandbok)

**Viktige regler for hvor ting finnes**
- Alt som hører til ett byggeprosjekt ligger INNE I prosjektet: åpne «KS Bygg» → «Mine prosjekter» → prosjektet. Der fins sjekklister, avvik, SJA, dagsrapport, bilder, SHA-plan, byggesak og økonomi.
- Oppslagstavlen ligger på «Dashboard» (/), ikke i en egen menypunkt.
- Kurs og kursbevis: «Mitt kursbevis» / mine kurs (=/my-courses).
- Moduler bedriften ikke har kjøpt ligger nederst i menyen under «Flere moduler». Ser brukeren ikke en modul, har bedriften den trolig ikke, eller brukeren mangler rettighet (vanlige ansatte ser ikke gruppen «Mine ansatte»).
- Bruk ALDRI navn som ikke finnes i menyen: ikke «KS-modul», ikke «HR / Ansatte», ikke «IK-Mat», ikke «/ks2/...». Si «KS Bygg», «Personaladministrasjon» og «IK/MAT».
- Oppgi alltid veien nøyaktig som over, med gruppene og navnene i anførselstegn, og si om det er leder/admin eller vanlig ansatt som ser den.`;

// Fanene inne i et byggeprosjekt: /ks/project/<id> + sti
export const KS_PROJECT_NAV_MAP = `**FANENE INNE I ET BYGGEPROSJEKT** (åpnes via «KS Bygg» → «Mine prosjekter» → prosjektet)

- «Dashboard» (forsiden i prosjektet)
- «Prosjekt-assistent» (/chat) – chat-hjelperen for dette prosjektet
- Kvalitetssikring: «Sjekklister & egenkontroller» (/sjekklister), «KS-avvik» (/avvik)
- HMS / SHA: «HMS-dashboard» (/hms), «HMS-plan» (/hms/hms-plan), «SHA-plan» (/hms/sha-plan), «SJA» (/hms/sja), «Vernerunder & RUH» (/hms/vernerunder), «HMS-avvik» (/hms/avvik), «Stoffkartotek» (/hms/stoffkartotek), «Riggplan» (/hms/riggplan)
- Byggesak & Blanketter: «Byggesak-oversikt» (/byggesak), «Blanketter» (/byggesak/blanketter), «E-post utsending» (/byggesak/epost)
- Prosjektstyring: «Prosjektinfo» (/prosjektinfo), «Fremdriftsplan» (/fremdriftsplan), «Dagsrapporter» (/dagsrapport), «Timeregistrering» (/timeregistrering), «Mannskapsliste» (/mannskap), «Møtereferater» (/motereferater)
- Økonomi: «Økonomi» (/okonomi), «Endringsmeldinger» (/endringsmeldinger), «Reklamasjoner» (/reklamasjoner)
- Partnere: «Underleverandører» (/underleverandorer)
- Dokumenter og arkiv: «Dokumentasjon & FDV» (/dokumentasjon), «Rutinebank» (/rutiner), «Malbibliotek» (/maler), «Prosjektrapport» (/rapport), «Bilder» (/bilder), «Notater» (/notater), «Befaringer» (/befaringer)

Alt prosjektarbeid gjøres inne i prosjektet. Brukeren trenger sjelden å gå ut til bedriftens hovedmeny.`;

// Strukturert menykart for automatiske treff. Hver oppføring matcher på nøgleord
// og gir den faktiske veien i menyen. Brukes av hms-chat, mascot-chat og
// ks-project-chat slik at "hvor finner jeg X" alltid svares med en reell vei.
export type NavEntry = {
  keywords: string[];
  path: string;
  name: string;
  menuLocation: string;
  description: string;
};

const H = "Menyen til venstre → «IK/HMS»";
const P = "Menyen til venstre → «Personaladministrasjon»";
const M = "Menyen til venstre → «Mitt arbeidsforhold»";
const KS = "Menyen til venstre → «KS Bygg»";
const PRJ = "Menyen → «KS Bygg» → «Mine prosjekter» → åpne prosjektet →";
const MAT = "Menyen til venstre → «IK/MAT»";
const ALK = "Menyen til venstre → «IK/Alkohol»";
const FDV = "Menyen til venstre → «IK/FDV»";

export const NAVIGATION_ENTRIES: NavEntry[] = [
  { keywords: ["dashbord", "hjem", "oversikt", "forside", "start"], path: "/", name: "Dashbord", menuLocation: "Øverst i menyen til venstre", description: "Hovedoversikt med status, årshjul, varsler og snarveier" },
  { keywords: ["brukerveiledning", "hjelp", "veiledning", "manual"], path: "/brukerveiledning", name: "Brukerveiledning", menuLocation: "Øverst i menyen til venstre", description: "Veiledning til hele systemet" },
  { keywords: ["oppsett", "kom i gang", "ai-oppsett", "setup", "veiviser"], path: "/setup", name: "Oppsett (AI-veiviser)", menuLocation: `${H} → «Oppsett»`, description: "Lager mål, organisering, risiko og rutiner automatisk" },
  { keywords: ["mål", "målsetting", "hms-mål"], path: "/maalsetting", name: "Målsetting", menuLocation: `${H} → «Målsetting»`, description: "HMS-mål for bedriften" },
  { keywords: ["organisering", "organisasjon", "organisasjonskart", "roller", "ansvar", "verneombud", "amu"], path: "/organisering", name: "Organisering", menuLocation: `${H} → «Organisering»`, description: "Organisasjonskart, roller, verneombud og ansvar" },
  { keywords: ["risiko", "risikovurdering", "risikoanalyse", "farekilde", "handlingsplan", "tiltak"], path: "/risikoanalyse", name: "Risikoanalyse", menuLocation: `${H} → «Risikoanalyse» → «Risikovurdering & Handlingsplan»`, description: "Risikovurderinger og tiltak med ansvarlig og frist" },
  { keywords: ["oppfølging", "frister tiltak"], path: "/risikoanalyse?tab=oppfolging", name: "Oppfølging av tiltak", menuLocation: `${H} → «Risikoanalyse» → «Oppfølging»`, description: "Følg opp tiltak fra risikovurderingen" },
  { keywords: ["sja", "sikker jobb", "jobbanalyse"], path: "/risikoanalyse?tab=sja", name: "SJA", menuLocation: `${H} → «Risikoanalyse» → «SJA» (på byggeprosjekt: inne i prosjektet → «SJA»)`, description: "Sikker jobbanalyse med signaturer" },
  { keywords: ["rutine", "rutiner", "prosedyre"], path: "/rutiner", name: "Rutiner", menuLocation: `${H} → «Rutiner»`, description: "HMS-rutiner og prosedyrer" },
  { keywords: ["stoff", "stoffkartotek", "kjemikalie", "sikkerhetsdatablad", "sds", "datablad"], path: "/stoffkartotek", name: "Stoffkartotek", menuLocation: `${H} → «Stoffkartotek»`, description: "Kjemikalier, sikkerhetsdatablad og risikovurdering" },
  { keywords: ["lov", "lover", "forskrift", "regelverk"], path: "/lover-og-forskrifter", name: "Lover og forskrifter", menuLocation: `${H} → «Lover og forskrifter»`, description: "Regelverk som gjelder bedriften" },
  { keywords: ["avvik", "ruh", "uønsket hendelse", "hendelse", "skade", "nestenulykke"], path: "/deviations", name: "Avvik", menuLocation: `${H} → «Avvik» (avvik på byggeprosjekt: inne i prosjektet → «Avvik»; IK/MAT har egne under «IK/MAT» → «Avvik»)`, description: "Trykk «Nytt avvik», fyll inn og lagre. Jeg kan også opprette avviket for deg her i chatten." },
  { keywords: ["hms aktivitet", "hms-aktivitet", "vernerunde", "revisjon", "internrevisjon", "årshjul", "aktivitet"], path: "/audits", name: "HMS aktiviteter", menuLocation: `${H} → «HMS aktiviteter»`, description: "Vernerunder, internrevisjoner og årshjul (bla mellom år med ‹ ›)" },
  { keywords: ["håndbok", "hms-håndbok", "handbok"], path: "/handbook", name: "Håndbok (HMS)", menuLocation: `${H} → «Håndbok»`, description: "Samlet HMS-håndbok, kan lastes ned som PDF" },
  { keywords: ["dokument", "dokumenter", "dokumentsenter", "filer", "opplasting", "mappe"], path: "/dokumentsenter", name: "Dokumentsenter", menuLocation: `${H} → «Dokumentsenter» (KS Bygg, IK/MAT og IK/Alkohol har eget dokumentsenter i sin meny)`, description: "Last opp og finn bedriftens dokumenter" },
  { keywords: ["hms assistent", "hms-chat", "assistent"], path: "/hms-chat", name: "HMS Assistent", menuLocation: `${H} → «HMS Assistent»`, description: "Chat for HMS-spørsmål" },
  { keywords: ["ansatt", "ansatte", "ansattoversikt", "medarbeider", "kurs", "hms-kort", "invitere", "legg til ansatt"], path: "/employees", name: "Ansattoversikt", menuLocation: `${P} → «Ansattoversikt»`, description: "Ansatte, kurs, HMS-kort, invitasjoner og dokumenter" },
  { keywords: ["kontrakt", "arbeidsavtale", "ansettelsesavtale"], path: "/hr/contracts", name: "Ansettelsesavtaler", menuLocation: `${P} → «Ansettelsesavtaler» (ansatt: ${M} → «Min arbeidsavtale»)`, description: "Lag og signer arbeidsavtaler" },
  { keywords: ["fravær", "sykefravær", "sykemelding", "egenmelding"], path: "/hr/absence", name: "Fravær", menuLocation: `${P} → «Fravær» (ansatt: ${M} → «Mitt fravær»)`, description: "Registrering og oversikt over fravær" },
  { keywords: ["utstyr", "klær", "arbeidsklær", "verneutstyr", "verktøy"], path: "/hr/utstyr", name: "Utstyr og klær", menuLocation: `${P} → «Utstyr og klær»`, description: "Utstyr, klær og verktøy per ansatt, med nedlasting PDF/Excel" },
  { keywords: ["medarbeidersamtale", "samtale", "møte", "møter"], path: "/hr/meetings", name: "Medarbeidersamtaler", menuLocation: `${P} → «Medarbeidersamtaler»`, description: "Samtaler med maler og referat" },
  { keywords: ["undersøkelse", "spørreundersøkelse", "trivsel"], path: "/hr/surveys", name: "Undersøkelser", menuLocation: `${P} → «Undersøkelser» (ansatt: ${M} → «Min respons»)`, description: "Medarbeiderundersøkelser" },
  { keywords: ["ferie", "fri", "permisjon", "feriesøknad"], path: "/time-off", name: "Ferie", menuLocation: `Leder: ${P} → «Godkjenn ferie». Ansatt: ${M} → «Min ferie»`, description: "Søk og godkjenn ferie" },
  { keywords: ["arbeidsplan", "vaktplan", "vakt", "turnus", "skift", "vaktbytte"], path: "/work-schedule", name: "Arbeidsplan", menuLocation: `${P} → «Arbeidsplan»`, description: "Vaktplaner, skifteønsker og vaktbytte" },
  { keywords: ["søndag", "søndagsrapport", "søndagsarbeid"], path: "/hr/sondagsrapport", name: "Søndagsrapport", menuLocation: `${P} → «Søndagsrapport (AML §10-8)»`, description: "Kontroll av søndagsarbeid" },
  { keywords: ["time", "timer", "timeregistrering", "timeføring", "timeliste", "godkjenn timer", "overtid"], path: "/time-registration", name: "Timeføring", menuLocation: `Leder: ${P} → «Godkjenn timer» / «Timeføring» / «Timeoversikt». Ansatt: ${M} → «Mine timer»`, description: "Før timer på prosjekt, godkjenn og last ned rapport" },
  { keywords: ["stempl", "stemplingsur", "qr", "inn/ut", "innsjekk"], path: "/time-registration", name: "Stempling (QR)", menuLocation: `${M} → «Mine timer»`, description: "Stemple inn/ut med QR eller GPS/geogjerde" },
  { keywords: ["personalliste", "skatteetaten"], path: "/personalliste", name: "Personalliste", menuLocation: `${P} → «Personalliste (Skatteetaten)»`, description: "Lovpålagt personalliste" },
  { keywords: ["anonym", "varsling", "si fra", "melde fra", "varsle"], path: "/anonymous-messages", name: "Anonyme meldinger", menuLocation: `Les: ${P} → «Anonyme meldinger». Send: ${M} → «Send anonym melding»`, description: "Varsling uten avsender" },
  { keywords: ["kjørebok", "kjøring", "km", "gps", "bil", "reiseregning", "utlegg", "kvittering"], path: "/my/driving-log", name: "Kjørebok", menuLocation: `${M} → «Kjørebok»`, description: "Kjørebok med GPS, utlegg og reiseregning" },
  { keywords: ["ansattkort", "kursbevis", "mitt kort", "id-kort"], path: "/my/employee-card", name: "Mitt ansattkort", menuLocation: `${M} → «Mitt ansattkort»`, description: "Ditt ansattkort med kurs" },
  { keywords: ["melding", "meldinger", "oppslagstavle", "kunngjøring", "beskjed"], path: "/my/messages", name: "Meldinger", menuLocation: `${M} → «Meldinger» (oppslagstavla ligger på dashbordet)`, description: "Interne meldinger og oppslag" },
  { keywords: ["personalhåndbok"], path: "/personalhandbok", name: "Personalhåndbok", menuLocation: "Menyen til venstre → «Personalhåndbok»", description: "Bedriftens personalhåndbok" },
  { keywords: ["ks", "ks bygg", "byggeprosjekt", "prosjekt", "prosjekter"], path: "/ks", name: "Mine prosjekter", menuLocation: `${KS} → «Mine prosjekter»`, description: "Alle byggeprosjekter. Åpne et prosjekt for sjekklister, dagsrapport, avvik, SJA, bilder m.m." },
  { keywords: ["kunde", "kunder"], path: "/ks/kunder", name: "Kunder", menuLocation: `${KS} → «Kunder»`, description: "Kunderegister" },
  { keywords: ["befaring"], path: "/ks/befaring", name: "Befaring", menuLocation: `${KS} → «Befaring»`, description: "Befaringer" },
  { keywords: ["kalkyle", "kalkyler", "tilbud", "pris"], path: "/ks/kalkyler", name: "Kalkyler", menuLocation: `${KS} → «Kalkyler»`, description: "Kalkyler og tilbud" },
  { keywords: ["utfylte sjekklister"], path: "/ks/utfylte-sjekklister", name: "Utfylte sjekklister", menuLocation: `${KS} → «Utfylte sjekklister»`, description: "Alle ferdige sjekklister samlet, med søk og nedlasting" },
  { keywords: ["sjekkliste", "sjekklister", "egenkontroll", "sjekklistemal", "mal"], path: "/ks/ik-ks/sjekklister", name: "Sjekklistemaler", menuLocation: `Maler: ${KS} → «Sjekklistemaler». Fylle ut: ${PRJ} «Sjekklister»`, description: "Over 100 maler (våtrom, betong, tømrer, ansvar m.m.)" },
  { keywords: ["ks-håndbok", "kvalitetshåndbok"], path: "/ks/ik-ks/handbok", name: "KS-håndbok", menuLocation: `${KS} → «KS-håndbok»`, description: "Kvalitetshåndbok for byggesak" },
  { keywords: ["egenerklæring"], path: "/ks/ik-ks/egenerklaering", name: "Egenerklæring", menuLocation: `${KS} → «Egenerklæring»`, description: "Egenerklæring for ansvarsrett" },
  { keywords: ["oppsett-hjelper", "ks oppsett", "prosjekthjelper"], path: "/ks/oppsett", name: "Oppsett-hjelper", menuLocation: `${KS} → «Oppsett-hjelper»`, description: "AI-hjelp til å sette opp KS" },
  { keywords: ["dagsrapport", "dagbok", "dagrapport"], path: "/ks", name: "Dagsrapport", menuLocation: `${PRJ} «Dagsrapport»`, description: "Vær, bemanning, utført arbeid, plan for i morgen og bilder" },
  { keywords: ["bilde", "bilder", "foto", "dokumentere jobb"], path: "/ks", name: "Prosjektbilder", menuLocation: `${PRJ} «Bilder» (bilder kan også tas i dagsrapport, sjekklister og avvik)`, description: "Bilder knyttet til prosjektet" },
  { keywords: ["underleverandør", "ue", "underentreprenør"], path: "/ks", name: "Underleverandører", menuLocation: `${PRJ} «Underleverandører»`, description: "UE-register, dokumentasjon og evaluering" },
  { keywords: ["sha", "sha-plan", "riggplan", "hms-plan"], path: "/ks", name: "SHA-plan / Riggplan", menuLocation: `${PRJ} «SHA-plan» / «Riggplan»`, description: "SHA-plan med KU/KP-signatur og riggplan" },
  { keywords: ["økonomi", "budsjett", "faktura", "endringsmelding", "kostnad"], path: "/ks", name: "Økonomi og endringsmeldinger", menuLocation: `${PRJ} «Økonomi» / «Endringsmeldinger»`, description: "Kostnader, fakturaer og endringsmeldinger" },
  { keywords: ["byggesak", "byggesøknad", "blankett", "ansvarsrett", "gjennomføringsplan", "sak10"], path: "/ks", name: "Byggesak", menuLocation: `${PRJ} «Byggesak»`, description: "Blanketter (5174, 5181, 5167 m.fl.) sendt som PDF" },
  { keywords: ["geofence", "geogjerde"], path: "/ks", name: "Geogjerde", menuLocation: `${PRJ} prosjektinnstillinger/kart`, description: "Automatisk start/stopp av arbeidstid ved prosjektet" },
  { keywords: ["sluttrapport", "prosjektrapport", "møtereferat", "reklamasjon"], path: "/ks", name: "Rapporter i prosjekt", menuLocation: `${PRJ} «Rapport» / «Møter» / «Reklamasjoner»`, description: "Sluttrapport, møter og reklamasjoner" },
  { keywords: ["mat", "ik-mat", "ik/mat", "kjøkken", "restaurant", "næringsmiddel", "haccp"], path: "/ik-mat/handbok", name: "IK/MAT", menuLocation: MAT, description: "Oppsett, håndbok, mål, organisasjonskart, risiko & tiltak, rutiner, kontroll, sensorer, avvik, allergener, kjøkkenplan, faste avtaler, dokumentsenter" },
  { keywords: ["temperatur", "kontroll mat", "renhold", "renholdsplan", "varemottak", "sporbarhet", "runde"], path: "/ik-mat/kontroll", name: "Kontroll (IK/MAT)", menuLocation: `${MAT} → «Kontroll»`, description: "Temperatur, renhold, varemottak, sporbarhet og daglige runder" },
  { keywords: ["sensor", "sensorer", "temperaturmåler"], path: "/ik-mat/sensorer", name: "Sensorer", menuLocation: `${MAT} → «Sensorer»`, description: "Automatisk temperaturlogging" },
  { keywords: ["allergen", "allergener", "allergi"], path: "/ik-mat/allergener", name: "Allergener", menuLocation: `${MAT} → «Allergener»`, description: "Allergenoversikt" },
  { keywords: ["kjøkkenplan", "soner"], path: "/ik-mat/kjokkenplan", name: "Kjøkkenplan", menuLocation: `${MAT} → «Kjøkkenplan»`, description: "Tegning av kjøkkensoner" },
  { keywords: ["alkohol", "skjenking", "bevilling", "ik-alkohol"], path: "/ik-alkohol", name: "IK/Alkohol", menuLocation: ALK, description: "Rutiner, organisering, mål, risikoanalyse, internkontroll, kontroll, hendelser, lovverk, dokumentsenter, håndbok" },
  { keywords: ["fdv", "bygg og eiendom", "etasjeplan", "eiendom"], path: "/fdv", name: "IK/FDV", menuLocation: FDV, description: "Bygg og eiendommer, kontroller, risikovurdering, regelverk, etasjeplaner" },
  { keywords: ["gdpr", "personvern"], path: "/gdpr/oversikt", name: "GDPR", menuLocation: "Menyen til venstre → «GDPR»", description: "Oversikt, dokumentasjon og sjekkliste" },
  { keywords: ["åpenhetsloven", "aktsomhet", "redegjørelse"], path: "/apenhetsloven/oversikt", name: "Åpenhetsloven", menuLocation: "Menyen til venstre → «Åpenhetsloven»", description: "Aktsomhetsvurdering, innsyn og årlig redegjørelse" },
  { keywords: ["innstilling", "innstillinger", "bedriftsinfo", "logo"], path: "/settings", name: "Innstillinger", menuLocation: "Øverst i menyen til venstre → «Innstillinger»", description: "Bedriftsinfo, brukere, avdelinger, varsler" },
  { keywords: ["bruker", "brukere", "tilgang", "rettigheter", "rolle"], path: "/settings?tab=users", name: "Brukere", menuLocation: "«Innstillinger» → fanen «Brukere»", description: "Brukere og roller" },
  { keywords: ["avdeling", "avdelinger", "filial"], path: "/settings?tab=departments", name: "Avdelinger", menuLocation: "«Innstillinger» → fanen «Avdelinger»", description: "Avdelinger og avdelingsledere" },
  { keywords: ["varsel", "varsler", "påminnelse", "notifikasjon", "push"], path: "/settings?tab=notifications", name: "Varsler", menuLocation: "«Innstillinger» → fanen «Varsler»", description: "E-post- og push-varsler" },
  { keywords: ["kjøpe modul", "flere moduler", "låst", "mangler modul"], path: "/", name: "Flere moduler", menuLocation: "Nederst i menyen → «Flere moduler»", description: "Moduler bedriften ikke har ennå – kan bestilles av admin" },
  { keywords: ["installer", "app", "pwa", "mobil"], path: "/install-app", name: "Installer app", menuLocation: "Åpne totalik.no/install-app på telefonen", description: "Installer appen på telefonen" }
];

const NAV_INTENT = /\b(hvor|i hvilken meny|hvilken meny|hvor finner|hvor i menyen|hvor legger|hvor registrer|hvor ser|hvor laster|hvor godkjenner|hvor fører|hvor søker|hvor kan|hva heter modul|hvordan finner jeg|hvordan kommer jeg|kan jeg (se|finne|legge|registrere|laste|godkjenne|føre|søke)|how do i find|where is)\b/i;
const NAV_SKIP = /\bhvor (lenge|mye|mange|ofte|når|godt|vidt|langt|tidlig|sentralt|hyppig)\b|\bhvorfor\b/i;

export function isNavigationQuestion(text: string): boolean {
  return typeof text === "string" && NAV_INTENT.test(text) && !NAV_SKIP.test(text);
}

function keywordHits(sentence: string, keyword: string): boolean {
  if (keyword.length <= 4) {
    return new RegExp(`(^|[^a-zæøå])${keyword}([^a-zæøå]|$)`).test(sentence);
  }
  return sentence.includes(keyword);
}

export function lookupNavigation(searchTerm: string): string | null {
  const s = (searchTerm || "").toLowerCase();
  const matches = NAVIGATION_ENTRIES.filter((page) =>
    page.keywords.some((keyword) => keywordHits(s, keyword))
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    const m = matches[0];
    return `📍 **${m.name}**\n\n👉 ${m.menuLocation}\n\n${m.description}`;
  }
  const list = matches.slice(0, 4).map((m) => `• **${m.name}** — ${m.menuLocation}\n  _${m.description}_`).join("\n\n");
  return `🔍 Jeg fant flere steder som kan passe:\n\n${list}`;
}
