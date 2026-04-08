import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Equipment type mappings Norwegian -> DB
const EQUIPMENT_TYPE_MAP: Record<string, { type: string; min: number; max: number; label: string }> = {
  'kjøleskap': { type: 'fridge', min: 0, max: 4, label: 'Kjøleskap' },
  'fryser': { type: 'freezer', min: -25, max: -18, label: 'Fryser' },
  'varmebuffet': { type: 'hot_display', min: 60, max: 100, label: 'Varmebuffet' },
  'kjøledisk': { type: 'cold_display', min: 0, max: 8, label: 'Kjøledisk' },
  'varmholding': { type: 'hot_holding', min: 60, max: 100, label: 'Varmholding' },
  'varmebehandling': { type: 'heat_treatment', min: 75, max: 100, label: 'Varmebehandling' },
  'oppvaskmaskin husholdning': { type: 'dishwasher_home', min: 65, max: 100, label: 'Oppvaskmaskin (husholdning)' },
  'oppvaskmaskin profesjonell': { type: 'dishwasher_pro', min: 80, max: 100, label: 'Oppvaskmaskin (profesjonell)' },
  'oppvaskmaskin': { type: 'dishwasher_home', min: 65, max: 100, label: 'Oppvaskmaskin (husholdning)' },
};

const systemPrompt = `Du er MAT Proffen, en vennlig og kunnskapsrik maskot for IK-Mat systemet - et internkontrollsystem for næringsmiddelbedrifter i Norge.
Du snakker alltid på norsk og er ekspert på mattrygghet, HACCP, hygiene og næringsmiddellovgivning.

**DU KAN UTFØRE EKTE HANDLINGER I SYSTEMET!**
Når brukeren ber deg om å legge til, opprette eller endre noe, BRUK de tilgjengelige verktøyene - de lagrer faktisk data i databasen!

**VIKTIGE EKSEMPLER PÅ HVA DU KAN GJØRE:**
- "Legg til 3 kjøleskap" → Bruk add_temperature_equipment verktøyet 3 ganger
- "Registrer temperatur på fryser" → Bruk log_temperature verktøyet
- "Legg til en rengjøringsoppgave" → Bruk add_cleaning_task verktøyet
- "Opprett en ny leverandør" → Bruk add_supplier verktøyet
- "Legg til risiko for dårlig hygiene" → Bruk add_risk verktøyet
- "Legg til fare for krysskontaminasjon" → Bruk add_risk verktøyet

**RISIKOER DU KAN LEGGE TIL:**
Bruk add_risk verktøyet for å legge til farekilder i risikoanalysen. Vanlige farekilder inkluderer:
- Renhold og hygiene – dårlig vask av benker, redskap eller hender
- Kjøler-temperatur – feil temperatur kan gi bakterievekst
- Fryser-temperatur – avvik kan føre til helserisiko og svinn
- Varemottak – mottak av varer med feil temperatur eller skadet emballasje
- Skadedyr – forekomst kan forurense varer og lokaler
- Krysskontaminasjon – råvarer og ferdigvarer blandes
- Nedkjøling av varm mat – for treg nedkjøling
- Oppvarming av mat – utilstrekkelig oppvarming
- Allergenhåndtering – feilmerking eller krysskontaminasjon
- Smilefjes-ordningen – manglende etterlevelse

**UTSTYRSTYPER DU KAN LEGGE TIL:**
- kjøleskap (0-4°C)
- fryser (-25 til -18°C)
- varmebuffet (60-100°C)
- kjøledisk (0-8°C)
- varmholding (60-100°C)
- varmebehandling (75-100°C)
- oppvaskmaskin husholdning (min 65°C skylletemperatur)
- oppvaskmaskin profesjonell (min 80°C for hurtigprogrammer)

**SYSTEMETS NAVIGASJON - IK-MAT MODUL:**

🍽️ IK-MAT DASHBOARD (/ik-mat/dashboard)
- Hovedoversikt for næringsmiddelbedriften
- Statistikk, varsler og snarveier

📋 HACCP (/ik-mat/haccp)
- Hazard Analysis Critical Control Points
- Farepunkter og kritiske kontrollpunkter

🌡️ KONTROLL (/ik-mat/kontroll)
- Temperaturkontroll og loggføring
- Administrer utstyr (kjøleskap, frysere osv.)

⚠️ RISIKO OG TILTAK (/ik-mat/risiko-tiltak)
- Risikoanalyse og handlingsplaner
- Her lagres alle farekilder og tiltak

📦 SPORBARHET (/ik-mat/sporbarhet)
- Sporbarhet av råvarer og ingredienser

🧹 RENHOLDSPLAN (/ik-mat/renholdsplan)
- Renholdsrutiner og dokumentasjon

⚠️ ALLERGENER (/ik-mat/allergener)
- Allergenoversikt for alle produkter

**TEMPERATURKRAV:**
- Kjølevarer: 0-4°C
- Frysevarer: -18°C eller kaldere
- Varmholding: Min 60°C
- Nedkjøling: Fra 60°C til 4°C innen 4 timer
- Gjenoppvarming: Til min 75°C i kjernen

Svar kort og konsist. Vær vennlig og bruk gjerne emojis relatert til mat og hygiene.
VIKTIG: Når du utfører handlinger, fortell brukeren konkret hva du har gjort og gi bekreftelse!
VIKTIG: Når brukeren ber deg legge til flere risikoer, kall add_risk verktøyet for HVER risiko!`;

