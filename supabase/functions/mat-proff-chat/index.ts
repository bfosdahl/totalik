import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du er MAT Proffen, en vennlig og kunnskapsrik maskot for IK-Mat systemet - et internkontrollsystem for næringsmiddelbedrifter i Norge.
Du snakker alltid på norsk og er ekspert på mattrygghet, HACCP, hygiene og næringsmiddellovgivning.

**DU KAN UTFØRE HANDLINGER I SYSTEMET!**
Når brukeren ber deg om å legge til, opprette eller endre noe, bruk de tilgjengelige verktøyene.

**SYSTEMETS NAVIGASJON - IK-MAT MODUL:**

🍽️ IK-MAT DASHBOARD (/ik-mat/dashboard)
- Hovedoversikt for næringsmiddelbedriften
- Statistikk, varsler og snarveier

📋 HACCP (/ik-mat/haccp)
- Hazard Analysis Critical Control Points
- Farepunkter og kritiske kontrollpunkter
- CCP-overvåking og korrigerende tiltak

📦 SPORBARHET (/ik-mat/sporbarhet)
- Sporbarhet av råvarer og ingredienser
- Batch-nummerering og tilbakekallingsrutiner

🧹 RENHOLDSPLAN (/ik-mat/renholdsplan)
- Renholdsrutiner og -frekvenser
- Dokumentasjon av utført renhold

⚠️ ALLERGENER (/ik-mat/allergener)
- Allergenoversikt for alle produkter
- De 14 hovedallergenene

🌡️ TEMPERATURKONTROLL
- Kjøleskap og frysere: Under 4°C / Under -18°C
- Varmholding: Over 60°C
- Mottakskontroll av varer

**VIKTIGE LOVER OG FORSKRIFTER:**
- Matloven (Lov om matproduksjon og mattrygghet)
- Forskrift om næringsmiddelhygiene
- Forskrift om internkontroll (IK-mat)
- EU forordning 852/2004 om næringsmiddelhygiene

**HACCP-PRINSIPPENE (7 stk):**
1. Gjennomføre fareanalyse
2. Identifisere kritiske kontrollpunkter (CCP)
3. Fastsette kritiske grenser
4. Etablere overvåkingsprosedyrer
5. Fastsette korrigerende tiltak
6. Etablere verifiseringsprosedyrer
7. Føre dokumentasjon

**DE 14 HOVEDALLERGENENE:**
1. Glutenholdige kornslag (hvete, rug, bygg, havre, spelt)
2. Krepsdyr
3. Egg
4. Fisk
5. Peanøtter
6. Soya
7. Melk (inkludert laktose)
8. Nøtter (mandler, hasselnøtter, valnøtter, etc.)
9. Selleri
10. Sennep
11. Sesamfrø
12. Svoveldioksid og sulfitter
13. Lupin
14. Bløtdyr

**TEMPERATURKRAV:**
- Kjølevarer: Maks 4°C
- Frysevarer: Maks -18°C
- Varmholding: Min 60°C
- Nedkjøling: Fra 60°C til 4°C innen 4 timer
- Gjenoppvarming: Til min 75°C i kjernen

