import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FAQ_KS } from "../_shared/faq-knowledge.ts";
import { NAV_MAP, KS_PROJECT_NAV_MAP } from "../_shared/nav-map.ts";
import { callAiGateway, AI_PRIMARY_MODEL } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Gjeld for alle bedrifter i oppsettsmodus: aldri oppdikta namn/adressar.
const NO_INVENTED_DATA = `\n\nINGEN OPPDIKTEDE DATA: project_name skal være et kort arbeidsnavn uten hakeparenteser eller plassholdere (f.eks. "Totalrenovering bad"). address og client_name skal være tom streng "" når de ikke er kjent – aldri plassholdertekst som 'Ikke oppgitt', 'Ukjent' eller '[adresse]'. Finn ALDRI på prosjektnavn, adresse, byggherre, personnavn eller firmanavn. Er de ikke oppgitt av brukeren: address = "", client_name = "", og project_name = en nøytral beskrivelse av prosjekttypen (f.eks. "Nybygg enebolig", "Totalrenovering bad"), eller "Nytt prosjekt" hvis typen er ukjent – aldri ord som 'Typisk', 'Standard', 'Eksempel' eller 'AS'.`;

function buildSetupPrompt(): string {
  return `Du er Prosjekt-hjelperen, en vennlig norsk AI-assistent som hjelper brukere å sette opp nye byggeprosjekter i et KS-system.

VIKTIGE REGLER:
1. Bruk enkelt, folkelig norsk språk. Vær kort og vennlig.
2. Still oppfølgingsspørsmål for å samle inn nok informasjon (prosjektnavn, adresse, byggherre, type prosjekt, entreprenørtype, omfang).
3. Hvis brukeren limer inn tekst fra et dokument (f.eks. salgsoppgave), trekk ut all relevant prosjektinfo automatisk og gå rett til forslag.
4. Hvis brukeren ber om "sett opp et forslag" eller "lag forslag for meg" – generer et forslag direkte basert på det du vet.
5. ALDRI vis JSON eller teknisk kode i selve chat-meldingen. JSON-blokken skal bare ligge mellom merkene under – brukeren ser ikke den.

NÅR DU HAR NOK INFORMASJON (eller brukeren ber om forslag):
Skriv først en kort, hyggelig oppsummering på norsk (maks 4-5 setninger) om hva du foreslår.
Deretter, på slutten av meldingen, legg til EN JSON-blokk i nøyaktig dette formatet:

|||JSON_START|||
{
  "project_info": {
    "project_name": "Navn på prosjektet",
    "description": "Kort beskrivelse av prosjektet",
    "address": "Adresse hvis kjent",
    "client_name": "Byggherre / oppdragsgiver hvis kjent"
  },
  "contractor_type": "total | hoved | under | sideentreprise",
  "recommended_checklists": [
    {"title": "Sjekklistens navn", "description": "Hva den dekker", "category": "kvalitet | hms | sha | byggesak"}
  ],
  "recommended_routines": [
    {"title": "Rutinens navn", "description": "Hva rutinen handler om", "category": "kvalitet | hms | sha"}
  ],
  "hms_focus": [
    {"title": "Fokusområde", "description": "Hvorfor det er viktig"}
  ],
  "milestones": [
    {"name": "Milepæl", "description": "Beskrivelse"}
  ]
}
|||JSON_END|||

Tilpass innholdet til prosjekttypen (nybygg, totalrenovering, tilbygg, fagentreprise, etc.).
Inkluder 4-8 sjekklister, 3-6 rutiner, 3-5 HMS-fokusområder og 4-6 milepæler i forslaget.

Hvis brukeren bare hilser eller stiller generelle spørsmål, ikke generer JSON – still spørsmål for å lære mer om prosjektet først.

Hvis brukeren spør hvor noe finnes i systemet, bruk disse navnene nøyaktig: prosjekter ligger under «KS Bygg» → «Mine prosjekter», maler og rutiner under «KS Bygg» → «IK/KS Grunnlag» («Sjekklistemaler», «Rutiner»), og selve arbeidet gjøres inne i prosjektet.`;
}