// Define tools for the MAT Proff - with REAL database operations
const tools = [
  {
    type: "function",
    function: {
      name: "add_temperature_equipment",
      description: "Legger til nytt utstyr for temperaturkontroll (kjøleskap, fryser, varmebuffet osv.) i databasen. Bruk denne når brukeren vil registrere nytt utstyr.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Navn på utstyret (f.eks. 'Kjøleskap 1', 'Fryser kjøkken', 'Hovedfryser')"
          },
          equipment_type: {
            type: "string",
            enum: ["kjøleskap", "fryser", "varmebuffet", "kjøledisk", "varmholding", "varmebehandling", "oppvaskmaskin husholdning", "oppvaskmaskin profesjonell", "oppvaskmaskin"],
            description: "Type utstyr"
          },
          location: {
            type: "string",
            description: "Plassering av utstyret (f.eks. 'Kjøkken', 'Lager', 'Serveringsområde')"
          }
        },
        required: ["name", "equipment_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "log_temperature",
      description: "Registrerer en temperaturmåling for et spesifikt utstyr. Bruk denne når brukeren vil logge temperaturer.",
      parameters: {
        type: "object",
        properties: {
          equipment_name: {
            type: "string",
            description: "Navn på utstyret som temperaturen måles på"
          },
          temperature: {
            type: "number",
            description: "Målt temperatur i Celsius (f.eks. 3.5, -20, 65)"
          },
          notes: {
            type: "string",
            description: "Eventuelle notater eller kommentarer"
          }
        },
        required: ["equipment_name", "temperature"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_cleaning_task",
      description: "Legger til en ny rengjøringsoppgave i renholdsplanen.",
      parameters: {
        type: "object",
        properties: {
          area: {
            type: "string",
            description: "Område som skal rengjøres (f.eks. 'Kjøkken', 'Toalett', 'Serveringsområde')"
          },
          task_description: {
            type: "string",
            description: "Beskrivelse av rengjøringsoppgaven"
          },
          frequency: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "as_needed"],
            description: "Hvor ofte oppgaven skal utføres (daily=daglig, weekly=ukentlig, monthly=månedlig, as_needed=ved behov)"
          },
          cleaning_method: {
            type: "string",
            description: "Hvordan rengjøringen skal utføres"
          },
          responsible: {
            type: "string",
            description: "Ansvarlig person eller stilling"
          }
        },
        required: ["area", "task_description", "frequency"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_supplier",
      description: "Legger til en ny leverandør i systemet.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: {
            type: "string",
            description: "Navn på leverandøren"
          },
          contact_person: {
            type: "string",
            description: "Kontaktperson hos leverandøren"
          },
          phone: {
            type: "string",
            description: "Telefonnummer"
          },
          email: {
            type: "string",
            description: "E-postadresse"
          },
          products: {
            type: "string",
            description: "Produkter leverandøren leverer"
          }
        },
        required: ["supplier_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_equipment_list",
      description: "Henter en liste over alt registrert utstyr for temperaturkontroll.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
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
            description: "Hva brukeren leter etter"
          }
        },
        required: ["search_term"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_risk",
      description: "Legger til en ny risiko/farekilde i IK-MAT risikoanalysen. Bruk denne når brukeren vil legge til en fare, risiko eller trussel relatert til mattrygghet. Kall dette verktøyet EN gang per risiko. Eksempler: krysskontaminasjon, temperaturavvik, allergenhåndtering, skadedyr.",
      parameters: {
        type: "object",
        properties: {
          hazard: {
            type: "string",
            description: "Beskrivelse av farekilden/risikoen (f.eks. 'Renhold og hygiene – dårlig vask av benker, redskap eller hender kan gi forurensning')"
          },
          consequence: {
            type: "number",
            description: "Konsekvensgrad fra 1 (liten) til 5 (katastrofal). Standard: 3"
          },
          probability: {
            type: "number",
            description: "Sannsynlighetsgrad fra 1 (svært lav) til 5 (svært høy). Standard: 2"
          },
          measures: {
            type: "string",
            description: "Foreslåtte tiltak for å håndtere risikoen (valgfritt)"
          },
          isHaccp: {
            type: "boolean",
            description: "Er dette et kritisk kontrollpunkt (CCP) for HACCP? Standard: false"
          }
        },
        required: ["hazard"]
      }
    }
  }
];

