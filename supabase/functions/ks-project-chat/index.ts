import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildSystemPrompt(projectContext?: any): string {
  const basePrompt = `Du er Prosjekt-assistenten, en vennlig og kunnskapsrik norsk KS-rådgiver for byggeprosjekter.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk
2. Vær kort og konsis – maks 3-4 setninger per svar (med mindre brukeren ber om detaljert forklaring)
3. ALDRI vis JSON eller teknisk kode til brukeren
4. Vær SVÆRT MEDGJØRLIG – bruk informasjonen brukeren gir

FAGKUNNSKAP (SAK10 §10-1):
- Bokstav a: Identifisere og dokumentere oppfyllelse av tekniske krav
- Bokstav b: Ivareta plikter etter foretakets funksjon
- Bokstav c: Styring av underleverandører
- Bokstav d: Avvikshåndtering
- Bokstav e: Dokumenthåndtering
- Bokstav f: Organisasjonsplan
- Bokstav g: Oppdatering av kunnskaper
- Bokstav h: Jevnlig gjennomgang av KS-rutiner`;

  if (!projectContext) {
    return basePrompt + `\n\nDu er i GENERELL MODUS uten et spesifikt prosjekt. Hjelp brukeren med generelle spørsmål om KS, prosjektoppsett, og byggeprosjekter.`;
  }

  const p = projectContext.project;
  let prompt = basePrompt + `\n\n## PROSJEKTKONTEKST – DU ER LÅST TIL DETTE PROSJEKTET

Du er assistenten for prosjektet "${p.project_name}" (${p.project_number}).
ALL din rådgivning skal være i kontekst av dette prosjektet.

**Prosjektdetaljer:**
- Navn: ${p.project_name}
- Nummer: ${p.project_number}
- Type: ${p.project_type || 'Ikke angitt'}
- Entreprenørtype: ${p.contractor_type || 'Ikke angitt'}
- Status: ${p.status}
- Adresse: ${p.address || 'Ikke angitt'}
- Byggherre: ${p.client_name || 'Ikke angitt'}
- Prosjektleder: ${p.project_leader_name || 'Ikke angitt'}
- Kontraktsum: ${p.contract_sum ? p.contract_sum + ' kr' : 'Ikke angitt'}
- Planlagt start: ${p.planned_start_date || 'Ikke angitt'}
- Planlagt slutt: ${p.planned_end_date || 'Ikke angitt'}
- Beskrivelse: ${p.description || 'Ingen'}`;

  // Add checklists context
  if (projectContext.checklists?.length > 0) {
    prompt += `\n\n**Eksisterende sjekklister i prosjektet (${projectContext.checklists.length} stk):**`;
    for (const cl of projectContext.checklists.slice(0, 20)) {
      prompt += `\n- "${cl.title}" (status: ${cl.status}, kategori: ${cl.category || 'ukjent'})`;
    }
  } else {
    prompt += `\n\n**Sjekklister:** Ingen sjekklister er opprettet ennå.`;
  }

  // Add subcontractors context
  if (projectContext.subcontractors?.length > 0) {
    prompt += `\n\n**Registrerte underleverandører (${projectContext.subcontractors.length} stk):**`;
    for (const ue of projectContext.subcontractors.slice(0, 15)) {
      prompt += `\n- "${ue.company_name}" – fag: ${ue.trade || 'ukjent'}, status: ${ue.approval_status || 'ukjent'}`;
    }
  } else {
    prompt += `\n\n**Underleverandører:** Ingen registrert.`;
  }

  // Add deviations context
  if (projectContext.deviations?.length > 0) {
    const open = projectContext.deviations.filter((d: any) => d.status !== 'lukket' && d.status !== 'closed');
    prompt += `\n\n**Avvik (${projectContext.deviations.length} totalt, ${open.length} åpne):**`;
    for (const dev of open.slice(0, 10)) {
      prompt += `\n- "${dev.title}" (alvorlighet: ${dev.severity || 'ukjent'}, status: ${dev.status})`;
    }
  } else {
    prompt += `\n\n**Avvik:** Ingen avvik registrert.`;
  }

  // Add milestones context
  if (projectContext.milestones?.length > 0) {
    prompt += `\n\n**Milepæler (${projectContext.milestones.length} stk):**`;
    for (const ms of projectContext.milestones.slice(0, 10)) {
      prompt += `\n- "${ms.name}" – ${ms.status || 'planlagt'}${ms.target_date ? ', frist: ' + ms.target_date : ''}`;
    }
  }

  prompt += `\n\n## HVA DU KAN GJØRE FOR DETTE PROSJEKTET

Du kan gi råd og veiledning om:
1. **Sjekklister** – Anbefale nye sjekklister, forklare sjekkpunkter, vurdere om dekning er tilstrekkelig
2. **Underleverandører** – Råd om oppfølging, kvalifikasjonskontroll, dokumentkrav
3. **Avvikshåndtering** – Hjelpe med å vurdere alvorlighet, foreslå tiltak, forebygging
4. **SAK10-krav** – Hva som kreves spesifikt for denne type prosjekt
5. **HMS/SHA** – Risikovurderinger, SJA-behov, sikkerhetstiltak
6. **Dokumentasjon** – Hva som må dokumenteres for dette prosjektet
7. **Fremdrift** – Vurdere status og foreslå neste steg

NÅR BRUKEREN BER OM Å LEGGE TIL NOE (sjekkliste, UE, avvik, etc.):
Generer et JSON-objekt med handlingen. Brukeren ser IKKE JSON – den brukes av systemet.

For å legge til en sjekkliste:
|||ACTION_START|||
{"action": "add_checklist", "data": {"title": "Sjekklistenavn", "category": "kvalitet|hms|kontroll", "checkpoints": ["Punkt 1", "Punkt 2", "Punkt 3"]}}
|||ACTION_END|||

For å legge til en underleverandør:
|||ACTION_START|||
{"action": "add_subcontractor", "data": {"company_name": "Firmanavn", "trade": "Fagområde", "contact_person": "Kontaktperson", "work_scope": "Beskrivelse av arbeidsomfang"}}
|||ACTION_END|||

VIKTIG: Generer ALLTID en handlig (action) når brukeren eksplisitt ber om å legge til, opprette, eller registrere noe. Bekreft alltid for brukeren hva du har lagt til.`;

  return prompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Uautorisert. Vennligst logg inn på nytt." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, projectContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(projectContext);
    console.log("Project chat for user:", user.id, "project:", projectContext?.project?.project_number || "none");

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditter oppbrukt. Kontakt administrator." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidig utilgjengelig." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
