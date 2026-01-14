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
      console.error("No image provided in request");
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling Lovable AI for image analysis...");
    console.log("Image base64 length:", imageBase64.length);

    // Use Lovable AI to analyze the shipping label image - using gemini-2.5-pro for better image understanding
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Du er en ekspert på å lese frakteetiketter og produktetiketter for matvarer i Norge.
            
Din oppgave er å analysere bildet og trekke ut følgende informasjon hvis tilgjengelig:
- Batch-nummer / Partinummer / LOT-nummer (ofte merket med "LOT", "Batch", "Parti" eller liknende)
- GTIN / EAN / Strekkode (13 eller 14 siffer, ofte under strekkoden)
- Produktnavn (hovednavnet på produktet)
- Holdbarhetsdato / Best før / Siste forbruksdag
- Produksjonsdato

Se nøye på hele bildet. Strekkoder har ofte tall under seg som er GTIN/EAN.
Datoer kan være i format DD.MM.YYYY, DD/MM/YY, DDMMYY, YYMMDD, etc.

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
                text: "Analyser denne frakteetiketten/produktetiketten og trekk ut relevant informasjon. Se spesielt etter batch-nummer, GTIN/strekkode, produktnavn og datoer."
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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error response:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange forespørsler. Prøv igjen om litt." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kreditter oppbrukt. Kontakt administrator." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response content:", content);
    
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
        console.log("Successfully extracted data:", extracted);
      } else {
        console.warn("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content was:", content);
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
