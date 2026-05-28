import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `Du er en ekspert på å ekstrahere strukturert HMS-informasjon fra norske HMS-håndbøker (Internkontrollhåndbøker).

OPPGAVE:
Parse den vedlagte håndboken og ekstraher ALL informasjon i følgende JSON-format. Håndbøker følger typisk IK-forskriften med kapitler for mål, organisering, risikovurdering, handlingsplan, rutiner og avvik.

OUTPUT FORMAT (JSON):
{
  "firmanavn": "Bedriftens navn",
  "organisasjonsnummer": "9-sifret org.nr",
  "kontaktperson": "Daglig leder eller kontaktperson",
  "epost": "E-postadresse",
  "telefon": "Telefonnummer",
  "bransje": "Bransje basert på innholdet",

  "hmsmal": [
    "Mål 1 fra håndboken",
    "Mål 2 fra håndboken"
  ],

  "organisasjon": {
    "dagligLeder": "Navn",
    "verneombud": "Navn",
    "andreRoller": [{"rolle": "HMS-ansvarlig", "navn": "Navn"}]
  },

  "farekilder": [
    {
      "beskrivelse": "Farekilde/risiko",
      "konsekvens": 1-5,
      "sannsynlighet": 1-5,
      "eksisterendeTiltak": "Tiltak som allerede er på plass",
      "planlagteTiltak": "Planlagte tiltak"
    }
  ],

  "handlingsplan": [
    {
      "risikobeskrivelse": "Knyttet risiko",
      "tiltaksbeskrivelse": "Hva skal gjøres",
      "ansvarlig": "Hvem er ansvarlig",
      "frist": "YYYY-MM-DD eller null",
      "status": "ikke_startet|pågår|fullført",
      "prioritet": "lav|medium|høy|kritisk"
    }
  ],

  "rutiner": [
    {
      "tittel": "Rutine-navn",
      "kategori": "hms|brann|kjemikalier|ergonomi|opplaering|avvik|foerstehjelp|verneutstyr|annet",
      "formaal": "Formålet med rutinen",
      "ansvar": "Hvem er ansvarlig",
      "prosedyre": "Detaljert beskrivelse av rutinen",
      "frekvens": "daglig|ukentlig|månedlig|årlig|ved_behov"
    }
  ],

  "avvik": [
    {
      "tittel": "Kort beskrivelse av avviket",
      "beskrivelse": "Detaljert beskrivelse",
      "kategori": "safety|equipment|environmental|procedure|other",
      "prioritet": "lav|medium|høy|kritisk",
      "status": "open|in-progress|resolved|closed",
      "rapportertAv": "Navn på rapportør",
      "ansvarlig": "Hvem skal utbedre",
      "dato": "YYYY-MM-DD (dato avviket ble registrert/rapportert)",
      "lukketDato": "YYYY-MM-DD eller null",
      "korrigerendeTiltak": "Hva ble gjort for å lukke avviket",
      "forebyggendeTiltak": "Tiltak for å forhindre gjentakelse"
    }
  ],

  "kursOgOpplaering": {
    "harRutiner": true/false,
    "beskrivelse": "Beskrivelse av opplæringsprogram"
  },

  "avvikssystem": {
    "harEgetSystem": true/false,
    "beskrivelse": "Hvordan de håndterer avvik"
  },

  "tilleggsinformasjon": "Annen relevant info som lovhenvisninger, vernerunder osv."
}

VIKTIG:
- Returner KUN gyldig JSON, ingen annen tekst
- Ekstraher ALLE avvik med korrekte datoer fra håndboken
- Bevar originale datoer - dette er viktig for historisk sporbarhet
- Hvis et felt ikke finnes, sett til null eller tom array
- Vær nøyaktig med navn og stavemåter
- Konsekvens og sannsynlighet er 1-5 skala
- Gjett bransje basert på farekilder og virksomhetstype
- Rutinekategorier skal matche de oppgitte verdiene`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileBase64, fileName, textContent } = await req.json();

    if (!fileBase64 && !textContent) {
      return new Response(JSON.stringify({ error: 'fileBase64 eller textContent er påkrevd' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI-tjeneste ikke konfigurert' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (fileBase64) {
      let mimeType = 'application/pdf';
      if (fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Ekstraher ALL HMS-informasjon fra denne håndboken (${fileName || 'dokument'}). Inkluder alle avvik med originale datoer:`
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${fileBase64}` }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Ekstraher ALL HMS-informasjon fra denne håndboken. Inkluder alle avvik med originale datoer:\n\n${textContent}`
      });
    }

    console.log('Parsing handbook with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'For mange forespørsler. Vent litt og prøv igjen.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Kreditt oppbrukt. Kontakt administrator.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI-tjenesten feilet' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Ingen respons fra AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let extractedData;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      extractedData = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'Kunne ikke parse AI-respons', rawContent: content }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully parsed handbook');

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-handbook:', error);
    return new Response(JSON.stringify({ error: 'En uventet feil oppstod' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
