import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TranslationRequest {
  targetLanguage: string;
  content: {
    goals?: string[];
    organizationDescription?: string;
    organizationRoles?: { title: string; personName: string; description: string }[];
    risks?: { description: string; existing_measures: string; planned_measures: string }[];
    actions?: { action_description: string; risk_description: string; responsible: string; deadline: string; status: string }[];
    routines?: { routine_name: string; purpose: string; responsibility: string; procedure: string }[];
  };
}

const languageNames: Record<string, string> = {
  pl: "Polish",
  lt: "Lithuanian", 
  en: "English",
  no: "Norwegian",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetLanguage, content }: TranslationRequest = await req.json();
    
    console.log("Translation request received:", { targetLanguage, contentKeys: Object.keys(content || {}) });
    
    if (!targetLanguage || targetLanguage === "no") {
      return new Response(JSON.stringify({ translatedContent: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    
    // Build content string for translation
    const contentToTranslate = JSON.stringify(content, null, 2);
    console.log("Content to translate length:", contentToTranslate.length);
    
    const systemPrompt = `You are a professional translator specializing in workplace safety (HMS/HSE) documentation.
Translate the following JSON content from Norwegian to ${targetLangName}.

IMPORTANT RULES:
1. Translate ALL text values in the JSON, but keep the JSON structure and keys exactly the same
2. Keep proper names (company names, personal names) unchanged
3. Translate technical HMS/HSE terms appropriately for the target language
4. Maintain professional, formal language suitable for official documentation
5. Return ONLY valid JSON - no explanations, no markdown code blocks, just the raw translated JSON object

The content is from an Internal Control (HMS) Handbook containing:
- Goals (mål) - workplace safety objectives
- Organization - roles and responsibilities
- Risk assessments - hazards, events, and control measures
- Action plans - improvement actions
- Routines - standard operating procedures`;

    console.log("Calling AI gateway...");
    
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
          { role: "user", content: contentToTranslate }
        ],
        temperature: 0.3,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentPreview: data.choices?.[0]?.message?.content?.substring(0, 100)
    }));
    
    const translatedText = data.choices?.[0]?.message?.content;
    
    if (!translatedText) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No translation received from AI");
    }

    // Parse the translated JSON
    let translatedContent;
    try {
      // Clean up potential markdown code blocks
      let cleanJson = translatedText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.slice(7);
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, -3);
      }
      translatedContent = JSON.parse(cleanJson.trim());
      console.log("Successfully parsed translated content");
    } catch (parseError) {
      console.error("Failed to parse translated JSON:", parseError);
      console.error("Raw translated text:", translatedText);
      throw new Error("Failed to parse translated content");
    }

    return new Response(JSON.stringify({ translatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
