import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Du er en ekspert på å ekstrahere strukturert IK/MAT-informasjon (matsikkerhet / internkontroll mat) fra norske håndbøker, kvalitetspermer eller HACCP-dokumentasjon.

OPPGAVE:
Parse den vedlagte håndboken og ekstraher ALL matsikkerhets-informasjon i følgende JSON-format. IK/MAT bygger på Matloven, IK-Mat-forskriften og HACCP-prinsippene.

OUTPUT FORMAT (JSON):
{
  "companyInfo": {
    "firmanavn": "Bedriftens navn",
    "organisasjonsnummer": "9-sifret org.nr",
    "virksomhetstype": "restaurant|kafe|catering|bakeri|butikk|barnehage|produksjon|annet",
    "beskrivelse": "Kort beskrivelse av virksomheten og menytype/produkter"
  },

  "organization": {
    "roles": [
      { "title": "Daglig leder", "name": "Navn", "responsibilities": "Ansvarsområde" },
      { "title": "Kjøkkenansvarlig", "name": "Navn", "responsibilities": "..." },
      { "title": "HACCP-ansvarlig", "name": "Navn", "responsibilities": "..." }
    ]
  },

  "goals": [
    "Målsetting 1 (f.eks. null tilfeller av matforgiftning)",
    "Målsetting 2"
  ],

  "risks": [
    {
      "hazard": "Farekilde (f.eks. Salmonella i kylling)",
      "consequence": "1-5",
      "probability": "1-5",
      "riskLevel": "lav|medium|høy",
      "measures": "Eksisterende og planlagte tiltak"
    }
  ],

  "haccp": [
    {
      "step": "Prosesstrinn (f.eks. Mottak råvarer)",
      "hazard": "Biologisk/kjemisk/fysisk farekilde",
      "criticalLimit": "Kritisk grense (f.eks. <4°C)",
      "monitoring": "Hvordan overvåkes",
      "correctiveAction": "Korrigerende tiltak ved avvik",
      "responsible": "Ansvarlig rolle"
    }
  ],

  "routines": [
    {
      "name": "Rutine-navn",
      "category": "renhold|temperatur|sporbarhet|allergener|personlig_hygiene|mottak|haccp|annet",
      "description": "Detaljert beskrivelse av rutinen",
      "frequency": "daglig|ukentlig|månedlig|årlig|ved_behov",
      "responsible": "Ansvarlig rolle"
    }
  ],

  "cleaningPlan": [
    {
      "area": "Område (f.eks. Kjølerom)",
      "frequency": "daglig|ukentlig|månedlig",
      "method": "Metode/middel",
      "responsible": "Ansvarlig"
    }
  ],

  "controlPoints": [
    {
      "name": "Kontrollpunkt (f.eks. Temperaturkontroll kjøl)",
      "frequency": "Hvor ofte",
      "limit": "Akseptkriterium",
      "responsible": "Ansvarlig"
    }
  ],

  "deviations": [
    {
      "tittel": "Kort beskrivelse av avviket",
      "beskrivelse": "Detaljert beskrivelse",
      "kategori": "hygiene|temperature|procedure|equipment|other",
      "prioritet": "lav|medium|høy|kritisk",
      "status": "open|in-progress|resolved|closed",
      "dato": "YYYY-MM-DD (originaldato fra håndboken)",
      "korrigerendeTiltak": "Hva ble gjort",
      "forebyggendeTiltak": "Hva gjøres for å forhindre gjentakelse"
    }
  ],

  "tilleggsinformasjon": "Annen relevant info (allergenhåndtering, sporbarhet, leverandører, lovhenvisninger)"
}

VIKTIG:
- Returner KUN gyldig JSON, ingen annen tekst eller markdown
- Bevar originale datoer for avvik — kritisk for historisk sporbarhet
- Hvis et felt ikke finnes, sett til null eller tom array
- Rutinekategorier MÅ matche de oppgitte verdiene
- Konsekvens/sannsynlighet er 1-5 skala (returner som streng)
- Fokuser KUN på matsikkerhet — ignorer HMS/HR-innhold`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileBase64, fileName, textContent } = await req.json();

    if (!fileBase64 && !textContent) {
      return new Response(
        JSON.stringify({ error: "fileBase64 eller textContent er påkrevd" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI-tjeneste ikke konfigurert" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (fileBase64) {
      let mimeType = "application/pdf";
      if (fileName) {
        const ext = fileName.toLowerCase().split(".").pop();
        if (ext === "png") mimeType = "image/png";
        else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
        else if (ext === "webp") mimeType = "image/webp";
        else if (ext === "docx") {
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
      }

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Ekstraher ALL IK/MAT-informasjon fra denne håndboken (${
                fileName || "dokument"
              }). Inkluder alle historiske avvik med originale datoer:`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${fileBase64}` },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content:
          `Ekstraher ALL IK/MAT-informasjon fra denne håndboken. Inkluder alle historiske avvik med originale datoer:\n\n${textContent}`,
      });
    }

    console.log("Parsing IK/MAT handbook with AI...");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "For mange forespørsler. Vent litt og prøv igjen.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kreditt oppbrukt. Kontakt administrator." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ error: "AI-tjenesten feilet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Ingen respons fra AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extractedData;
    const tryParse = (s: string) => {
      try { return JSON.parse(s); } catch { return null; }
    };
    const repairJson = (s: string): string => {
      // Repair common AI mistakes:
      // 1) Array opened with `[` but closed with `}` — replace stray `},` after a list of strings/objects with `],`
      // 2) Trailing commas before } or ]
      let out = s
        // remove trailing commas
        .replace(/,(\s*[}\]])/g, "$1");
      // Heuristic: scan and balance brackets — convert misplaced `}` to `]` when an array is open
      const stack: string[] = [];
      const chars = out.split("");
      let inStr = false;
      let esc = false;
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (c === "\\") { esc = true; continue; }
          if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === "{" || c === "[") stack.push(c);
        else if (c === "}") {
          const top = stack[stack.length - 1];
          if (top === "[") { chars[i] = "]"; stack.pop(); }
          else stack.pop();
        } else if (c === "]") {
          const top = stack[stack.length - 1];
          if (top === "{") { chars[i] = "}"; stack.pop(); }
          else stack.pop();
        }
      }
      return chars.join("");
    };

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    extractedData = tryParse(jsonStr);
    if (!extractedData) {
      const repaired = repairJson(jsonStr);
      extractedData = tryParse(repaired);
      if (extractedData) {
        console.log("Recovered AI response via JSON repair");
      }
    }

    if (!extractedData) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({
          error: "Kunne ikke parse AI-respons. Prøv igjen, eller last opp et mindre dokument.",
          rawContent: content?.slice(0, 2000),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Successfully parsed IK/MAT handbook");

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in parse-ik-mat-handbook:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
