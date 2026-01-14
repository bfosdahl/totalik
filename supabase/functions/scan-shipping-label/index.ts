import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Lovable AI to analyze the shipping label image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du er en ekspert på å lese frakteetiketter og produktetiketter for matvarer i Norge.
            
Din oppgave er å analysere bildet og trekke ut følgende informasjon hvis tilgjengelig:
- Batch-nummer / Partinummer / LOT-nummer
- GTIN / EAN / Strekkode (13 eller 14 siffer)
- Produktnavn
- Holdbarhetsdato (best før / siste forbruksdag)
- Produksjonsdato

VIKTIG: Returner ALLTID et gyldig JSON-objekt med følgende format:
{
  "batch_number": "verdi eller null",
  "gtin": "verdi eller null", 
  "product_name": "verdi eller null",
  "expiry_date": "YYYY-MM-DD eller null",
  "production_date": "YYYY-MM-DD eller null"
}

Konverter datoer til ISO-format (YYYY-MM-DD).
Hvis du ikke finner en verdi, sett den til null.
Svar KUN med JSON-objektet, ingen annen tekst.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyser denne frakteetiketten/produktetiketten og trekk ut relevant informasjon."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);
    
    // Parse the JSON response
    let extracted = {
      batch_number: null,
      gtin: null,
      product_name: null,
      expiry_date: null,
      production_date: null,
    };
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extracted = {
          batch_number: parsed.batch_number || null,
          gtin: parsed.gtin || null,
          product_name: parsed.product_name || null,
          expiry_date: parsed.expiry_date || null,
          production_date: parsed.production_date || null,
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
    }

    return new Response(
      JSON.stringify(extracted),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in scan-shipping-label:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
