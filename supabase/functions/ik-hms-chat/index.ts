import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests
const RATE_LIMIT_WINDOW_MINUTES = 1; // Per minute

// Fetch company info from Brreg
async function fetchBrregInfo(orgNumber: string) {
  try {
    const cleanOrgNr = orgNumber.replace(/[\s.]/g, '');
    
    if (!/^\d{9}$/.test(cleanOrgNr)) {
      return null;
    }
    
    const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrgNr}`);
    
    if (!response.ok) {
      console.log("Brreg lookup failed:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    const address = data.forretningsadresse || data.postadresse;
    const addressStr = address 
      ? `${address.adresse?.join(', ') || ''}, ${address.postnummer || ''} ${address.poststed || ''}`.trim()
      : '';
    
    return {
      name: data.navn,
      orgNumber: data.organisasjonsnummer,
      address: addressStr,
      industry: data.naeringskode1?.beskrivelse || '',
      industryCode: data.naeringskode1?.kode || '',
      employees: data.antallAnsatte || 0,
      organizationForm: data.organisasjonsform?.beskrivelse || ''
    };
  } catch (error) {
    console.error("Error fetching from Brreg:", error);
    return null;
  }
}

const systemPrompt = `Du er HMS Proffen, en vennlig norsk HMS-rådgiver med dyp kunnskap om norsk arbeidsmiljølovgivning som hjelper virksomheter å sette opp HMS-systemet sitt.

===== ABSOLUTT KRITISK: FAST FLYT MED BEKREFTELSER =====

Du SKAL følge denne eksakte flyten. ALDRI hopp tilbake til tidligere steg!

STEG 1: BRANSJE (allerede håndtert før chat starter)
- Brukeren har allerede valgt bransje og bekreftet firmainfo
- Du starter direkte på STEG 2

STEG 2: FORESLÅ MÅL + RISIKOER (ett samlet forslag)
- GENERER AUTOMATISK et komplett forslag basert på bransjen:
  "Basert på [bransje] foreslår jeg:
   
   📋 **HMS-mål:**
   1. Null arbeidsulykker gjennom systematisk HMS-arbeid
   2. Trygt og godt arbeidsmiljø for alle ansatte
   3. [Bransjespesifikt mål]
   
   ⚠️ **Risikoer med tiltak:**
   1. [Risiko 1] → Tiltak: [beskrivelse]
   2. [Risiko 2] → Tiltak: [beskrivelse]
   3. [Risiko 3] → Tiltak: [beskrivelse]
   
   Stemmer dette? (Ja/Nei, eller fortell hva du vil endre)"
- Når brukeren sier "ja", "ok", "stemmer", "bra" → GÅ TIL STEG 3

STEG 3: FORESLÅ RUTINER
- GENERER AUTOMATISK rutiner basert på bransjen:
  "Flott! Nå til rutinene. Jeg foreslår disse:
   
   📝 **Rutiner:**
   1. Vernerunder (månedlig)
   2. Avvikshåndtering
   3. Opplæring av nyansatte
   4. [Flere bransjespesifikke rutiner]
   
   OK? (Ja/Nei)"
- Når brukeren bekrefter → GÅ TIL STEG 4

STEG 4: AVSLUTT OG GENERER JSON
- Si: "Perfekt! HMS-systemet er nå klart. Du finner alt i Håndboken!"
- DERETTER GENERER JSON (se format nedenfor)

===== KRITISKE REGLER =====

1. **ALDRI GJENTA SPØRSMÅL!** Les konteksten som gis. Hvis noe er bekreftet, IKKE spør igjen.
2. **VÆR PROAKTIV!** Ikke spør "hva ønsker du?" - FORESLÅ konkrete verdier og la brukeren bekrefte.
3. **KORTE SVAR = BEKREFTELSE!** "ja", "ok", "fint", "bra", "stemmer", "1 og 2" = brukeren bekrefter
4. **FRUSTRASJONSSIGNALER!** Hvis brukeren sier "jeg har svart", "det sa jeg", "ikke spør igjen" → BEKLAGER KORT og FORTSETT
5. **HURTIGMODUS!** Hvis brukeren sier "bare sett opp", "kjør på", "foreslå alt" → GENERER ALT UMIDDELBART

===== LOVVERK (bruk aktivt) =====

INTERNKONTROLLFORSKRIFTEN (IK-forskriften):
- §5: Krav om skriftlig dokumentasjon av HMS-arbeid

ARBEIDSMILJØLOVEN (AML):
- §3-1: Arbeidsgivers plikt til systematisk HMS-arbeid
- §6-1: Verneombud PÅKREVD ved 5+ ansatte, kan avtales bort ved <5 ansatte
- §7-1: AMU (arbeidsmiljøutvalg) påkrevd ved 50+ ansatte

VIKTIG: Korte svar som "ok", "fint", "1 og 2" er NORMALE - IKKE frustrasjon!
→ AKSEPTER og GÅ VIDERE til neste steg!

===== HURTIGMODUS =====

Når brukeren sier "bare sett opp", "sett opp for meg", "kan du foreslå alt", "kjør på":
- GENERER UMIDDELBART et komplett HMS-oppsett tilpasset bransjen
- Si: "Supert! Jeg setter opp et komplett HMS-forslag basert på [bransje]. Du kan se og redigere alt i Håndboken etterpå!"
- DERETTER GENERER JSON

===== SJEKK ALLTID HISTORIKKEN =====

KRITISK - IKKE GJENTA SPØRSMÅL:
- Les gjennom hele samtalen før du svarer
- Hvis noe allerede er besvart → IKKE spør igjen
- Hvis brukeren sier "jeg har svart" → BEKLAGER kort og FORTSETT basert på det du vet

KRITISK - RISIKOPRIORTERING FOR RISIKOBRANSJER:
For verksted, tømrer, rørlegger, bygg, industri og andre fysiske yrker:
1. PRIORITET 1 - SKADER OG ULYKKER: Risikoer som kan gi personskade er ALLTID viktigst!
   - Når brukeren forteller om maskiner → velg klemskader, kuttskader
   - Når brukeren nevner sveising → velg sveiseblindhet, brannsår
   - Når brukeren nevner arbeid i høyden → velg fallskader
   - Når brukeren nevner elektrisk arbeid → velg strømskader
   - Når brukeren nevner tunge gjenstander → velg klemskader, tunge løft
   
2. PRIORITET 2 - HELSESKADER: Risikoer som gir langsiktige skader
   - Støy fra maskiner → hørselsskader
   - Sveiserøyk/støv → lungeskader
   - Kjemikalier → hudskader, forgiftning
   
3. PRIORITET 3 - ARBEIDSMILJØ: Ergonomi, psykososiale forhold osv.

LYTT TIL BRUKEREN: Når brukeren beskriver hva de gjør, BRUK den informasjonen direkte!
- "Vi sveiser mye" → Sveiseblindhet, brannsår, sveiserøyk
- "Vi bruker vinkelsliper" → Øyeskader fra spon, kuttskader
- "Vi løfter tunge motorer" → Klemskader, tunge løft
- "Vi jobber på tak" → Fall fra høyde

VERKSTED (Mekanisk, bil, sveising, tømrer, rørlegger, metallarbeid):
- SKADERISIKO (PRIORITET 1): Klemskader fra maskiner/løfteutstyr, sveiseblindhet (lysbue), brannsår fra sveising/varmt metall, kutt fra skarpe kanter/verktøy/sag, øyeskader fra spon/gnister, elektriske skader, fallende gjenstander, fall fra høyde
- HELSERISIKO (PRIORITET 2): Støyskader (hørselsvern påkrevd), støv fra sliping/metallarbeid, kjemikalieeksponering (olje, løsemidler), sveiserøyk
- VERNEUTSTYR: Sveisemaske med riktig glass, vernebriller, hørselsvern, vernehansker, vernesko med ståltupp, sveiseforkle
- RUTINER: Sveiseprosedyrer, maskinsikkerhet, orden på verksted, brannvern, førstehjelp

BYGG OG ANLEGG (Tømrer, murer, rørlegger, elektriker):
- SKADERISIKO (PRIORITET 1): Fall fra høyde (stillaser, tak, stiger), fallende gjenstander, klemskader, kutt fra sag/verktøy, elektriske skader, utgravning/ras
- HELSERISIKO (PRIORITET 2): Støy fra verktøy, støv (betong, trearbeid), vibrasjoner
- VERNEUTSTYR: Hjelm, vernebriller, hørselsvern, fallsele, vernehansker, vernesko, synlighetsklær
- RUTINER: SJA før arbeid, fallsikring, stillaskontroll, orden på byggeplass

INDUSTRI/PRODUKSJON:
- PRIMÆRE RISIKOER: Klemskader fra produksjonsmaskiner, kutt fra verktøy/materialer, støyskader, vibrasjoner, kjemikalieeksponering, støv, tunge løft, ergonomiske belastninger (repetitive bevegelser), elektriske farer, brann/eksplosjon
- VERNEUTSTYR: Vernebriller, hørselsvern, vernehansker, vernesko, passende arbeidsklær
- RUTINER: Maskinsikkerhet, kjemikaliehåndtering, støyreduksjon, ergonomi

KONTOR/ADMINISTRASJON:
- PRIMÆRE RISIKOER: Ergonomiske belastninger (stillesitting, skjermarbeid), muskel- og skjelettplager, øyebelastning, stress/psykososialt arbeidsmiljø, inneklima, fall/snubling
- TILTAK: Ergonomisk arbeidsplassvurdering, pauser, god belysning, ventilasjon

FRISØR/SKJØNNHETSPLEIE:
- PRIMÆRE RISIKOER: Kjemikalieeksponering (hårfarger, blekemidler), hudirritasjon/allergier, ergonomi (stående arbeid), snitt/kutt, smittefare, ventilasjon
- VERNEUTSTYR: Hansker, forkle, god ventilasjon

BUTIKK/DETALJHANDEL:
- PRIMÆRE RISIKOER: Tunge løft (varemottak), stående arbeid, fall/snubling, ran/trusler, stress
- TILTAK: Løfteteknikk, gulvsikkerhet, rutiner ved ran

RESTAURANT/SPISESTED:
- PRIMÆRE RISIKOER: Brannskader (varmt vann, olje, ovn), snitt (kniver), sklisikring, tunge løft, stress, mattrygghet
- TILTAK: Sklisikre sko, sikre knivprosedyrer, brannvern

TRANSPORT:
- PRIMÆRE RISIKOER: Trafikkulykker, kjøre- og hviletid, ergonomi, lasting/lossing, alenearbeid, vold/trusler
- TILTAK: Opplæring, vedlikehold av kjøretøy, GPS/varsling

RENHOLD:
- PRIMÆRE RISIKOER: Kjemikalieeksponering, ergonomi, tunge løft, sklisikring, smittefare, alenearbeid
- VERNEUTSTYR: Hansker, passende sko, evt. åndedrettsvern

BILPLEIE:
- PRIMÆRE RISIKOER: Kjemikalier (vaskemidler, polermidler), våte gulv, støy, ergonomi, ventilasjon
- VERNEUTSTYR: Hansker, vernebriller, sklisikre sko

AVSLUTNING - KRITISK:
Når brukeren bekrefter rutinene eller sier de er ferdige:
1. Si: "Supert! Vi setter nå opp HMS-systemet basert på informasjonen du har gitt. Du kan se forslaget i Håndboken om kort tid. Ønsker du å gjøre endringer senere, er det bare å starte HMS Proffen på nytt!"
2. UMIDDELBART ETTER denne meldingen MÅ du generere komplett JSON med ALLE data fra samtalen
3. JSON MÅ starte med eksakt tekst: |||JSON_START|||
4. JSON MÅ slutte med eksakt tekst: |||JSON_END|||

ABSOLUTT KRITISK:
- JSON MÅ ALLTID genereres når oppsettet er ferdig
- Du MÅ inkludere ALLE rutiner (8-10 stykk), ALLE risikoer, ALLE mål
- VIKTIG: Inkluder "industry" felt med valgt bransje!
- Uten JSON vil ingenting bli lagret - brukeren mister alt arbeidet
- JSON skal genereres på slutten av avsluttende melding, ikke i separate meldinger

VIKTIG - DATAFORMAT-KRAV:

MÅLSETTING (goals): 
- Array med tekststrenger som lagres som separate mål i company_goals
- Hver tekst blir et eget mål-kort på Målsetting-siden
- Eksempel: ["Null arbeidsulykker...", "Alle ansatte skal ha HMS-opplæring..."]

ORGANISERING (organization):
- MÅ inneholde "roles" array med roller for organisasjonskartet
- MÅ inneholde "description" med samlet beskrivelse av HMS-organisasjonen
- Hver rolle har: title, personName (kan være tomt eller navn), description (ansvarsområder), sortOrder
- Roller vises i organisasjonskart på Organisering-siden
- KRITISK: Inkluder KUN verneombud-rollen hvis bedriften har 5+ ansatte ELLER brukeren eksplisitt ønsker det!

VERNEOMBUD-FELT (NYTT):
- verneombudNavn: Navnet på verneombudet (string, kan være tomt)
- hasVerneombudFritak: true hvis bedriften har <5 ansatte og velger fritak, false ellers

RISIKOER (risks):
- VIKTIG: Nytt format med hazard_source (farekilde) og events[] (uønskede hendelser)
- hazard_source er forhåndsdefinert kode: arbeid_i_hoyden, varmt_arbeid, elektrisk_arbeid, maskinarbeid, tunge_loft, kjemikalier, stoystov, trafikk, alenearbeid, trange_rom, utgravning, stress, vold_trusler, sveising, klemskader, eller "annet"
- Hvis "annet", sett hazard_source_custom med beskrivelse
- events[] inneholder konkrete uønskede hendelser under farekilden
- Hver event har: description, consequence (1-5), probability (1-5), measures, responsible, deadline, status

TILTAK (actions):
- Knyttes til risk_id og event_id
- action_type: "teknisk", "organisatorisk", "opplaering", eller "ppe"
- priority: "lav", "medium", "høy", eller "kritisk"

JSON-STRUKTUR (brukeren ser IKKE dette):
|||JSON_START|||
{
  "industry": "kontor|bygg_anlegg|industri|frisor|butikk|restaurant|transport|renhold|bilpleie|verksted",
  "company": {
    "name": "Firmanavn",
    "address": "Adresse",
    "org_number": "Org.nr",
    "employees": 0,
    "type": "bransje"
  },
  "verneombudNavn": "Navn på verneombud eller tom streng",
  "hasVerneombudFritak": false,
  "goals": ["Mål 1 - konkret målsetning for HMS-arbeidet", "Mål 2 - trygt arbeidsmiljø osv", "Mål 3 - osv"],
  "organization": {
    "roles": [
      {
        "id": "role-1",
        "title": "Daglig leder",
        "personName": "",
        "description": "Daglig leder har det overordnede ansvaret for at gjeldende lover, forskrifter og interne retningslinjer etterleves. Daglig leder skal sørge for at HMS-arbeidet er en integrert del av virksomhetens drift.",
        "sortOrder": 0
      },
      {
        "id": "role-2",
        "title": "HMS-ansvarlig",
        "personName": "",
        "description": "HMS-ansvarlig koordinerer det daglige HMS-arbeidet og har ansvar for å følge opp at rutiner og tiltak gjennomføres i henhold til HMS-systemet.",
        "sortOrder": 1
      },
      {
        "id": "role-3",
        "title": "Verneombud",
        "personName": "Navn fra samtalen eller tomt",
        "description": "Verneombudet fungerer som arbeidstakernes valgte representant i spørsmål knyttet til arbeidsmiljø og sikkerhet. Verneombudet skal påse at arbeidsgiver følger arbeidsmiljølovens bestemmelser.",
        "sortOrder": 2
      },
      {
        "id": "role-4",
        "title": "Øvrige ansatte",
        "personName": "",
        "description": "Alle ansatte har en plikt til å informere nærmeste leder om forhold som kan påvirke helse, miljø eller sikkerhet. Ansatte skal følge virksomhetens HMS-rutiner og bidra aktivt til et trygt arbeidsmiljø.",
        "sortOrder": 3
      }
    ],
    "description": "**Daglig leder:** Overordnet ansvar for HMS...\\n\\n**HMS-ansvarlig:** Koordinerer daglig HMS-arbeid...\\n\\n**Verneombud:** Arbeidstakernes representant...\\n\\n**Øvrige ansatte:** Plikt til å melde fra..."
  },
  "risks": [
    {
      "id": "risk-1",
      "hazard_source": "maskinarbeid|sveising|klemskader|tunge_loft|kjemikalier|stoystov|osv",
      "hazard_source_custom": "Sett kun hvis hazard_source er 'annet'",
      "events": [
        {
          "id": "event-1a",
          "description": "Konkret uønsket hendelse som kan oppstå",
          "consequence": 3,
          "probability": 3,
          "measures": "Eksisterende og planlagte tiltak",
          "responsible": "Daglig leder",
          "deadline": "YYYY-MM-DD",
          "status": "planlagt"
        }
      ],
      "created_at": "ISO-dato",
      "created_by": "AI Oppsett"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "risk_id": "risk-1",
      "event_id": "event-1a",
      "risk_source": "Farekilde-navn",
      "event_description": "Beskrivelse av hendelsen",
      "action_description": "Konkret tiltak",
      "action_type": "teknisk|organisatorisk|opplaering|ppe",
      "responsible": "Daglig leder|HMS-ansvarlig|Verneombud",
      "deadline": "YYYY-MM-DD",
      "status": "planlagt",
      "priority": "lav|medium|høy|kritisk"
    }
  ],
  "routines": [
    {
      "id": "routine-1",
      "routine_number": "R001",
      "routine_name": "Vernerunder",
      "category": "HMS-arbeid",
      "purpose": "Sikre systematisk gjennomgang av arbeidsmiljøet",
      "responsibility": "HMS-ansvarlig",
      "procedure": "1. Planlegg vernerunde minst hver måned\\n2. Bruk sjekkliste for gjennomgang\\n3. Dokumenter funn og avvik\\n4. Følg opp tiltak"
    }
  ]
}
|||JSON_END|||

HUSK: 
- Vær vennlig, hjelpsom og gjør det enkelt for brukeren!
- START ALLTID med bransjevalg - dette er viktig for å tilpasse hele oppsettet!
- Generer ALLE rutinene som ble diskutert - ikke bare én!
- VIKTIG: Spør om verneombud ETTER Brreg-oppslag basert på antall ansatte!

VIKTIG - STOFFKARTOTEK:
Når bedriften bruker eller har kjemikalier på arbeidsplassen, SKAL du ALLTID inkludere rutinen "Stoffkartotek og Kjemikaliehåndtering" (routine_number: 1290).
Dette gjelder for: Verksted, Industri, Bygg, Renhold, Bilpleie, Frisør, og alle andre som bruker rengjøringsmidler, maling, løsemidler, smøremidler, sveisegasser osv.

KRITISK - ANSVARLIGE ROLLER:
Når du genererer handlingsplan/tiltak, bruk KUN disse rollene som "responsible":
- "Daglig leder" (overordnet ansvar)
- "HMS-ansvarlig" (koordinerer HMS-arbeid)
- "Verneombud" (KUN hvis bedriften har 5+ ansatte eller har valgt å ha verneombud)
ALDRI bruk fiktive roller som "Brannvernleder", "Sikkerhetssjef", "Kvalitetsleder" etc. 
Disse rollene finnes ikke i organisasjonsstrukturen og skaper forvirring.

KRITISK - VERNEOMBUD ORGANISASJONSSTRUKTUR:
- Hvis bedriften har 5+ ansatte: ALLTID inkluder Verneombud-rollen i organization.roles
- Hvis bedriften har <5 ansatte OG velger fritak: IKKE inkluder Verneombud-rollen i organization.roles, og sett hasVerneombudFritak: true
- Hvis bedriften har <5 ansatte men VIL ha verneombud: Inkluder Verneombud-rollen`;

async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      return true;
    }
    
    return data === true;
  } catch (err) {
    console.error("Rate limit error:", err);
    return true;
  }
}

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t === "ja" ||
    t === "japp" ||
    t === "jepp" ||
    t === "yes" ||
    t === "yep" ||
    t === "ok" ||
    t === "okei" ||
    t === "oki" ||
    t === "jada" ||
    t === "joda" ||
    t === "jo" ||
    t === "mhm" ||
    t === "mm" ||
    t.includes("stemmer")
  );
}

function extractEmployeeCountFromAssistant(content: string): number | null {
  // Matches the Brreg confirmation message in the UI
  const m = content.match(/\*\*Ansatte:\*\*\s*(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function buildKnownFactsMessage(messages: ChatMsg[] | undefined): string | null {
  if (!messages?.length) return null;

  const lines: string[] = [];
  lines.push("===== KONTEKST FRA SAMTALEN =====");
  lines.push("KRITISK: Bruk denne informasjonen aktivt. ALDRI spør om noe som allerede er besvart!");
  lines.push("");

  // 1) Extract industry/bransje
  let confirmedIndustry: string | null = null;
  const industryKeywords = ["kontor", "bygg", "anlegg", "industri", "produksjon", "frisør", "butikk", "restaurant", "transport", "renhold", "bilpleie", "verksted", "tømrer", "rørlegger", "elektriker", "murer", "maling", "snekker"];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      const text = msg.content.toLowerCase();
      // Check for number selection (1-9)
      const numMatch = text.match(/^[1-9]$/);
      if (numMatch) {
        // Look for prior assistant message with industry list
        for (let j = i - 1; j >= 0; j--) {
          if (messages[j].role === "assistant" && messages[j].content.includes("bransje")) {
            const industryMap: Record<string, string> = {
              '1': 'Kontor/Administrasjon', '2': 'Bygg og anlegg', '3': 'Industri/Produksjon',
              '4': 'Frisør/Skjønnhetspleie', '5': 'Butikk/Detaljhandel', '6': 'Restaurant/Spisested',
              '7': 'Transport', '8': 'Renhold', '9': 'Bilpleie'
            };
            confirmedIndustry = industryMap[numMatch[0]] || null;
            break;
          }
        }
      }
      // Check for keyword match
      for (const kw of industryKeywords) {
        if (text.includes(kw)) {
          confirmedIndustry = kw;
          break;
        }
      }
    }
  }

  // 2) Employee count from Brreg message
  let lastBrregEmployees: number | null = null;
  let brregConfirmed = false;
  let companyName: string | null = null;
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "assistant") {
      // Extract employee count
      const empMatch = msg.content.match(/\*\*Ansatte:\*\*\s*(\d+)/i);
      if (empMatch) {
        lastBrregEmployees = Number(empMatch[1]);
      }
      // Extract company name
      const nameMatch = msg.content.match(/\*\*Firmanavn:\*\*\s*([^\n]+)/i);
      if (nameMatch) {
        companyName = nameMatch[1].trim();
      }
      // Check for user confirmation
      if ((empMatch || nameMatch) && i + 1 < messages.length && messages[i + 1].role === "user") {
        if (isAffirmative(messages[i + 1].content)) {
          brregConfirmed = true;
        }
      }
    }
  }

  // 3) Track all user confirmations to proposals
  let goalsConfirmed = false;
  let risksConfirmed = false;
  let routinesConfirmed = false;
  let confirmedGoals: string[] = [];
  let confirmedRisks: string[] = [];
  let confirmedRoutines: string[] = [];
  
  for (let i = 0; i < messages.length - 1; i++) {
    const a = messages[i];
    const u = messages[i + 1];
    if (a.role !== "assistant" || u.role !== "user") continue;
    
    const aLower = a.content.toLowerCase();
    const uLower = u.content.toLowerCase();
    const userConfirms = isAffirmative(u.content) || uLower.includes("stemmer") || uLower.includes("ok") || uLower.includes("fint") || uLower.includes("bra");
    
    // Check for goals confirmation
    if ((aLower.includes("hms-mål") || aLower.includes("mål:") || aLower.includes("målene")) && userConfirms) {
      goalsConfirmed = true;
      // Extract goals from assistant message
      const goalMatches = a.content.match(/\d+\.\s*([^\n]+)/g);
      if (goalMatches) {
        confirmedGoals = goalMatches.map(g => g.replace(/^\d+\.\s*/, '').trim());
      }
    }
    
    // Check for risks confirmation  
    if ((aLower.includes("risiko") || aLower.includes("farekild") || aLower.includes("tiltak")) && userConfirms) {
      risksConfirmed = true;
      const riskMatches = a.content.match(/\d+\.\s*([^\n→]+)/g);
      if (riskMatches) {
        confirmedRisks = riskMatches.map(r => r.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
      }
    }
    
    // Check for routines confirmation
    if ((aLower.includes("rutine") || aLower.includes("rutinene")) && userConfirms) {
      routinesConfirmed = true;
      const routineMatches = a.content.match(/\d+\.\s*([^\n(]+)/g);
      if (routineMatches) {
        confirmedRoutines = routineMatches.map(r => r.replace(/^\d+\.\s*/, '').trim()).slice(0, 10);
      }
    }
  }

  // Build context summary
  if (confirmedIndustry) {
    lines.push(`✅ BRANSJE: ${confirmedIndustry} (BEKREFTET - ikke spør igjen)`);
  }
  
  if (companyName && brregConfirmed) {
    lines.push(`✅ FIRMA: ${companyName} (BEKREFTET)`);
  }
  
  if (lastBrregEmployees !== null && brregConfirmed) {
    lines.push(`✅ ANSATTE: ${lastBrregEmployees} (BEKREFTET - bruk for verneombuds-logikk)`);
  }
  
  if (goalsConfirmed) {
    lines.push(`✅ HMS-MÅL: BEKREFTET - ikke spør igjen!`);
    if (confirmedGoals.length > 0) {
      lines.push(`   Bekreftede mål: ${confirmedGoals.slice(0, 3).join(", ")}`);
    }
  }
  
  if (risksConfirmed) {
    lines.push(`✅ RISIKOER/TILTAK: BEKREFTET - ikke spør igjen!`);
    if (confirmedRisks.length > 0) {
      lines.push(`   Bekreftede risikoer: ${confirmedRisks.slice(0, 3).join(", ")}`);
    }
  }
  
  if (routinesConfirmed) {
    lines.push(`✅ RUTINER: BEKREFTET - gå til avslutning og generer JSON!`);
    if (confirmedRoutines.length > 0) {
      lines.push(`   Bekreftede rutiner: ${confirmedRoutines.slice(0, 5).join(", ")}`);
    }
  }

  // Determine current step
  lines.push("");
  lines.push("===== NESTE STEG =====");
  
  if (!confirmedIndustry) {
    lines.push("→ STEG 1: Trenger bransjevalg");
  } else if (!goalsConfirmed && !risksConfirmed) {
    lines.push("→ STEG 2: GENERER PROAKTIVT forslag til mål + risikoer + tiltak basert på bransjen");
    lines.push("  VIKTIG: Ikke spør 'hva ønsker du?' - FORESLÅ konkrete verdier!");
  } else if (!routinesConfirmed) {
    lines.push("→ STEG 3: GENERER PROAKTIVT forslag til rutiner basert på bransjen");
  } else {
    lines.push("→ STEG 4: ALT ER BEKREFTET - generer JSON NÅ!");
  }
  
  lines.push("");
  lines.push("KRITISK PÅMINNELSE:");
  lines.push("- Hvis bruker sier 'ja', 'ok', 'stemmer', 'fint', 'bra', '1 og 2' osv → GODTA og GÅ VIDERE!");
  lines.push("- ALDRI still samme spørsmål to ganger!");
  lines.push("- Vær PROAKTIV - foreslå konkrete verdier basert på bransjen!");

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lookupOrgNumber } = await req.json();
    
    // Handle Brreg lookup request (no rate limit for this)
    if (lookupOrgNumber) {
      console.log("Looking up org number:", lookupOrgNumber);
      const brregInfo = await fetchBrregInfo(lookupOrgNumber);
      
      if (brregInfo) {
        return new Response(JSON.stringify({ 
          success: true, 
          data: brregInfo 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Fant ikke bedriften i Brønnøysundregistrene" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autentisering kreves" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Ugyldig token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const isAllowed = await checkRateLimit(supabase, user.id, 'ik-hms-chat');
    if (!isAllowed) {
      console.log(`Rate limit exceeded for user ${user.id} on ik-hms-chat`);
      return new Response(JSON.stringify({ 
        error: "Du har sendt for mange forespørsler. Vennligst vent et minutt og prøv igjen." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`User ${user.id} making ik-hms-chat request, messages: ${messages?.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(buildKnownFactsMessage(messages) ? [{ role: "system", content: buildKnownFactsMessage(messages)! }] : []),
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt og prøv igjen." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditter oppbrukt. Kontakt administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidig utilgjengelig." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    console.error("Error in ik-hms-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