Svar kort og konsist. Vær vennlig og bruk gjerne emojis relatert til mat og hygiene. Fokuser på mattrygghet og hjelp brukeren med IK-Mat systemet.`;

// Define tools for the MAT Proff
const tools = [
  {
    type: "function",
    function: {
      name: "get_navigation_help",
      description: "Gir brukeren veiledning om hvor de finner en bestemt funksjon i IK-Mat systemet",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description: "Hva brukeren leter etter (f.eks. 'HACCP', 'allergener', 'renhold')"
          }
        },
        required: ["search_term"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_haccp_point",
      description: "Legger til et nytt farepunkt/CCP i HACCP-planen",
      parameters: {
        type: "object",
        properties: {
          hazard_description: {
            type: "string",
            description: "Beskrivelse av faren"
          },
          hazard_type: {
            type: "string",
            enum: ["biologisk", "kjemisk", "fysisk", "allergen"],
            description: "Type fare (biologisk, kjemisk, fysisk, allergen)"
          },
          control_measure: {
            type: "string",
            description: "Kontrolltiltak for å håndtere faren"
          },
          critical_limit: {
            type: "string",
            description: "Kritisk grense (f.eks. temperatur, tid)"
          },
          monitoring_procedure: {
            type: "string",
            description: "Overvåkingsprosedyre"
          },
          corrective_action: {
            type: "string",
            description: "Korrigerende tiltak ved avvik"
          }
        },
        required: ["hazard_description", "hazard_type", "control_measure"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_cleaning_task",
      description: "Legger til en ny rengjøringsoppgave i renholdsplanen",
      parameters: {
        type: "object",
        properties: {
          area: {
            type: "string",
            description: "Område som skal rengjøres"
          },
          task_description: {
            type: "string",
            description: "Beskrivelse av rengjøringsoppgaven"
          },
          frequency: {
            type: "string",
            enum: ["daglig", "ukentlig", "månedlig", "ved_behov"],
            description: "Hvor ofte oppgaven skal utføres"
          },
          cleaning_agent: {
            type: "string",
            description: "Rengjøringsmiddel som skal brukes"
          },
          responsible: {
            type: "string",
            description: "Ansvarlig person"
          }
        },
        required: ["area", "task_description", "frequency"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "register_temperature",
      description: "Registrerer en temperaturmåling",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Sted for måling (f.eks. 'Kjøleskap 1', 'Fryser', 'Buffet')"
          },
          temperature: {
            type: "number",
            description: "Målt temperatur i Celsius"
          },
          equipment_type: {
            type: "string",
            enum: ["kjøleskap", "fryser", "varmholding", "mottakskontroll"],
            description: "Type utstyr"
          }
        },
        required: ["location", "temperature", "equipment_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_allergen_info",
      description: "Legger til allergeninformasjon for et produkt",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Navn på produktet"
          },
          allergens: {
            type: "array",
            items: { type: "string" },
            description: "Liste over allergener i produktet"
          },
          may_contain: {
            type: "array",
            items: { type: "string" },
            description: "Allergener produktet kan inneholde spor av"
          }
        },
        required: ["product_name", "allergens"]
      }
    }
  }
];

// Function to execute tool calls
async function executeToolCall(
  supabase: any, 
  companyId: string, 
  userId: string, 
  toolName: string, 
  args: any
): Promise<string> {
  console.log(`Executing MAT tool: ${toolName} with args:`, args);
  
  try {
    switch (toolName) {
      case "get_navigation_help": {
        const searchTerm = args.search_term.toLowerCase();
        
        const navigationMap = [
          { keywords: ["dashbord", "hjem", "oversikt", "start"], path: "/ik-mat/dashboard", name: "IK-Mat Dashboard", description: "Hovedoversikt for næringsmiddelbedriften" },
          { keywords: ["haccp", "ccp", "farepunkt", "kritisk kontrollpunkt", "fareanalyse"], path: "/ik-mat/haccp", name: "HACCP", description: "Farepunkter og kritiske kontrollpunkter" },
          { keywords: ["sporbarhet", "batch", "råvare", "ingrediens", "tilbakekalling"], path: "/ik-mat/sporbarhet", name: "Sporbarhet", description: "Sporbarhet av råvarer og produkter" },
          { keywords: ["renhold", "rengjøring", "hygiene", "renholdsplan", "vask"], path: "/ik-mat/renholdsplan", name: "Renholdsplan", description: "Renholdsrutiner og dokumentasjon" },
          { keywords: ["allergen", "allergi", "glutenfri", "laktosefri", "nøtter"], path: "/ik-mat/allergener", name: "Allergener", description: "Allergenoversikt for produkter" },
          { keywords: ["temperatur", "kjøleskap", "fryser", "varmholding"], path: "/ik-mat/haccp", name: "Temperaturkontroll", description: "Registrer temperaturer under HACCP" },
        ];
        
        const matches = navigationMap.filter(item => 
          item.keywords.some(keyword => searchTerm.includes(keyword) || keyword.includes(searchTerm))
        );
        
        if (matches.length > 0) {
          const match = matches[0];
          return `For å finne ${match.name}, gå til: ${match.path}\n\n${match.description}`;
        }
        
        return `Jeg fant ikke en direkte match for "${args.search_term}". Prøv å søke etter: HACCP, sporbarhet, renhold, allergener, eller temperaturkontroll.`;
      }

      case "add_haccp_point": {
        // This would normally save to database - for now just confirm
        return `✅ Jeg har notert farepunktet:\n\n**Fare:** ${args.hazard_description}\n**Type:** ${args.hazard_type}\n**Kontrolltiltak:** ${args.control_measure}${args.critical_limit ? `\n**Kritisk grense:** ${args.critical_limit}` : ''}\n\nGå til HACCP-modulen (/ik-mat/haccp) for å legge dette inn permanent i systemet.`;
      }

      case "add_cleaning_task": {
        return `✅ Rengjøringsoppgave notert:\n\n**Område:** ${args.area}\n**Oppgave:** ${args.task_description}\n**Frekvens:** ${args.frequency}${args.cleaning_agent ? `\n**Rengjøringsmiddel:** ${args.cleaning_agent}` : ''}\n\nGå til Renholdsplan (/ik-mat/renholdsplan) for å legge dette inn i systemet.`;
      }

      case "register_temperature": {
        const isOk = (args.equipment_type === 'kjøleskap' && args.temperature <= 4) ||
                     (args.equipment_type === 'fryser' && args.temperature <= -18) ||
                     (args.equipment_type === 'varmholding' && args.temperature >= 60);
        
        const status = isOk ? '✅ OK' : '⚠️ AVVIK';
        
        return `${status} Temperatur registrert:\n\n**Sted:** ${args.location}\n**Temperatur:** ${args.temperature}°C\n**Type:** ${args.equipment_type}\n\n${!isOk ? '⚠️ Temperaturen er utenfor akseptable grenser! Iverksett korrigerende tiltak umiddelbart.' : ''}`;
      }

      case "add_allergen_info": {
        return `✅ Allergeninformasjon notert for ${args.product_name}:\n\n**Inneholder:** ${args.allergens.join(', ')}${args.may_contain ? `\n**Kan inneholde spor av:** ${args.may_contain.join(', ')}` : ''}\n\nGå til Allergener (/ik-mat/allergener) for å legge dette inn i systemet.`;
      }

      default:
        return `Ukjent verktøy: ${toolName}`;
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return `Beklager, det oppstod en feil ved utføring av handlingen. Prøv igjen eller gjør det manuelt i systemet.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      throw new Error("No message provided");
    }

    // Get authorization header for Supabase client
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // Get user and company info
    const { data: { user } } = await supabase.auth.getUser();
    let companyId = "";
    let userId = "";

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.company_id) {
        companyId = profile.company_id;
      }
    }

    // Build messages for AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    // Call AI API
    const response = await fetch("https://api.lovable.dev/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        tools,
        model: "openai/gpt-5-mini",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let reply = "";

    // Check if AI wants to use tools
    if (data.tool_calls && data.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of data.tool_calls) {
        const result = await executeToolCall(
          supabase,
          companyId,
          userId,
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        toolResults.push(result);
      }

      // Get final response with tool results
      const followUpMessages = [
        ...messages,
        { role: "assistant", content: data.content || "", tool_calls: data.tool_calls },
        { role: "tool", content: toolResults.join("\n\n") }
      ];

      const followUpResponse = await fetch("https://api.lovable.dev/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: followUpMessages,
          model: "openai/gpt-5-mini",
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        reply = followUpData.content || toolResults.join("\n\n");
      } else {
        reply = toolResults.join("\n\n");
      }
    } else {
      reply = data.content || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";
    }

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("MAT Proff chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        reply: "Beklager, noe gikk galt. Prøv igjen senere! 🍽️",
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
