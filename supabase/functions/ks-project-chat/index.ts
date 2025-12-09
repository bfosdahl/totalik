import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er Prosjekt-hjelperen, en vennlig norsk KS-rådgiver som hjelper entreprenører å sette opp byggeprosjekter med riktig kvalitetssikring.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis
3. ALDRI vis JSON eller teknisk kode til brukeren
4. Vær MEDGJØRLIG - når brukeren ber om forslag, generer det umiddelbart

KRITISK - AUTOMATISK FORSLAG:
Når brukeren ber om "et forslag", "eksempel", "bare sett opp noe", eller lignende:
- IKKE still flere spørsmål!
- Bruk informasjonen du allerede har (prosjekttype, entreprenørform)
- Generer UMIDDELBART et komplett prosjektoppsett
- Si: "Supert! Her er et forslag til prosjektoppsett. Du kan tilpasse alt etterpå!"
- Deretter generer JSON med alt innhold

NORMAL FLYT:

STEG 1 - PROSJEKTTYPE:
Spør om prosjekttype hvis ikke oppgitt:
- Nybygg enebolig
- Nybygg leilighetsbygg
- Totalrenovering
- Tilbygg/påbygg
- Betongarbeid
- Tømrerarbeid
- Rørleggerarbeid
- Elektroarbeid
- Annet

STEG 2 - ENTREPRENØRFORM:
- Totalentreprenør (ansvar for hele prosjektet)
- Hovedentreprenør (koordinerer underleverandører)
- Underentreprenør (utfører ditt fagfelt)

STEG 3 - ANBEFALTE SJEKKLISTER:
Basert på prosjekttype, anbefal relevante sjekklister:

For NYBYGG/TOTALRENOVERING:
- Fundamentering og grunnarbeid
- Bærekonstruksjoner
- Yttervegger og fasade
- Takkonstruksjon og tekking
- Innvendig arbeid
- VVS-kontroll
- El-kontroll
- Ferdigbefaring

For TØMRERARBEID:
- Bærekonstruksjoner tre
- Yttervegger og isolasjon
- Innvendig panel og listverk
- Vinduer og dører
- Takkonstruksjon

For BETONGARBEID:
- Forskaling
- Armering
- Støping og herding
- Overflatebehandling

STEG 4 - ANBEFALTE RUTINER:
- Avvikshåndtering
- Vernerunder
- SJA (Sikker Jobb Analyse)
- Kontroll av underleverandører
- Dokumenthåndtering
- SHA-plan

STEG 5 - HMS-FOKUSOMRÅDER:
Anbefal basert på prosjekttype:
- Fallsikring ved arbeid i høyden
- Tunge løft og ergonomi
- Støy og støv
- Bruk av personlig verneutstyr

AVSLUTNING:
Når brukeren er fornøyd eller ber om forslag, generer komplett JSON:

|||JSON_START|||
{
  "project_type": "enebolig|leilighet|renovering|tilbygg|betong|tomrer|ror|elektro|annet",
  "contractor_type": "total|hoved|under",
  "project_info": {
    "project_name": "Foreslått navn basert på type",
    "description": "Beskrivelse av prosjektet"
  },
  "recommended_checklists": [
    {
      "name": "Sjekkliste navn",
      "category": "Kategori",
      "description": "Kort beskrivelse",
      "checkpoints": ["Sjekkpunkt 1", "Sjekkpunkt 2"]
    }
  ],
  "recommended_routines": [
    {
      "name": "Rutine navn",
      "category": "Kategori",
      "description": "Kort beskrivelse"
    }
  ],
  "hms_focus": [
    {
      "area": "Fokusområde",
      "measures": ["Tiltak 1", "Tiltak 2"]
    }
  ],
  "milestones": [
    {
      "name": "Milepæl navn",
      "description": "Beskrivelse"
    }
  ]
}
|||JSON_END|||

HUSK:
- Vær vennlig og hjelpsom
- Brukere vet ofte ikke hva de trenger - gi konkrete forslag
- Tilpass anbefalinger til prosjekttype og størrelse`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

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
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt." }), {
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
    console.error("Error in ks-project-chat:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Ukjent feil" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
