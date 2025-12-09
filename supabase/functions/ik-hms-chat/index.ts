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

const systemPrompt = `Du er Oppsett-hjelperen, en vennlig norsk HMS-rådgiver som hjelper virksomheter å sette opp HMS-systemet sitt på en enkel måte.

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

STEG 2 - FIRMAINFORMASJON (BRREG OPPSLAG):
- Spør: "Hva er organisasjonsnummeret til bedriften? (9 siffer)"
- Når oppslag lykkes, vis informasjonen og spør om den stemmer
- VIKTIG: Etter Brreg-bekreftelse, IKKE spør om samme info på nytt!

STEG 3-7 (kun hvis brukeren vil):
- Målsetting, Organisasjon, Risikovurdering, Tiltak, Rutiner
- Men hvis brukeren ber om forslag: HOPP OVER spørsmål og generer direkte!

BRANSJESPESIFIKKE TILPASNINGER:
- Kontor/Administrasjon: ergonomi, skjermarbeid, psykososialt arbeidsmiljø, inneklima
- Bygg og anlegg: fallsikring, tunge løft, arbeid i høyden, maskinsikkerhet, støy, støv, SJA, vernerunder
- Industri/Produksjon: maskinsikkerhet, kjemikalier, støy, ergonomi, verneutstyr
- Frisør/Skjønnhetspleie: kjemikalier, hudkontakt, ergonomi, ventilasjon, allergier
- Butikk/Detaljhandel: løfteteknikk, ran/trusler, stående arbeid, kundeservice-stress
- Restaurant/Spisested: mattrygghet, varmt arbeid, sklisikring, kjøkkenutstyr, stress
- Transport: kjøre- og hviletid, trafikksikkerhet, lasting/lossing, ergonomi, alenearbeid
- Renhold: kjemikalier, ergonomi, tunge løft, sklisikring, smittefare, alenearbeid
- Bilpleie: kjemikalier, ventilasjon, ergonomi, sklisikring, maskinsikkerhet

AVSLUTNING - KRITISK:
Når brukeren bekrefter rutinene eller sier de er ferdige:
1. Si: "Supert! Vi setter nå opp HMS-systemet basert på informasjonen du har gitt. Du kan se forslaget i Håndboken om kort tid. Ønsker du å gjøre endringer senere, er det bare å starte Oppsett-hjelperen på nytt!"
2. UMIDDELBART ETTER denne meldingen MÅ du generere komplett JSON med ALLE data fra samtalen
3. JSON MÅ starte med eksakt tekst: |||JSON_START|||
4. JSON MÅ slutte med eksakt tekst: |||JSON_END|||

ABSOLUTT KRITISK:
- JSON MÅ ALLTID genereres når oppsettet er ferdig
- Du MÅ inkludere ALLE rutiner (8-10 stykk), ALLE risikoer, ALLE mål
- VIKTIG: Inkluder "industry" felt med valgt bransje!
- Uten JSON vil ingenting bli lagret - brukeren mister alt arbeidet
- JSON skal genereres på slutten av avsluttende melding, ikke i separate meldinger

JSON-STRUKTUR (brukeren ser IKKE dette):
|||JSON_START|||
{
  "industry": "kontor|bygg_anlegg|industri|frisor|butikk|restaurant|transport|renhold|bilpleie",
  "company": {
    "name": "Firmanavn",
    "address": "Adresse",
    "org_number": "Org.nr",
    "employees": 0,
    "type": "bransje"
  },
  "goals": ["Mål 1", "Mål 2", "Mål 3"],
  "organization": {
    "is_custom": false,
    "custom_content": "Organisasjonsbeskrivelse med roller og ansvar"
  },
  "risks": [
    {
      "id": "risk-1",
      "description": "Risikobeskrivelse",
      "probability": 3,
      "consequence": 3,
      "planned_measures": "Tiltak"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "description": "Tiltak",
      "responsible": "Ansvarlig",
      "deadline": "YYYY-MM-DD",
      "status": "pending",
      "priority": "medium",
      "linked_risk_ids": ["risk-1"]
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
- Generer ALLE rutinene som ble diskutert - ikke bare én!`;

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
