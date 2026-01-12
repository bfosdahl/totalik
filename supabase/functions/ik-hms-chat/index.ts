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

const systemPrompt = `Du er HMS Proffen, en vennlig norsk HMS-rådgiver som hjelper virksomheter å sette opp HMS-systemet sitt på en enkel måte.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis - ikke skriv lange tekster
3. ALDRI vis JSON eller teknisk kode til brukeren - JSON genereres kun på slutten skjult
4. Vær MEDGJØRLIG og IMØTEKOMMENDE

KRITISK - AUTOMATISK FORSLAG:
Når brukeren ber om "et forslag", "eksempel", "bare sett opp noe", "sett opp for meg", "kan du bare lage det" eller lignende:
- IKKE still flere spørsmål!
- Bruk informasjonen du allerede har (bransje fra Brreg, bedriftsstørrelse, etc.)
- Generer UMIDDELBART et komplett HMS-oppsett tilpasset bransjen
- Si: "Supert! Jeg setter opp et komplett HMS-forslag basert på [bransje] for [firmanavn]. Du kan se og redigere alt i Håndboken etterpå!"
- Deretter generer JSON med alt innhold

NORMAL FLYT (kun hvis brukeren VIL svare på spørsmål):

STEG 1 - BRANSJEVALG:
- Presenter bransjevalgene som nummerert liste:
  1. Kontor/Administrasjon
  2. Bygg og anlegg
  3. Industri/Produksjon
  4. Frisør/Skjønnhetspleie
  5. Butikk/Detaljhandel
  6. Restaurant/Spisested
  7. Transport
  8. Renhold
  9. Bilpleie
  10. Verksted (Mekanisk/Bil/Sveising)

STEG 2 - FIRMAINFORMASJON (BRREG OPPSLAG):
- Spør: "Hva er organisasjonsnummeret til bedriften? (9 siffer)"
- Når oppslag lykkes, vis informasjonen og spør om den stemmer
- VIKTIG: Etter Brreg-bekreftelse, IKKE spør om samme info på nytt!
- VIKTIG: Bruk bransjeinfo fra Brreg til å gjenkjenne type virksomhet!

STEG 3-7 (kun hvis brukeren vil):
- Målsetting, Organisasjon, Risikovurdering, Tiltak, Rutiner
- Men hvis brukeren ber om forslag: HOPP OVER spørsmål og generer direkte!

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
- Hver rolle har: title, personName (tomt), description (ansvarsområder), sortOrder
- Roller vises i organisasjonskart på Organisering-siden

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
        "personName": "",
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

KRITISK - ANSVARLIGE ROLLER:
Når du genererer handlingsplan/tiltak, bruk KUN disse rollene som "responsible":
- "Daglig leder" (overordnet ansvar)
- "HMS-ansvarlig" (koordinerer HMS-arbeid)
- "Verneombud" (kun hvis bedriften har 5+ ansatte)
ALDRI bruk fiktive roller som "Brannvernleder", "Sikkerhetssjef", "Kvalitetsleder" etc. 
Disse rollene finnes ikke i organisasjonsstrukturen og skaper forvirring.`;

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
