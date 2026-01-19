import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du er en ekspert på å ekstrahere strukturert HMS-informasjon fra kunde-dokumenter.

OPPGAVE:
Parse det vedlagte dokumentet og ekstraher følgende informasjon i JSON-format.

OUTPUT FORMAT (JSON):
{
  "firmanavn": "Bedriftens navn",
  "epost": "Kontakt e-post",
  "kontaktperson": "Navn på kontaktperson",
  "telefon": "Telefonnummer hvis oppgitt",
  "organisasjonsnummer": "9-sifret org.nr hvis funnet",
  "farekilder": ["Liste med farekilder/risikoer"],
  "hmsmal": ["Hva ønsker de å oppnå med HMS-arbeidet"],
  "kursOgOpplaering": {
    "harRutiner": true/false,
    "beskrivelse": "Beskrivelse av kurs/opplæring"
  },
  "organisasjon": {
    "dagligLeder": "Navn på daglig leder",
    "verneombud": "Navn på verneombud",
    "andreRoller": [{"rolle": "Rolle", "navn": "Navn"}]
  },
  "avvikssystem": {
    "harEgetSystem": true/false,
    "beskrivelse": "Hvordan de håndterer avvik"
  },
  "bransje": "Antatt bransje basert på innholdet",
  "tilleggsinformasjon": "Annen relevant info som ikke passer i andre felt"
}

VIKTIG:
- Returner KUN gyldig JSON, ingen annen tekst
- Hvis et felt ikke finnes i dokumentet, sett det til null eller tom array
- Vær nøyaktig med navn og stavemåter
- Gjett bransje basert på farekilder og virksomhetstype`;

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

    // Verify user is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is system admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'system_admin');

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Not authorized. System admin access required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pdfBase64, fileName, textContent } = await req.json();

    if (!pdfBase64 && !textContent) {
      return new Response(JSON.stringify({ error: 'Either pdfBase64 or textContent is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build messages based on input type
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (pdfBase64) {
      // Determine MIME type
      let mimeType = 'application/pdf';
      if (fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      }

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Ekstraher HMS-informasjon fra dette dokumentet (${fileName || 'dokument'}):`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${pdfBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Ekstraher HMS-informasjon fra denne teksten:\n\n${textContent}`
      });
    }

    console.log('Calling AI to parse customer document...');

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
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Kreditt oppbrukt. Kontakt administrator.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI-tjenesten feilet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Ingen respons fra AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the JSON from AI response
    let extractedData;
    try {
      // Try to extract JSON from the response
      let jsonStr = content;
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return new Response(JSON.stringify({ 
        error: 'Kunne ikke parse AI-respons',
        rawContent: content 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully parsed customer document');

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-customer-pdf:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