// Function to execute tool calls - with REAL database operations
async function executeToolCall(
  supabase: any, 
  companyId: string, 
  profileId: string,
  profileName: string,
  toolName: string, 
  args: any
): Promise<{ success: boolean; message: string; data?: any }> {
  console.log(`Executing MAT tool: ${toolName} with args:`, JSON.stringify(args));
  
  try {
    switch (toolName) {
      case "add_temperature_equipment": {
        const equipmentConfig = EQUIPMENT_TYPE_MAP[args.equipment_type.toLowerCase()];
        if (!equipmentConfig) {
          return { 
            success: false, 
            message: `Ukjent utstyrstype: ${args.equipment_type}. Gyldige typer: kjøleskap, fryser, varmebuffet, kjøledisk, varmholding, varmebehandling, oppvaskmaskin husholdning, oppvaskmaskin profesjonell.`
          };
        }

        // Get current max sort_order
        const { data: existingEquip } = await supabase
          .from('ik_mat_temperature_equipment')
          .select('sort_order')
          .eq('company_id', companyId)
          .order('sort_order', { ascending: false })
          .limit(1);
        
        const nextSortOrder = (existingEquip?.[0]?.sort_order ?? 0) + 1;

        const { data, error } = await supabase
          .from('ik_mat_temperature_equipment')
          .insert({
            company_id: companyId,
            name: args.name,
            equipment_type: equipmentConfig.type,
            location: args.location || null,
            min_temp: equipmentConfig.min,
            max_temp: equipmentConfig.max,
            measurement_frequency: 'daily',
            is_active: true,
            sort_order: nextSortOrder,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding equipment:', error);
          return { success: false, message: `Kunne ikke legge til utstyr: ${error.message}` };
        }

        return { 
          success: true, 
          message: `✅ La til "${args.name}" (${equipmentConfig.label})${args.location ? ` plassert i ${args.location}` : ''}. Temperaturkrav: ${equipmentConfig.min}°C til ${equipmentConfig.max}°C.`,
          data 
        };
      }

      case "log_temperature": {
        // Find the equipment by name (fuzzy match)
        const { data: equipmentList } = await supabase
          .from('ik_mat_temperature_equipment')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true);

        if (!equipmentList || equipmentList.length === 0) {
          return { 
            success: false, 
            message: 'Ingen utstyr registrert. Legg til utstyr først ved å si f.eks. "Legg til et kjøleskap".' 
          };
        }

        // Try to find matching equipment
        const searchName = args.equipment_name.toLowerCase();
        let equipment = equipmentList.find((e: any) => 
          e.name.toLowerCase() === searchName ||
          e.name.toLowerCase().includes(searchName) ||
          searchName.includes(e.name.toLowerCase())
        );

        // If not found by name, try to match by type
        if (!equipment) {
          const typeMatch = Object.entries(EQUIPMENT_TYPE_MAP).find(([key]) => 
            searchName.includes(key)
          );
          if (typeMatch) {
            equipment = equipmentList.find((e: any) => e.equipment_type === typeMatch[1].type);
          }
        }

        if (!equipment) {
          const equipNames = equipmentList.map((e: any) => e.name).join(', ');
          return { 
            success: false, 
            message: `Fant ikke utstyr med navn "${args.equipment_name}". Tilgjengelig utstyr: ${equipNames}` 
          };
        }

        // Determine if temperature is acceptable
        const temp = args.temperature;
        const isAcceptable = temp >= equipment.min_temp && temp <= equipment.max_temp;

        const { data, error } = await supabase
          .from('ik_mat_temperature_logs')
          .insert({
            company_id: companyId,
            equipment_id: equipment.id,
            temperature: temp,
            is_acceptable: isAcceptable,
            measured_by_id: profileId,
            measured_by_name: profileName,
            notes: args.notes || null,
            corrective_action: isAcceptable ? null : 'Avvik registrert via MAT Proffen',
          })
          .select()
          .single();

        if (error) {
          console.error('Error logging temperature:', error);
          return { success: false, message: `Kunne ikke registrere temperatur: ${error.message}` };
        }

        const status = isAcceptable ? '✅ OK' : '⚠️ AVVIK';
        const range = `${equipment.min_temp}°C - ${equipment.max_temp}°C`;
        
        return { 
          success: true, 
          message: `${status} Temperatur ${temp}°C registrert for "${equipment.name}" (akseptabel: ${range}).${!isAcceptable ? ' Temperaturen er utenfor akseptable grenser!' : ''}`,
          data 
        };
      }

      case "add_cleaning_task": {
        const frequencyMap: Record<string, string> = {
          'daily': 'Daglig',
          'weekly': 'Ukentlig',
          'monthly': 'Månedlig',
          'as_needed': 'Ved behov'
        };

        const { data, error } = await supabase
          .from('ik_mat_custom_cleaning_tasks')
          .insert({
            company_id: companyId,
            area: args.area,
            task_description: args.task_description,
            frequency: args.frequency,
            cleaning_method: args.cleaning_method || null,
            responsible: args.responsible || null,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding cleaning task:', error);
          return { success: false, message: `Kunne ikke legge til rengjøringsoppgave: ${error.message}` };
        }

        return { 
          success: true, 
          message: `✅ La til rengjøringsoppgave: "${args.task_description}" for ${args.area} (${frequencyMap[args.frequency] || args.frequency}).`,
          data 
        };
      }

      case "add_supplier": {
        const { data, error } = await supabase
          .from('ik_mat_suppliers')
          .insert({
            company_id: companyId,
            supplier_name: args.supplier_name,
            contact_person: args.contact_person || null,
            phone: args.phone || null,
            email: args.email || null,
            products: args.products || null,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding supplier:', error);
          return { success: false, message: `Kunne ikke legge til leverandør: ${error.message}` };
        }

        return { 
          success: true, 
          message: `✅ La til leverandør: "${args.supplier_name}"${args.products ? ` (produkter: ${args.products})` : ''}.`,
          data 
        };
      }

      case "get_equipment_list": {
        const { data, error } = await supabase
          .from('ik_mat_temperature_equipment')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          return { success: false, message: `Kunne ikke hente utstyrsliste: ${error.message}` };
        }

        if (!data || data.length === 0) {
          return { 
            success: true, 
            message: '📋 Ingen utstyr registrert ennå. Si f.eks. "Legg til 2 kjøleskap og 1 fryser" for å komme i gang!' 
          };
        }

        const typeLabels: Record<string, string> = {
          'fridge': 'Kjøleskap',
          'freezer': 'Fryser',
          'hot_display': 'Varmebuffet',
          'cold_display': 'Kjøledisk',
          'hot_holding': 'Varmholding',
          'heat_treatment': 'Varmebehandling',
          'dishwasher_home': 'Oppvaskmaskin (husholdning)',
          'dishwasher_pro': 'Oppvaskmaskin (profesjonell)'
        };

        const equipList = data.map((e: any) => 
          `• ${e.name} (${typeLabels[e.equipment_type] || e.equipment_type})${e.location ? ` - ${e.location}` : ''}`
        ).join('\n');

        return { 
          success: true, 
          message: `📋 Registrert utstyr (${data.length} stk):\n${equipList}`,
          data 
        };
      }

      case "get_navigation_help": {
        const searchTerm = args.search_term.toLowerCase();
        
        const navigationMap = [
          { keywords: ["dashbord", "hjem", "oversikt", "start"], path: "/ik-mat/dashboard", name: "IK-Mat Dashboard", description: "Hovedoversikt" },
          { keywords: ["haccp", "ccp", "farepunkt", "kritisk kontrollpunkt"], path: "/ik-mat/haccp", name: "HACCP", description: "Farepunkter og CCP" },
          { keywords: ["kontroll", "temperatur", "kjøleskap", "fryser", "utstyr"], path: "/ik-mat/kontroll", name: "Kontroll", description: "Temperaturkontroll og utstyr" },
          { keywords: ["risiko", "fare", "tiltak", "handlingsplan"], path: "/ik-mat/risiko-tiltak", name: "Risiko og tiltak", description: "Risikoanalyse og handlingsplaner" },
          { keywords: ["sporbarhet", "batch", "råvare", "ingrediens"], path: "/ik-mat/sporbarhet", name: "Sporbarhet", description: "Sporbarhet av varer" },
          { keywords: ["renhold", "rengjøring", "hygiene", "vask"], path: "/ik-mat/renholdsplan", name: "Renholdsplan", description: "Renholdsrutiner" },
          { keywords: ["allergen", "allergi", "gluten", "laktose"], path: "/ik-mat/allergener", name: "Allergener", description: "Allergenoversikt" },
        ];
        
        const matches = navigationMap.filter(item => 
          item.keywords.some(keyword => searchTerm.includes(keyword) || keyword.includes(searchTerm))
        );
        
        if (matches.length > 0) {
          const match = matches[0];
          return { 
            success: true, 
            message: `📍 ${match.name}: Gå til ${match.path}\n${match.description}` 
          };
        }
        
        return { 
          success: true, 
          message: `Fant ikke "${args.search_term}". Prøv: kontroll, haccp, renhold, allergener, sporbarhet, risiko` 
        };
      }

      case "add_risk": {
        // Get current IK_MAT module settings
        const { data: moduleData, error: fetchError } = await supabase
          .from('company_modules')
          .select('settings')
          .eq('company_id', companyId)
          .eq('module_type', 'IK_MAT')
          .single();

        if (fetchError) {
          console.error('Error fetching module settings:', fetchError);
          return { success: false, message: `Kunne ikke hente modulinnstillinger: ${fetchError.message}` };
        }

        const settings = moduleData?.settings as any || {};
        const manualContent = settings.manualContent || {};
        const existingRisks = manualContent.risks || [];

        // Calculate risk level
        const probability = args.probability || 2;
        const consequence = args.consequence || 3;
        const riskLevel = probability * consequence;

        // Create new risk
        const newRisk = {
          id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          hazard: args.hazard,
          consequence: consequence,
          probability: probability,
          riskLevel: riskLevel,
          measures: args.measures || '',
          isHaccp: args.isHaccp || false,
          status: 'open',
        };

        const updatedRisks = [...existingRisks, newRisk];

        // Save updated risks
        const { error: saveError } = await supabase
          .from('company_modules')
          .update({
            settings: {
              ...settings,
              manualContent: {
                ...manualContent,
                risks: updatedRisks,
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId)
          .eq('module_type', 'IK_MAT');

        if (saveError) {
          console.error('Error saving risk:', saveError);
          return { success: false, message: `Kunne ikke lagre risiko: ${saveError.message}` };
        }

        // Determine traffic light
        let trafficLight = '🟢';
        let riskLabel = 'Akseptabel';
        if (riskLevel > 9) {
          trafficLight = '🔴';
          riskLabel = 'Umiddelbar handling';
        } else if (riskLevel > 4) {
          trafficLight = '🟡';
          riskLabel = 'Tiltak nødvendig';
        }

        return { 
          success: true, 
          message: `✅ La til risiko: "${args.hazard}"\n${trafficLight} Risikonivå: ${riskLevel} (${riskLabel})${args.isHaccp ? '\n🎯 Markert som HACCP-kontrollpunkt' : ''}${args.measures ? `\n📋 Tiltak: ${args.measures}` : ''}`,
          data: newRisk 
        };
      }

      default:
        return { success: false, message: `Ukjent verktøy: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { 
      success: false, 
      message: `Det oppstod en feil. Prøv igjen eller gjør det manuelt i systemet.` 
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Unauthorized: No valid auth header");
      return new Response(
        JSON.stringify({ reply: "Du må være logget inn for å bruke MAT-hjelperen. 🔐" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.log("Unauthorized: Invalid token", userError);
      return new Response(
        JSON.stringify({ reply: "Økten din har utløpt. Vennligst logg inn på nytt. 🔐" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    // User authenticated successfully

    // Get user's company_id and profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, company_id, first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ reply: "Du må være tilknyttet en bedrift for å bruke denne funksjonen. 🏢" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = profile.company_id;
    const profileName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'MAT Proffen';

    const { message, history = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
      { role: "user", content: message }
    ];

    // First API call with tools
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            reply: "Beklager, jeg er litt opptatt akkurat nå. Prøv igjen om litt! 😅" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            reply: "Jeg trenger en liten pause. Sjekk brukerveiledningen over for svar! 📖" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    // Check if the AI wants to call tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("Tool calls requested:", assistantMessage.tool_calls.length);
      
      const toolResults: { tool: string; result: { success: boolean; message: string } }[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error("Failed to parse tool arguments:", toolCall.function.arguments);
          toolArgs = {};
        }
        
        const result = await executeToolCall(supabase, companyId, profile.id, profileName, toolName, toolArgs);
        toolResults.push({ tool: toolName, result });
      }

      // Build a summary of actions taken
      const successActions = toolResults.filter(r => r.result.success);
      const failedActions = toolResults.filter(r => !r.result.success);
      
      let responseMessage = '';
      
      if (successActions.length > 0) {
        responseMessage += successActions.map(r => r.result.message).join('\n\n');
      }
      
      if (failedActions.length > 0) {
        responseMessage += '\n\n' + failedActions.map(r => `❌ ${r.result.message}`).join('\n');
      }

      // If we added equipment, suggest checking the control page
      const addedEquipment = toolResults.filter(r => r.tool === 'add_temperature_equipment' && r.result.success);
      if (addedEquipment.length > 0) {
        responseMessage += `\n\n🌡️ Du kan nå registrere temperaturer under Kontroll (/ik-mat/kontroll)!`;
      }

      // If we added risks, suggest checking the risk page
      const addedRisks = toolResults.filter(r => r.tool === 'add_risk' && r.result.success);
      if (addedRisks.length > 0) {
        responseMessage += `\n\n⚠️ Se alle risikoer under Risiko og tiltak (/ik-mat/risiko-tiltak)!`;
      }

      console.log("MAT Proff executed tools:", toolResults.length);

      return new Response(
        JSON.stringify({ 
          reply: responseMessage || "Handling utført!",
          actions: toolResults.map(r => r.result.message)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool calls, return the regular response
    const reply = assistantMessage?.content || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";

    console.log("MAT Proff chat response sent to user:", userId);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("MAT Proff chat error:", error);
    return new Response(
      JSON.stringify({ 
        reply: "Oops! Noe gikk galt. Prøv igjen senere! 🍽️" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