function buildSystemPrompt(projectContext?: any, setupMode?: boolean): string {
  if (setupMode) return buildSetupPrompt();

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
- Bokstav h: Jevnlig gjennomgang av KS-rutiner

---
${NAV_MAP}

${KS_PROJECT_NAV_MAP}

---
OFFISIELL FAQ FOR SLUTTBRUKERE (Bygg Proffen) – bruk denne ordrett når brukeren spør om hvordan KS BYGG-modulen fungerer. Du kan omformulere, men ikke endre faktainnholdet:

${FAQ_KS}
`;

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
      prompt += `\n- "${cl.title}" (status: ${cl.status}, mal: ${cl.template_name || 'ukjent'})`;
    }
  } else {
    prompt += `\n\n**Sjekklister:** Ingen sjekklister er opprettet ennå.`;
  }

  // Add subcontractors context
  if (projectContext.subcontractors?.length > 0) {
    prompt += `\n\n**Registrerte underleverandører (${projectContext.subcontractors.length} stk):**`;
    for (const ue of projectContext.subcontractors.slice(0, 15)) {
      prompt += `\n- "${ue.firm_name || ue.company_name}" – fag: ${ue.trade || 'ukjent'}, status: ${ue.approval_status || 'ukjent'}`;
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
{"action": "add_checklist", "data": {"title": "Sjekklistenavn", "checkpoints": ["Punkt 1", "Punkt 2", "Punkt 3"]}}
|||ACTION_END|||

For å legge til en underleverandør:
|||ACTION_START|||
{"action": "add_subcontractor", "data": {"company_name": "Firmanavn", "trade": "Fagområde", "contact_person": "Kontaktperson", "work_scope": "Beskrivelse av arbeidsomfang"}}
|||ACTION_END|||

VIKTIG: Generer ALLTID en handlig (action) når brukeren eksplisitt ber om å legge til, opprette, eller registrere noe. Bekreft alltid for brukeren hva du har lagt til.`;

  return prompt;
}

