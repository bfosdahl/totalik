import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Library, 
  ChevronDown, 
  ChevronRight,
  Search,
  Edit,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

export interface RoutinesStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

export interface RoutineItem {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

interface RoutinesStepProps {
  existingData?: { routines: RoutineItem[] };
  onSave: (data: { routines: RoutineItem[] }) => Promise<void>;
  isSaving: boolean;
}

// Predefined routines library based on Norwegian HMS standards
const PREDEFINED_ROUTINES: Omit<RoutineItem, 'id'>[] = [
  {
    routine_number: "1160",
    routine_name: "Arbeidsulykker og Skader",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre rask og korrekt håndtering av arbeidsulykker og skader for å minimere skadeomfang og ivareta helse og sikkerhet for alle ansatte.",
    responsibility: "Daglig leder har overordnet ansvar for at alle skader rapporteres og håndteres i tråd med rutinen.\n\nVerneombud og eventuelt leder på arbeidsstedet har ansvar for oppfølging på stedet.",
    procedure: `Rapportering av arbeidsulykker og skader
• Alle ansatte skal umiddelbart rapportere arbeidsulykker og skader til nærmeste leder.
• Avviksskjema fylles ut for å registrere ulykken eller skaden i HMS-systemet.

Førstehjelp og øyeblikkelige tiltak
• Gi nødvendig førstehjelp på stedet.
• Ved alvorlige skader, kontakt legevakt eller nødnummer 113 umiddelbart.

Undersøkelse og dokumentasjon
• Leder eller verneombud dokumenterer hendelsen (årsak, tidspunkt, skadens omfang, eventuelle vitner).
• Utfør undersøkelse for å fastslå årsak og identifisere tiltak som kan forhindre lignende hendelser.

Iverksetting av forebyggende tiltak
• Implementer forebyggende tiltak basert på resultatene fra undersøkelsen.
• Informer ansatte om tiltakene og oppdater relevante rutiner ved behov.

Oppfølging av skader og sykefravær
• Følg opp skadede ansatte og legg til rette for tilbakeføring til arbeid der det er mulig.
• Dokumenter sykefravær og eventuelle tilpasninger i HMS-systemet.`,
    examples: `• Kuttskader fra verktøy
• Fall- eller skliulykker
• Støt- og klemskader
• Eksponering for farlige kjemikalier
• Brannskader`,
    remember: "Alle arbeidsulykker og skader skal rapporteres og følges opp for å skape en trygg arbeidsplass og forhindre fremtidige hendelser.",
    is_predefined: true
  },
  {
    routine_number: "1121",
    routine_name: "Avvikshåndtering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at avvik i arbeidsprosesser identifiseres, rapporteres og behandles effektivt for å forbedre arbeidsmiljøet og redusere risiko for fremtidige hendelser.",
    responsibility: "Alle ansatte er ansvarlige for å rapportere avvik.\n\nLeder eller daglig leder har ansvar for oppfølging og iverksetting av tiltak.",
    procedure: `Identifisering av avvik
• Avvik er enhver uønsket hendelse, feil eller forhold som bryter med HMS-krav og prosedyrer.
• Ansatte skal rapportere avvik umiddelbart ved å fylle ut avviksskjema (digitalt eller papir).

Registrering av avvik
• Avviksskjema skal inneholde tidspunkt, sted, involverte personer og beskrivelse av avviket.
• Alle avvik registreres i HMS-systemet eller i HMS-perm (papirversjon).

Analyse og vurdering
• Leder eller daglig leder analyserer avviket for å identifisere årsaker og konsekvenser.
• Vurder om avviket krever umiddelbar handling eller inngår i rutinemessige forbedringstiltak.

Iverksetting av tiltak
• Foreslå og implementer tiltak for å korrigere og forhindre gjentakelse.
• Dokumenter tiltakene og informer relevante ansatte om endringer.

Oppfølging og læring
• Evaluer effekten av tiltakene gjennom oppfølging.
• Del erfaringer for å skape læring og forbedring i organisasjonen.`,
    examples: `• Manglende eller feil bruk av verneutstyr
• Feil lagring av kjemikalier eller farlige stoffer
• Brudd på sikkerhetsrutiner (f.eks. manglende merking av fareområder)
• Mangelfull opplæring i bruk av maskiner og utstyr
• Skader eller nestenulykker som kunne ført til skade
• Avvik fra fastsatte rutiner for renhold og hygiene`,
    remember: "Avvik skal alltid rapporteres for å sikre kontinuerlig forbedring og et trygt arbeidsmiljø.",
    is_predefined: true
  },
  {
    routine_number: "1150",
    routine_name: "Brannvern og Evakuering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte kjenner brannvernsrutiner og evakueringsprosedyrer for å kunne handle raskt og trygt ved brann eller andre nødsituasjoner.",
    responsibility: "Daglig leder har hovedansvar for brannvern og evakuering.\n\nBrannvernleder (hvis utpekt) har ansvar for brannøvelser og oppfølging av brannsikkerhetsutstyr.",
    procedure: `Opplæring i brannvern
• Alle ansatte skal ha grunnleggende opplæring i brannvern.
• Ansatte skal kjenne plassering av brannslokkingsutstyr, nødutganger og samlingsplass.
• Nyansatte får opplæring ved oppstart, og alle deltar i årlige brannøvelser.

Brannslokkingsutstyr og nødutganger
• Brannslukkere og annet utstyr skal være lett tilgjengelig og kontrolleres regelmessig.
• Nødutganger og rømningsveier skal holdes fri og være tydelig merket.

Evakueringsprosedyrer
• Ved brannalarm skal bygget evakueres umiddelbart til avtalt samlingsplass.
• Leder for hver avdeling skal sjekke at alle ansatte og besøkende er evakuert.

Brannøvelser
• Gjennomfør minst én brannøvelse årlig.
• Dokumenter øvelsen i HMS-systemet (dato, tid, funn og forbedringspunkter).

Oppfølging og vedlikehold av brannsikkerhet
• Utfør jevnlig kontroll og vedlikehold av brannslukkingsutstyr, røykvarslere og skilt.
• Registrer avvik i avviksskjema ved mangler på utstyr eller rutiner.`,
    examples: `• Brann i bygningen
• Røykutvikling
• Gasslekkasje
• Annen fare som krever evakuering`,
    remember: "Brannvern og evakueringsrutiner er kritiske for å beskytte liv og helse. Alle ansatte skal kjenne rutinene og vite hvordan de skal reagere.",
    is_predefined: true
  },
  {
    routine_number: "1180",
    routine_name: "Bruk av Verneutstyr",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte bruker nødvendig verneutstyr for å beskytte seg mot skader og farer i arbeidsmiljøet.",
    responsibility: "Daglig leder skal sikre at relevant verneutstyr er tilgjengelig og at ansatte får opplæring i bruk.\n\nVerneombud skal påse at verneutstyr brukes korrekt i det daglige.",
    procedure: `Identifisering av behov for verneutstyr
• Gjennomfør risikovurderinger for å identifisere krav til verneutstyr (hjelm, briller, hansker, hørselsvern m.m.).
• Oppdater behovet ved endringer i arbeidsoppgaver eller arbeidsmiljø.

Tilgjengelighet og kontroll
• Verneutstyr skal være lett tilgjengelig på relevante arbeidssteder.
• Utfør regelmessig kontroll og erstatt defekt utstyr umiddelbart.

Opplæring i bruk av verneutstyr
• Gi opplæring i korrekt bruk, vedlikehold og oppbevaring.
• Gjennomfør jevnlige oppfriskningskurs.

Påbud om bruk
• Ansatte skal benytte riktig verneutstyr ved risikofylte arbeidsoppgaver.
• Manglende bruk følges opp og korrigeres.

Rapportering av avvik
• Rapporter manglende bruk, defekt utstyr eller andre avvik via avviksskjema.
• Iverksett nødvendige tiltak.`,
    examples: `• Hodevern: hjelm
• Øyevern: vernebriller
• Hørselsvern: ørepropper eller hørselvern
• Håndvern: hansker
• Åndedrettsvern: masker`,
    remember: "Bruk av verneutstyr er obligatorisk. Alle skal bruke utstyret riktig og rapportere avvik.",
    is_predefined: true
  },
  {
    routine_number: "1220",
    routine_name: "Elektrisk Sikkerhet",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre trygg bruk og vedlikehold av elektrisk utstyr for å redusere risiko for elektriske skader, brann og ulykker.",
    responsibility: "Daglig leder skal sørge for nødvendig opplæring i elektrisk sikkerhet.\n\nVerneombud og ansvarlig leder skal påse at utstyr kontrolleres og brukes korrekt.",
    procedure: `Kontroll av elektrisk utstyr
• Utfør regelmessig kontroll av alt elektrisk utstyr.
• Defekt utstyr tas umiddelbart ut av bruk og repareres eller erstattes.

Sikker bruk
• Gi opplæring i korrekt bruk og unngå overbelastning av stikkontakter og kabler.
• Ansatte skal ikke arbeide på strømførende utstyr uten nødvendig kompetanse og godkjenning.

Forebygging av ulykker
• Sørg for tilgjengelige nødstrømbrytere og verneutstyr.
• Bruk jordfeilbrytere og overspenningsvern der det er nødvendig.

Rutiner ved feil eller skade
• Rapporter defekt utstyr eller elektriske feil umiddelbart via avviksskjema.
• Isoler og merk utstyr som "Ute av drift" til reparasjon er utført.

Periodisk kontroll
• Utfør periodiske kontroller av elektrisk anlegg i henhold til forskrifter.
• Bruk kun kvalifiserte elektrikere.`,
    examples: `• Lett tilgjengelige nødstrømbrytere
• Begrenset bruk av skjøteledninger
• Regelmessig sjekk av kabler
• Bruk av verneutstyr ved arbeid nær strøm
• Opplæring i tilkobling og bruk av utstyr`,
    remember: "Elektrisk sikkerhet er avgjørende for å unngå farlige situasjoner. Alle ansatte skal kjenne til riktig bruk og rapportering av avvik.",
    is_predefined: true
  },
  {
    routine_number: "1170",
    routine_name: "Ergonomiske Forhold",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Forebygge muskel- og skjelettplager ved å sikre at arbeidsplassen og arbeidsutstyr er ergonomisk tilpasset.",
    responsibility: "Daglig leder skal sikre at ergonomiske forhold vurderes og tilpasses.\n\nVerneombud bistår i vurdering og oppfølging av ergonomiske tiltak.",
    procedure: `Kartlegging
• Utfør regelmessige ergonomiske vurderinger av arbeidsstasjoner og oppgaver.
• Involver ansatte i kartleggingen.

Tilrettelegging
• Sørg for justerbart arbeidsutstyr (stoler, bord, verktøy, skjermer).
• Tilby tilrettelegging som heve-/senkebord, ergonomiske stoler og støtteutstyr.

Opplæring
• Gi opplæring i gode arbeidsstillinger og løfteteknikk.
• Informer om viktigheten av pauser og variasjon i arbeidet.

Oppfølging og evaluering
• Gjennomfør årlige oppfølginger av ergonomiske tiltak.
• Juster tiltak etter tilbakemeldinger og endringer i arbeidsoppgaver.

Rapportering av ergonomiske avvik
• Rapporter ergonomiske utfordringer via avviksskjema.
• Iverksett nødvendige tiltak.`,
    examples: `• Justering av bord- og stolhøyde
• Heve-/senkebord
• Pauser ved monotont arbeid
• Opplæring i løfteteknikk
• Antitretthetsmatter ved stående arbeid`,
    remember: "God ergonomi forebygger skader og bidrar til et helsefremmende arbeidsmiljø.",
    is_predefined: true
  },
  {
    routine_number: "1240",
    routine_name: "Førstehjelp",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte har grunnleggende kunnskap i førstehjelp og kan handle raskt og riktig ved ulykker eller skader.",
    responsibility: "Daglig leder skal sikre at førstehjelpsrutiner er på plass og at ansatte får opplæring.\n\nVerneombud skal påse at førstehjelpsutstyr er tilgjengelig og i god stand.",
    procedure: `Opplæring i førstehjelp
• Alle ansatte skal få grunnleggende førstehjelpsopplæring, inkludert HLR.
• Tilby jevnlige oppfriskningskurs.

Plassering og tilgjengelighet av utstyr
• Førstehjelpsutstyr og hjertestarter (der dette finnes) skal være lett tilgjengelig.
• Utpek ansvarlig per avdeling for kontroll av utstyret.

Håndtering av ulykker og skader
• Gi førstehjelp i henhold til opplæring.
• Ring 113 ved alvorlige skader eller kritisk tilstand.

Dokumentasjon og oppfølging
• Hendelser som krever førstehjelp dokumenteres i HMS-system eller avviksskjema.
• Følg opp den skadde ved behov.

Årlig kontroll av førstehjelpsutstyr
• Gjennomfør minst årlig kontroll av alt førstehjelpsutstyr.
• Erstatt brukt eller utgått utstyr.`,
    examples: `• Utføre HLR
• Stoppe blødninger
• Behandle sår og småskader
• Gi støtte og ro til skadet person`,
    remember: "Rask førstehjelp kan redde liv og redusere skadeomfang. Alle ansatte skal vite hvor utstyret er og ha grunnleggende ferdigheter.",
    is_predefined: true
  },
  {
    routine_number: "1210",
    routine_name: "Hygiene og Renhold",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Opprettholde god hygiene og renhold for å sikre et trygt, sunt og hygienisk arbeidsmiljø og redusere risiko for smittespredning.",
    responsibility: "Daglig leder har ansvar for at rutiner følges og at nødvendige ressurser er tilgjengelige.\n\nRenholdspersonell eller utpekte ansatte utfører renholdsoppgaver.",
    procedure: `Planlegging av renhold
• Utarbeid renholdsplan for alle områder, inkludert frekvens og metode.
• Egen plan for områder med særskilte krav (mat, helse m.m.).

Gjennomføring av renhold
• Utfør renhold i henhold til plan, inkludert daglig rengjøring av fellesområder, sanitær og kontaktflater.
• Bruk egnede rengjøringsmidler og følg sikkerhetsanvisninger.

Hygienetiltak for ansatte
• Oppfordre til god personlig hygiene og regelmessig håndvask.
• Sørg for tilgang til håndvask, såpe og tørkemuligheter.

Avfallshåndtering
• Søppel og avfall fjernes regelmessig og håndteres i henhold til miljøkrav.
• Søppelbøtter med lokk plasseres i fellesområder og tømmes daglig.

Rapportering av mangler
• Rapporter mangler innen hygiene og renhold via avviksskjema.
• Iverksett nødvendige tiltak.`,
    examples: `• Daglig rengjøring av arbeidsflater
• Regelmessig tømming av søppel
• Hånddesinfeksjonsstasjoner
• Daglig rengjøring av sanitærfasiliteter
• Rengjøring av kontaktpunkter`,
    remember: "God hygiene og renhold er grunnleggende for et trygt arbeidsmiljø. Alle ansatte skal bidra og rapportere mangler.",
    is_predefined: true
  },
  {
    routine_number: "1190",
    routine_name: "Kjemikaliehåndtering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre trygg håndtering, lagring og bruk av kjemikalier for å beskytte helse, miljø og sikkerhet.",
    responsibility: "Daglig leder skal sikre at kjemikaliehåndtering skjer iht. lover og forskrifter.\n\nVerneombud bistår i oppfølging og informasjon til ansatte.",
    procedure: `Kartlegging og risikovurdering
• Identifiser alle kjemikalier som brukes.
• Utfør risikovurdering for krav til verneutstyr, lagring og håndtering.

Sikkerhetsdatablader
• Sørg for oppdaterte sikkerhetsdatablader for alle kjemikalier.
• Gi opplæring i bruk av sikkerhetsdatablader og relevante farer.

Merking og lagring
• Merk kjemikalier i tråd med regelverk.
• Lagring skal være forsvarlig, i egnede beholdere, med adskillelse av uforlikelige stoffer.

Bruk av verneutstyr
• Påse at ansatte bruker nødvendig verneutstyr ved håndtering av kjemikalier.
• Gi opplæring i bruk og vedlikehold av verneutstyr.

Avfallshåndtering og søl
• Kjemikalieavfall håndteres iht. miljøkrav og leveres til godkjent mottak.
• Ha plan for håndtering av søl, inkludert bruk av absorberende midler og rapportering.

Rapportering av avvik
• Feil håndtering, manglende merking eller søl rapporteres via avviksskjema.
• Følg opp alle avvik.`,
    examples: `• Regelmessig oppdatering av sikkerhetsdatablader
• Tydelig merking av beholdere
• Riktig verneutstyr ved kjemikaliehåndtering
• Forsvarlig lagring`,
    remember: "Korrekt håndtering av kjemikalier er essensielt for å beskytte ansatte og miljø. Rutiner skal følges og avvik rapporteres.",
    is_predefined: true
  },
  {
    routine_number: "1270",
    routine_name: "Kontroll og Revisjon av HMS-system",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at HMS-systemet er oppdatert, effektivt og i samsvar med gjeldende lover og forskrifter, og å identifisere forbedringsmuligheter.",
    responsibility: "Daglig leder skal initiere regelmessig kontroll og revisjon.\n\nVerneombud og HR kan bistå i gjennomføring og evaluering.",
    procedure: `Planlegging av revisjon
• Sett opp årlig revisjonsplan for HMS-systemet.
• Definer mål, omfang og eventuelle fokusområder.

Gjennomføring
• Kontroller prosedyrer, dokumentasjon, risikovurderinger, avvikshåndtering og opplæringsplaner.
• Dokumenter avvik, svakheter og forbedringsområder.

Oppfølging
• Utarbeid handlingsplan med tiltak, ansvarlig og frister.
• Oppdater rutiner basert på resultatene.

Involvering og kommunikasjon
• Involver ledelse, ansatte og verneombud.
• Informer ansatte om endringer i HMS-systemet.

Dokumentasjon
• Dokumenter revisjonsresultater og tiltak i HMS-systemet.
• Lagring skal være trygg og lett tilgjengelig.`,
    examples: `• Oppdatering av risikovurderinger
• Forbedring av avviksregistrering
• Oppdaterte opplærings- og sikkerhetsrutiner
• Tilpasning til nye lovkrav eller endringer i organisasjonen`,
    remember: "Regelmessig revisjon sikrer et effektivt og lovpålagt HMS-system.",
    is_predefined: true
  },
  {
    routine_number: "1250",
    routine_name: "Miljøhensyn og Avfallshåndtering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at virksomheten ivaretar miljøhensyn og håndterer avfall på en ansvarlig og bærekraftig måte.",
    responsibility: "Daglig leder skal sikre at miljøhensyn tas i alle arbeidsprosesser, og at avfall håndteres korrekt.\n\nVerneombud bistår med informasjon og oppfølging.",
    procedure: `Miljøvennlige arbeidsprosesser
• Identifiser tiltak som redusert energiforbruk, mindre bruk av farlige kjemikalier og miljøvennlige materialer.
• Inkluder miljøhensyn i opplæring og instrukser.

Sortering og håndtering av avfall
• Etabler kildesortering (papir, plast, glass, farlig avfall, elektronikk).
• Plasser merkede sorteringsbeholdere lett tilgjengelig.

Håndtering av farlig avfall
• Farlig avfall håndteres iht. forskrifter og leveres til godkjente mottak.
• Gi opplæring i håndtering, lagring og bruk av verneutstyr.

Reduksjon og gjenbruk
• Oppfordre til redusert forbruk og gjenbruk av materialer.
• Gi praktiske tips i interne retningslinjer.

Dokumentasjon og oppfølging
• Dokumenter avfallsmengder og -typer i HMS-systemet.
• Vurder avfallshåndtering jevnlig og gjennomfør forbedringstiltak.`,
    examples: `• Redusert energibruk
• Bruk av resirkulerte materialer
• Kildesortering
• Redusert bruk av engangsprodukter`,
    remember: "Miljøhensyn og avfallshåndtering er alles ansvar. Bedriften skal bidra til bærekraftig utvikling.",
    is_predefined: true
  },
  {
    routine_number: "1230",
    routine_name: "Nødsituasjoner og Beredskap",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre rask og effektiv respons i nødsituasjoner for å beskytte ansatte, besøkende og eiendom, og minimere skade og tap.",
    responsibility: "Daglig leder har overordnet ansvar for beredskap og håndtering av nødsituasjoner.\n\nLedere og verneombud skal sikre at ansatte kjenner nødprosedyrer og at beredskapsutstyr er tilgjengelig.",
    procedure: `Identifisering av potensielle nødsituasjoner
• Utfør risikoanalyse for brann, gasslekkasje, kjemikalieutslipp, ulykker, naturhendelser m.m.
• Informer ansatte om de mest relevante risikoene.

Opplæring og øvelser
• Gi regelmessig opplæring i beredskapsprosedyrer, bruk av nødutstyr og evakuering.
• Gjennomfør minst én beredskapsøvelse i året.

Beredskapsutstyr
• Sørg for at brannslukkere, førstehjelpsutstyr og nødlys er tilgjengelig og i god stand.
• Kontroller utstyr regelmessig.

Evakuering og samlingsplass
• Ved nødsituasjon evakueres bygget til avtalt samlingsplass.
• Avdelingsledere kontrollerer at alle er evakuert.

Kommunikasjon i nødsituasjoner
• Ansatte skal vite hvem de kontakter, inkludert nødnummer 113.
• Ha liste over kontaktpersoner og informasjonskanaler.

Evaluering
• Etter nødsituasjon eller øvelse evalueres beredskapen.
• Rutiner og utstyr justeres ved behov.`,
    examples: `• Brann eller eksplosjon
• Gasslekkasje eller kjemikalieutslipp
• Naturkatastrofer
• Alvorlige ulykker eller skader
• Kritisk strømbrudd`,
    remember: "God beredskap reduserer skadeomfang i nødsituasjoner. Alle ansatte skal delta i øvelser og kjenne rutinene.",
    is_predefined: true
  },
  {
    routine_number: "1200",
    routine_name: "Psykososialt Arbeidsmiljø",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre et godt psykososialt arbeidsmiljø som fremmer trivsel, samhold og samarbeid, og reduserer risiko for stress og psykiske belastninger.",
    responsibility: "Daglig leder skal fremme et godt psykososialt arbeidsmiljø og iverksette tiltak ved behov.\n\nVerneombud skal være tilgjengelig for ansatte og bistå i tilrettelegging.",
    procedure: `Kartlegging
• Gjennomfør regelmessige kartlegginger og risikovurderinger (arbeidsbelastning, rolleavklaring, støtte, kommunikasjon).
• Oppfordre ansatte til å gi tilbakemeldinger.

Tiltak for godt arbeidsmiljø
• Legg til rette for god kommunikasjon og samarbeid.
• Hold jevnlige møter hvor ansatte kan ta opp utfordringer.

Forebygging av konflikter og stress
• Gi opplæring i stressmestring og konflikthåndtering.
• Ta tak i konflikter tidlig.

Oppfølging av stress og psykiske belastninger
• Identifiser ansatte som kan være utsatt for arbeidsrelatert stress.
• Tilby tilrettelegging og tilgang til bedriftshelsetjeneste.

Rapportering av psykososiale avvik
• Mobbing, trakassering og uoverkommelig arbeidsbelastning rapporteres via avviksskjema.
• Følg opp og iverksett nødvendige tiltak.`,
    examples: `• Medarbeidersamtaler
• Tilrettelegging av arbeidsoppgaver
• Kurs i stressmestring og konflikthåndtering
• Sosiale tiltak på arbeidsplassen`,
    remember: "Et godt psykososialt arbeidsmiljø er viktig for trivsel og produktivitet. Alle skal bidra positivt og rapportere problemer.",
    is_predefined: true
  },
  {
    routine_number: "1110",
    routine_name: "Risikovurdering",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle arbeidsoppgaver vurderes med hensyn til risiko, og at tiltak iverksettes for å minimere skader på personer, miljø og materiell.",
    responsibility: "Alle ansatte skal bidra i risikovurdering.\n\nLinjeleder har ansvar for gjennomføring og oppfølging.",
    procedure: `Identifisering av risikoområder
• Kartlegg alle arbeidsoppgaver.
• Identifiser risikoelementer som kan føre til skade eller uønskede hendelser.

Gjennomføring av risikovurdering
• Vurder hver risiko etter sannsynlighet og konsekvens.
• Bruk skalaen Lav, Moderat, Høy.

Implementering av tiltak
• Iverksett tiltak for risiko vurdert som Moderat eller Høy.
• Informer ansatte og gi nødvendig opplæring.

Dokumentasjon
• Registrer risikovurderinger i systemet under relevant arbeidsprosess.
• Utfør ny vurdering ved endring i arbeidsoppgaver.

Oppfølging og revisjon
• Følg opp risikovurderinger og evaluer tiltak.
• Gjennomfør årlig revisjon.`,
    examples: "",
    remember: "Ved identifisering av avvik skal avviksskjema fylles ut.",
    is_predefined: true
  },
  {
    routine_number: "1280",
    routine_name: "Risikovurdering og Handlingsplan",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre systematisk identifisering, vurdering og håndtering av risikoer, samt utarbeidelse av handlingsplaner for å redusere eller eliminere risiko.",
    responsibility: "Daglig leder har ansvar for gjennomføring og oppfølging av handlingsplaner.\n\nVerneombud og ansatte bidrar til identifisering av farekilder og deltar i risikovurderingen.",
    procedure: `Identifisering av farekilder
• Identifiser farekilder (brann, kjemikalier, maskiner, arbeidsstillinger, belastninger m.m.).
• Registrer farekilder i HMS-systemet under RISIKOANALYSE.

Vurdering av sannsynlighet og konsekvens
• Vurder sannsynlighet (1–5) og konsekvens (1–5).
• Dokumenter samlet risikoverdi.

Handlingsplan
• For høy risiko utarbeides handlingsplan.
• Planen skal angi: HVORDAN (tiltak), HVEM (ansvarlig), NÅR (frist).

Oppfølging og dokumentasjon
• Oppdater status på tiltak i HMS-systemet.
• Vurder tiltakseffekt og juster ved behov.`,
    examples: `• Brann: vedlikehold av slukkingsutstyr, brannøvelser
• Kjemikalier: sikker lagring, merking, opplæring
• Arbeidsstillinger: ergonomiske tilpasninger`,
    remember: "Risikovurdering og handlingsplaner er avgjørende for et trygt arbeidsmiljø.",
    is_predefined: true
  },
  {
    routine_number: "1260",
    routine_name: "Sykefraværsoppfølging",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre systematisk oppfølging av ansatte ved sykefravær, støtte tilrettelegging og forebygge langtidssykefravær.",
    responsibility: "Daglig leder har ansvar for oppfølging av sykefravær, i samarbeid med HR og verneombud ved behov.",
    procedure: `Registrering av sykefravær
• Sykefravær meldes til nærmeste leder så snart som mulig.
• Fravær registreres i henhold til interne rutiner.
• Legeerklæring kreves ved fravær over tre dager.

Oppfølgingssamtaler
• Etter ca. én uke gjennomføres første oppfølgingssamtale.
• Ved langvarig fravær holdes jevnlige oppfølgingssamtaler.

Individuell oppfølgingsplan
• Ved forventet fravær utover én måned utarbeides individuell plan.
• Planen beskriver tilrettelegging, gradvis tilbakeføring m.m.

Tilrettelegging og tilbakeføring
• Tilpass arbeidsoppgaver og arbeidsmiljø ut fra den ansattes behov.
• Involver bedriftshelsetjeneste ved behov.

Dokumentasjon og rapportering
• Dokumenter samtaler, planer og tiltak i HMS-systemet.
• Følg opp sykefraværsmønster.`,
    examples: `• Gradvis opptrapping av arbeidstid
• Tilpasning av arbeidsoppgaver
• Tilpasning av arbeidsstasjon
• Støtte fra bedriftshelsetjeneste`,
    remember: "God oppfølging støtter den ansatte og kan forebygge langtidssykefravær.",
    is_predefined: true
  },
  {
    routine_number: "1130",
    routine_name: "Sikkerhetsopplæring og Kompetanse",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alle ansatte har nødvendig opplæring og kompetanse for å utføre arbeid på en trygg og sikker måte.",
    responsibility: "Daglig leder skal sikre at ansatte får nødvendig opplæring, og at kompetanse holdes oppdatert.",
    procedure: `Identifisering av opplæringsbehov
• Gjennomgå arbeidsoppgaver og identifiser behov for sikkerhetsopplæring.
• Utfør kompetansekartlegging ved nyansettelser og endringer.

Planlegging av opplæring
• Lag plan for generell HMS-opplæring og spesifikke kurs (f.eks. arbeid i høyden).
• Opprett årlig opplæringsplan med resertifiseringer.

Gjennomføring
• Sørg for at opplæring gjennomføres før risikofylte oppgaver startes.
• Dokumenter alle kurs i HMS-systemet.

Evaluering og oppfølging
• Vurder opplæringseffekt og juster planen.
• Gi tilbakemelding til ansatte.

Dokumentasjon av kompetanse
• Oppbevar kursbevis og sertifikater i HMS-systemet eller kompetansemappe.
• Ansatte skal ha tilgang til egen dokumentasjon.`,
    examples: `• Grunnleggende HMS
• Arbeid i høyden og fallsikring
• Bruk av verneutstyr
• Kjemikaliehåndtering
• Førstehjelp
• Bruk av spesialverktøy og maskiner`,
    remember: "Oppdatert kompetanse er nødvendig for et trygt arbeidsmiljø.",
    is_predefined: true
  },
  {
    routine_number: "1140",
    routine_name: "Vedlikehold og Kontroll av Utstyr",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at alt utstyr er i forskriftsmessig stand gjennom regelmessig vedlikehold og kontroll.",
    responsibility: "Daglig leder skal sikre at utstyr kontrolleres og vedlikeholdes.\n\nOmrådeleder er ansvarlig for gjennomføring av kontrollrutiner.",
    procedure: `Identifisering av utstyr
• Lag oversikt over alt utstyr med vedlikeholdsbehov (maskiner, verktøy, kjøretøy, sikkerhetsutstyr).

Planlegging
• Opprett vedlikeholdsplan basert på produsentanbefalinger, bruksfrekvens og lovkrav.
• Dokumenter planlagte aktiviteter i HMS-systemet.

Gjennomføring
• Utfør kontroller iht. planen.
• Vedlikehold, reparer eller erstatt utstyr ved behov.

Registrering
• Dokumenter dato, utfører, funn og tiltak.
• Lagring i HMS-system eller vedlikeholdsmappe.

Håndtering av feil og mangler
• Utstyr med feil som påvirker sikkerheten tas ut av drift.
• Avvik registreres via avviksskjema og rapporteres til ansvarlig.`,
    examples: `• Maskiner og verktøy
• Fallsikringsutstyr og brannslukkere
• Kjøretøy og arbeidsplattformer
• Elektrisk utstyr og kabler`,
    remember: "Alt utstyr skal være i god stand. Vedlikeholdsplan og dokumentasjon skal holdes oppdatert.",
    is_predefined: true
  },
  {
    routine_number: "123588",
    routine_name: "Valg av Verneombud",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at valg av verneombud gjennomføres iht. arbeidsmiljøloven § 6-2, og at verneombudet får nødvendig opplæring og ressurser.",
    responsibility: "Daglig leder: organiserer valgprosessen og tilrettelegger for verneombudets arbeid.\n\nAnsatte: velger verneombud ved avstemning.",
    procedure: `Krav til verneombud
• Må ha tilstrekkelig kunnskap om arbeidsplassen og HMS-arbeid.
• Kan ikke ha lederstilling.

Valgprosess
• Valg gjennomføres hvert annet år eller ved behov.
• Ansatte stemmer anonymt.
• Resultat dokumenteres i HMS-systemet.

Opplæring
• Verneombud skal delta i påkrevd HMS-opplæring.
• Skal få nødvendig tid til å utføre oppgaver.

Dokumentasjon
• Protokoll fra valget oppbevares i HMS-systemet.
• Registrer navn og kontaktinformasjon til verneombud.

Kontroll og revisjon
• Evaluer valgprosessen ved behov.
• Oppdater rutinen ved endrede krav.`,
    examples: "",
    remember: "",
    is_predefined: true
  },
  {
    routine_number: "123589",
    routine_name: "Vernerunde",
    category: "Helse, Miljø og Sikkerhet",
    purpose: "Sikre at vernerunder gjennomføres systematisk for å identifisere og håndtere farer.",
    responsibility: "Verneombud: leder vernerunden i samarbeid med daglig leder.\n\nDaglig leder: sørger for ressurser og oppfølging av tiltak.",
    procedure: `Forberedelser
• Bruk fast sjekkliste som dekker blant annet: Arbeidsmiljø, Bruk av verneutstyr, Brannsikkerhet.

Gjennomføring
• Gjennomfør vernerunde minst én gang per kvartal.
• Noter observasjoner og potensielle farer.

Oppfølging
• Utarbeid tiltaksplan basert på funn.
• Følg opp tiltak innen avtalte frister.

Dokumentasjon
• Lag rapport og lagre i HMS-systemet.
• Informer ansatte om resultatene.

Kontroll og revisjon
• Gjennomfør årlig evaluering av vernerunder for å sikre effektivitet.`,
    examples: "",
    remember: "",
    is_predefined: true
  }
];

export const RoutinesStep = forwardRef<RoutinesStepRef, RoutinesStepProps>(
  function RoutinesStep({ existingData, onSave, isSaving }, ref) {
    const [routines, setRoutines] = useState<RoutineItem[]>(
      existingData?.routines || []
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
    const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());

  const filteredLibraryRoutines = PREDEFINED_ROUTINES.filter(
    routine =>
      routine.routine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addRoutineFromLibrary = (routine: Omit<RoutineItem, 'id'>) => {
    const exists = routines.some(r => r.routine_number === routine.routine_number);
    if (exists) {
      toast.error("Denne rutinen er allerede lagt til");
      return;
    }
    
    const newRoutine: RoutineItem = {
      ...routine,
      id: crypto.randomUUID()
    };
    setRoutines([...routines, newRoutine]);
    toast.success(`"${routine.routine_name}" lagt til`);
  };

  const addCustomRoutine = () => {
    const newRoutine: RoutineItem = {
      id: crypto.randomUUID(),
      routine_number: "",
      routine_name: "Ny rutine",
      category: "Helse, Miljø og Sikkerhet",
      purpose: "",
      responsibility: "",
      procedure: "",
      examples: "",
      remember: "",
      is_predefined: false
    };
    setRoutines([...routines, newRoutine]);
    setEditingRoutine(newRoutine);
  };

  const removeRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
    toast.success("Rutine fjernet");
  };

  const updateRoutine = (updatedRoutine: RoutineItem) => {
    setRoutines(routines.map(r => r.id === updatedRoutine.id ? updatedRoutine : r));
    setEditingRoutine(null);
    toast.success("Rutine oppdatert");
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRoutines);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRoutines(newExpanded);
  };

  const handleSave = async () => {
    if (routines.length === 0) {
      toast.error("Legg til minst én rutine før du lagrer");
      return;
    }
    await onSave({ routines });
    toast.success("Rutiner lagret");
  };

  // Expose save method to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    hasData: () => routines.length > 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Library className="w-4 h-4" />
              Velg fra rutinebibliotek
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Rutinebibliotek</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i rutiner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredLibraryRoutines.map((routine, index) => {
                    const isAdded = routines.some(r => r.routine_number === routine.routine_number);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{routine.routine_name}</p>
                          <p className="text-xs text-muted-foreground">Nr. {routine.routine_number}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? "secondary" : "default"}
                          onClick={() => addRoutineFromLibrary(routine)}
                          disabled={isAdded}
                          className="ml-2 shrink-0"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Lagt til
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Legg til
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={addCustomRoutine} className="gap-2">
          <Plus className="w-4 h-4" />
          Opprett egen rutine
        </Button>
      </div>

      {/* Added Routines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Valgte rutiner ({routines.length})</h3>
        </div>

        {routines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Ingen rutiner lagt til ennå. Velg fra biblioteket eller opprett egne.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {routines.map((routine) => (
              <Collapsible
                key={routine.id}
                open={expandedRoutines.has(routine.id)}
                onOpenChange={() => toggleExpanded(routine.id)}
              >
                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                        {expandedRoutines.has(routine.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {routine.routine_name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Nr. {routine.routine_number || "—"}
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1 ml-2">
                        {routine.is_predefined && (
                          <Badge variant="secondary" className="text-xs">
                            Forhåndsdefinert
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingRoutine(routine)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRoutine(routine.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4 space-y-3 text-sm">
                      {routine.purpose && (
                        <div>
                          <p className="font-medium text-muted-foreground">Formål</p>
                          <p className="whitespace-pre-wrap">{routine.purpose}</p>
                        </div>
                      )}
                      {routine.responsibility && (
                        <div>
                          <p className="font-medium text-muted-foreground">Ansvar</p>
                          <p className="whitespace-pre-wrap">{routine.responsibility}</p>
                        </div>
                      )}
                      {routine.procedure && (
                        <div>
                          <p className="font-medium text-muted-foreground">Fremgangsmåte</p>
                          <p className="whitespace-pre-wrap">{routine.procedure}</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoutine} onOpenChange={() => setEditingRoutine(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger rutine</DialogTitle>
          </DialogHeader>
          {editingRoutine && (
            <RoutineEditForm
              routine={editingRoutine}
              onSave={updateRoutine}
              onCancel={() => setEditingRoutine(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>Lagrer...</>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lagre rutiner
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

function RoutineEditForm({
  routine,
  onSave,
  onCancel
}: {
  routine: RoutineItem;
  onSave: (routine: RoutineItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(routine);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.routine_name.trim()) {
      toast.error("Rutinenavn er påkrevd");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Rutine Nr.</label>
          <Input
            value={form.routine_number}
            onChange={(e) => setForm({ ...form, routine_number: e.target.value })}
            placeholder="F.eks. 1160"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="F.eks. Helse, Miljø og Sikkerhet"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rutinenavn *</label>
        <Input
          value={form.routine_name}
          onChange={(e) => setForm({ ...form, routine_name: e.target.value })}
          placeholder="Navn på rutinen"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Formål</label>
        <Textarea
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          placeholder="Beskriv formålet med rutinen..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ansvar</label>
        <Textarea
          value={form.responsibility}
          onChange={(e) => setForm({ ...form, responsibility: e.target.value })}
          placeholder="Hvem har ansvar for hva..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fremgangsmåte</label>
        <Textarea
          value={form.procedure}
          onChange={(e) => setForm({ ...form, procedure: e.target.value })}
          placeholder="Beskriv steg-for-steg fremgangsmåte..."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Eksempler</label>
        <Textarea
          value={form.examples}
          onChange={(e) => setForm({ ...form, examples: e.target.value })}
          placeholder="Relevante eksempler..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Husk</label>
        <Textarea
          value={form.remember}
          onChange={(e) => setForm({ ...form, remember: e.target.value })}
          placeholder="Viktige påminnelser..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Avbryt
        </Button>
        <Button type="submit">
          <Check className="w-4 h-4 mr-1" />
          Lagre endringer
        </Button>
      </div>
    </form>
  );
}