// Jev forhåndsvurderer samtalen (punkt 1 + 2): hva er allerede kjent, så hjelperen slipper unødvendige spørsmål.
async function jevPreassess(
  messages: any[],
  key: string,
  fastTrack = false,
  questionsAsked = 0,
): Promise<{ hint: string; ready: boolean; contractorKnown: boolean }> {
  const text = messages.filter((m) => m?.role === "user").map((m) =>
    Array.isArray(m.content) ? m.content.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n") : String(m.content ?? "")
  ).join("\n---\n").slice(-6000).trim();
  if (text.length < 8) return { hint: "", ready: false, contractorKnown: false };
  const TRADES: Record<string, string> = {
    grunnarbeid: "grunnarbeid/graving", betong: "betong/støp", tomrer: "tømrer/trearbeid", tak: "tak/taktekking",
    ror: "rør/sanitær", elektro: "elektro", vatrom: "våtrom/flis", riving: "riving", maling: "maling/overflate", ventilasjon: "ventilasjon",
  };
  const yn = (q: string) => ({ type: "noul", instructions: q, criteria: { true: "Ja, det står tydelig i `samtale`.", false: "Nei, det er ikke oppgitt eller er uklart." } });
  const questions: Record<string, unknown> = {
    kind: { type: "choice", instructions: "Hvilken type byggeprosjekt beskriver brukeren i `samtale`?", criteria: {
      nybygg: "Nybygg (enebolig, leilighetsbygg, næringsbygg)", totalrenovering: "Totalrenovering av eksisterende bygg",
      tilbygg: "Tilbygg eller påbygg", fagentreprise: "Fagentreprise – ett fag for en annen entreprenør",
      mindre: "Mindre oppussing/reparasjon (f.eks. ett rom, bad, kjøkken)", ukjent: "Ikke mulig å si ut fra samtalen" } },
    contractor: { type: "choice", instructions: "Hvilken entrepriseform har brukerens firma i prosjektet i `samtale`?", criteria: {
      total: "Totalentreprise – prosjekterer og bygger alt", hoved: "Hovedentreprise – bygger etter byggherrens prosjektering",
      under: "Underentreprise/fagentreprise for en annen entreprenør", ukjent: "Ikke oppgitt eller uklart" } },
    name: yn("Har brukeren oppgitt navn eller en tydelig betegnelse på prosjektet?"),
    address: yn("Har brukeren oppgitt adresse eller sted for prosjektet?"),
    client: yn("Har brukeren oppgitt hvem som er byggherre/kunde?"),
    ready: yn("Har brukeren nå gitt nok opplysninger om hva som skal bygges (type og omfang), eller bedt om et forslag, slik at et prosjektoppsett kan foreslås uten flere spørsmål?"),
  };
  for (const [k, v] of Object.entries(TRADES)) questions[`t_${k}`] = { type: "noul", instructions: `Inngår ${v} i arbeidet beskrevet i \`samtale\`?`, criteria: { true: "Ja, nevnt eller helt åpenbart for denne jobben.", false: "Nei eller uklart." } };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: "typesafe/jev-latest", state: { samtale: text }, questions }),
  });
  if (!res.ok) { console.error("Jev", res.status, await res.text()); return { hint: "", ready: false, contractorKnown: false }; }
  const a = (await res.json())?.answers || {};
  const known: string[] = []; const missing: string[] = [];
  const conf = (x: any) => (x?.confidence ?? 0) >= 0.6;
  if (a.kind?.choice && a.kind.choice !== "ukjent" && conf(a.kind)) known.push(`Prosjekttype: ${a.kind.choice}`); else missing.push("prosjekttype");
  if (a.contractor?.choice && a.contractor.choice !== "ukjent" && conf(a.contractor)) known.push(`Entrepriseform: ${a.contractor.choice}`); else missing.push("entrepriseform");
  const trades = Object.keys(TRADES).filter((k) => (a[`t_${k}`]?.noul ?? 0) >= 0.6).map((k) => TRADES[k]);
  if (trades.length) known.push(`Fag som inngår: ${trades.join(", ")}`);
  if ((a.name?.noul ?? 0) >= 0.6) known.push("Prosjektnavn er oppgitt"); else missing.push("prosjektnavn");
  if ((a.address?.noul ?? 0) >= 0.6) known.push("Adresse er oppgitt"); else missing.push("adresse");
  if ((a.client?.noul ?? 0) >= 0.6) known.push("Byggherre er oppgitt"); else missing.push("byggherre");
  const jevReady = (a.ready?.noul ?? 0) >= 0.6;
  // Fast-track (alle brukarar i oppsettsmodus): kjent prosjekttype – «mindre» (bad,
  // kjøkken) teljer med – pluss evt. entrepriseform, held for at vi kan gi forslag.
  const typeKnown = !!a.kind?.choice && a.kind.choice !== "ukjent" && conf(a.kind);
  const contractorKnown = !!a.contractor?.choice && a.contractor.choice !== "ukjent" && conf(a.contractor);
  const ready = fastTrack ? (questionsAsked >= 2 || (typeKnown && contractorKnown)) : jevReady;
  const hint = `\n\nFORHÅNDSVURDERING AV SAMTALEN (automatisk, ikke vis til brukeren):
Allerede kjent – IKKE spør om dette igjen: ${known.join("; ") || "ingenting ennå"}.
Mangler: ${missing.join(", ") || "ingenting viktig"}.
${ready
    ? "Brukeren har gitt nok informasjon. Gå RETT til forslag med JSON-blokken nå. Manglende navn/adresse/byggherre kan stå tomt eller få et fornuftig arbeidsnavn – ikke still flere spørsmål."
    : "Still NØYAKTIG ETT kort oppfølgingsspørsmål – ingen punktliste med flere spørsmål. Spør om det viktigste som mangler for å lage oppsettet (type/omfang, ellers entrepriseform). Spør IKKE om prosjektnavn, adresse eller byggherre – det kan fylles ut senere. Ikke spør om noe som allerede er kjent." +
      (fastTrack ? " Hvis prosjekttype er kjent men entrepriseform mangler, spør om entrepriseform; ellers spør om type/omfang." : "")}`;
  return { hint, ready, contractorKnown };
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

    const { messages, projectContext, setupMode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = buildSystemPrompt(projectContext, setupMode);
    // Raskare oppsett-tempo gjeld no alle brukarar i oppsettsmodus.
    const fastTrack = !!setupMode;
    let questionsAsked = 0;
    let pre = { hint: "", ready: false, contractorKnown: false };
    if (setupMode && Array.isArray(messages)) {
      questionsAsked = messages.filter((m: any) => m?.role === "assistant").length;
      pre = await jevPreassess(messages, LOVABLE_API_KEY, fastTrack, questionsAsked).catch((e) => { console.error("Jev preassess failed", e); return { hint: "", ready: false, contractorKnown: false }; });
      if (pre.hint) systemPrompt += pre.hint;
      // Gjeld for alle bedrifter i oppsettsmodus: aldri oppdikta namn/adressar.
      systemPrompt += NO_INVENTED_DATA;
    }
    // Tving fram forslag når vi faktisk har nok informasjon.
    const lastUserMsg = Array.isArray(messages) ? [...messages].reverse().find((m: any) => m?.role === "user") : undefined;
    const lastUserText = !lastUserMsg ? ""
      : Array.isArray(lastUserMsg.content)
        ? lastUserMsg.content.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n")
        : String(lastUserMsg.content ?? "");
    const askedForProposal = /forslag/i.test(lastUserText);
    const forceProposal = fastTrack && (questionsAsked >= 2 || askedForProposal);
    const askContractor = fastTrack && !askedForProposal && questionsAsked < 2 && !pre.contractorKnown;
    if (fastTrack) {
      // Legges til også når Jev feilet (tom hint) – tempoet skal gjelde uansett.
      systemPrompt += `\n\nTEMPO: Still maks 2 korte oppfølgingsspørsmål totalt i hele samtalen, ett om gangen. Spør aldri om prosjektnavn, adresse eller byggherre – de kan fylles ut senere (bruk et fornuftig arbeidsnavn, f.eks. "Totalrenovering bad"). Når prosjekttype og omfang er kjent, gi forslaget med JSON-blokken med en gang. Mangler entrepriseform etter 2 spørsmål, anta totalentreprise og si kort at det kan endres. I oppsummeringen skal du nevne de viktigste sjekklistene du foreslår med navn. Hver sjekkliste i recommended_checklists skal ha feltet "checkpoints": en liste med 5–10 korte, konkrete kontrollpunkter (strenger).`;
    }
    console.log("Project chat for user:", user.id, "project:", projectContext?.project?.project_number || "none");

    let requestMessages = messages;
    if ((forceProposal || askContractor) && Array.isArray(messages)) {
      const FORCE = "\n\n(Systembeskjed, ikke vis til brukeren: Du har nok informasjon. Svar NÅ med forslaget: 2–4 korte setninger som nevner 3–5 av sjekklistene med navn, og deretter JSON-blokken mellom |||JSON_START||| og |||JSON_END|||. Ikke still flere spørsmål. Ikke finn på navn, adresse eller byggherre – bruk tom streng når de ikke er oppgitt. Ta med checkpoints (5–10) for hver sjekkliste.)";
      const ASK = "\n\n(Systembeskjed, ikke vis til brukeren: Før du lager forslag, still ETT kort spørsmål om entrepriseform – totalentreprise, hovedentreprise eller under-/fagentreprise. Ikke lag forslag og ikke JSON i dette svaret.)";
      const NOTE = forceProposal ? FORCE : ASK;
      requestMessages = [...messages];
      for (let i = requestMessages.length - 1; i >= 0; i--) {
        const m: any = requestMessages[i];
        if (m?.role !== "user") continue;
        requestMessages[i] = Array.isArray(m.content)
          ? { ...m, content: [...m.content, { type: "text", text: NOTE }] }
          : { ...m, content: String(m.content ?? "") + NOTE };
        break;
      }
    }

    const response = await callAiGateway(LOVABLE_API_KEY, {
      model: AI_PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...requestMessages
      ],
      stream: true,
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
      error: "En uventet feil oppstod" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
