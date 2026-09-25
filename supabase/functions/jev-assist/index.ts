import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

async function jev(state: unknown, questions: Record<string, unknown>) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw { status: 500, message: "AI er ikke satt opp" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: "typesafe/jev-latest", state, questions }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Jev error", res.status, t);
    const message = res.status === 429 ? "For mange forespørsler, prøv igjen om litt"
      : res.status === 402 ? "AI-kreditten er brukt opp"
      : res.status === 403 ? "AI-tilgang er blokkert for arbeidsområdet"
      : "Kunne ikke lage forslag nå";
    throw { status: res.status, message };
  }
  const data = await res.json();
  return (data?.answers || {}) as Record<string, any>;
}

const CATEGORIES: Record<string, string> = {
  safety: "HMS/sikkerhet: fare for personskade, ulykke, nestenulykke, verneutstyr, farlige forhold.",
  quality: "Kvalitet: feil i utført arbeid, produkt eller leveranse, reklamasjon.",
  environment: "Miljø: utslipp, søl, avfall, forurensning, støy mot omgivelser.",
  process: "Prosess: rutine eller arbeidsflyt som ikke følges eller ikke fungerer.",
  equipment: "Utstyr: maskin, verktøy, kjøretøy eller anlegg som er defekt eller mangler.",
  personnel: "Personell: bemanning, kompetanse, opplæring, arbeidsmiljø mellom mennesker.",
  documentation: "Dokumentasjon: manglende eller feil papirer, skjema, sertifikat, tegninger.",
  other: "Annet: ingen av de andre passer.",
};
const PRIORITIES = ["low", "medium", "high", "critical"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Ikke innlogget" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return json({ error: "Sesjonen er utløpt" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: me } = await admin.from("profiles").select("company_id").eq("user_id", uid).maybeSingle();
    const body = await req.json().catch(() => null);
    let companyId = me?.company_id as string | undefined;
    if (body?.companyId && body.companyId !== companyId) {
      const { data: sa } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "system_admin").maybeSingle();
      if (sa) companyId = String(body.companyId);
    }
    if (!companyId) return json({ error: "Fant ikke bedrift" }, 403);
    const mode = body?.mode;

    // ---------------- SMART AVVIK ----------------
    if (mode === "deviation") {
      const title = clip(body?.title, 300);
      const description = clip(body?.description, 3000);
      if (!title && !description) return json({ error: "Skriv tittel eller beskrivelse først" }, 400);
      const { data: people } = await admin.from("profiles")
        .select("id, user_id, first_name, last_name")
        .eq("company_id", companyId).eq("is_active", true).limit(60);
      const { data: roleRows } = await admin.from("user_roles").select("user_id, role").in("user_id", (people || []).map((p: any) => p.user_id));
      const roleName: Record<string, string> = { company_admin: "bedriftsadministrator/leder", department_admin: "avdelingsleder" };
      const staff = (people || []).map((p: any) => ({
        id: p.id, name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Ukjent",
        role: (roleRows || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => roleName[r.role]).filter(Boolean).join(", ") || "ansatt",
      }));
      const responsibleCriteria: Record<string, string> = { none: "Ingen på listen passer tydelig bedre enn andre." };
      staff.forEach((s, i) => { responsibleCriteria[`p${i}`] = `${s.name}${s.role ? ` (${s.role})` : ""}`; });

      const questions: Record<string, unknown> = {
        category: { type: "choice", instructions: "Hvilken kategori passer best for avviket i `avvik`?", criteria: CATEGORIES },
        priority: {
          type: "choice",
          instructions: "Hvor alvorlig er avviket i `avvik`, og hvor raskt må det følges opp?",
          criteria: {
            low: "Lav: liten betydning, kan rettes ved anledning.",
            medium: "Middels: bør rettes innen kort tid, ingen umiddelbar fare.",
            high: "Høy: kan føre til skade, stopp eller betydelig tap om det ikke rettes raskt.",
            critical: "Kritisk: personskade har skjedd, eller det er umiddelbar fare for liv og helse.",
          },
        },
        notify_verneombud: {
          type: "noul",
          instructions: "Bør verneombudet informeres om avviket i `avvik`?",
          criteria: { true: "Gjelder personskade, nestenulykke, farlige forhold eller arbeidsmiljø.", false: "Gjelder bare kvalitet, dokumentasjon, økonomi eller lignende uten betydning for sikkerhet og arbeidsmiljø." },
        },
      };
      if (staff.length > 0) {
        questions.responsible = {
          type: "choice",
          instructions: "Hvem i `ansatte` bør følge opp og lukke avviket i `avvik`, ut fra stilling/rolle?",
          criteria: responsibleCriteria,
        };
      }
      const answers = await jev({ avvik: { tittel: title, beskrivelse: description, sted: clip(body?.location, 200) }, ansatte: staff.map((s) => ({ navn: s.name, stilling: s.role })) }, questions);
      const cat = answers.category, pri = answers.priority;
      if (!cat?.choice || !CATEGORIES[cat.choice] || !pri?.choice || !PRIORITIES.includes(pri.choice)) {
        return json({ error: "Fikk ikke et gyldig forslag, fyll inn selv" }, 502);
      }
      const r = answers.responsible;
      const idx = r?.choice && r.choice !== "none" ? Number(String(r.choice).slice(1)) : -1;
      const person = idx >= 0 ? staff[idx] : null;
      return json({
        category: cat.choice, categoryConfidence: cat.confidence ?? null,
        priority: pri.choice, priorityConfidence: pri.confidence ?? null,
        notifyVerneombud: typeof answers.notify_verneombud?.noul === "number" ? answers.notify_verneombud.noul : null,
        responsible: person ? { id: person.id, name: person.name, confidence: r?.confidence ?? null } : null,
      });
    }

    // ---------------- VAKTSJEKK ----------------
    if (mode === "shift") {
      const ids: string[] = Array.isArray(body?.employeeIds) ? body.employeeIds.slice(0, 30).map(String) : [];
      const dates: string[] = (Array.isArray(body?.dates) ? body.dates : []).filter((d: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(d))).slice(0, 62);
      const start = clip(body?.startTime, 5), end = clip(body?.endTime, 5);
      if (!ids.length || !dates.length || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return json({ error: "Velg ansatt, dato og tid først" }, 400);
      const { data: emps } = await admin.from("profiles").select("id, first_name, last_name").eq("company_id", companyId).in("id", ids);
      const employees = emps || [];
      const minD = dates.reduce((a, b) => (a < b ? a : b)), maxD = dates.reduce((a, b) => (a > b ? a : b));
      const shiftDay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
      const [{ data: absences }, { data: scheds }, { data: courses }] = await Promise.all([
        admin.from("employee_absence").select("employee_id, absence_type, start_date, end_date, status").eq("company_id", companyId).in("employee_id", ids).lte("start_date", maxD).gte("end_date", minD),
        admin.from("work_schedules").select("id, employee_id, schedule_date, start_time, end_time").eq("company_id", companyId).in("employee_id", ids).gte("schedule_date", shiftDay(minD, -1)).lte("schedule_date", shiftDay(maxD, 1)),
        admin.from("employee_courses").select("employee_id, course_name, expiry_date").eq("company_id", companyId).in("employee_id", ids),
      ]);
      const excludeId = body?.excludeScheduleId ? String(body.excludeScheduleId) : null;
      const toMin = (t: string) => { const [h, m] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };
      const sS = toMin(start), sE0 = toMin(end), sE = sE0 <= sS ? sE0 + 1440 : sE0;
      const abs = (d: string, t: string) => Math.round(new Date(`${d}T00:00:00Z`).getTime() / 60000) + toMin(t);

      const results = employees.map((e: any) => {
        const name = `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Ukjent";
        const warnings: string[] = [];
        for (const d of dates) {
          const a = (absences || []).find((x: any) => x.employee_id === e.id && x.status !== "rejected" && x.start_date <= d && x.end_date >= d);
          if (a) warnings.push(`Registrert fravær (${a.absence_type}) ${d}`);
          const ns = abs(d, start), ne = ns + (sE - sS);
          for (const s of (scheds || []).filter((x: any) => x.employee_id === e.id && x.id !== excludeId)) {
            const os = abs(s.schedule_date, s.start_time); let oe = abs(s.schedule_date, s.end_time); if (oe <= os) oe += 1440;
            if (ns < oe && os < ne) warnings.push(`Har allerede vakt ${s.schedule_date} ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`);
            else { const gap = ns >= oe ? ns - oe : os - ne; if (gap < 660) warnings.push(`Under 11 t hvile mot vakt ${s.schedule_date} (${Math.floor(gap / 60)} t ${gap % 60} min)`); }
          }
        }
        return { employeeId: e.id, name, warnings: [...new Set(warnings)].slice(0, 6), competence: null as null | { noul: number; missing: boolean } };
      });

      const job = { rolle: clip(body?.role, 100), sted: clip(body?.location, 100), prosjekt: clip(body?.projectName, 200), notater: clip(body?.notes, 500) };
      const hasJob = Object.values(job).some(Boolean);
      if (hasJob && results.length) {
        const state: Record<string, unknown> = { vakt: job, dato: minD, ansatte: {} as Record<string, unknown> };
        const qs: Record<string, unknown> = {};
        results.forEach((r, i) => {
          const e: any = employees.find((x: any) => x.id === r.employeeId);
          (state.ansatte as any)[`a${i}`] = {
            kurs: (courses || []).filter((c: any) => c.employee_id === r.employeeId)
              .map((c: any) => ({ kurs: c.course_name, utløper: c.expiry_date || "utløper ikke" })),
          };
          qs[`c${i}`] = {
            type: "noul",
            instructions: `Har \`ansatte.a${i}\` den kompetansen og de gyldige kursene/sertifikatene som arbeidet i \`vakt\` krever på \`dato\`? Utløpte kurs regnes som manglende.`,
            criteria: { true: "Arbeidet krever ikke spesiell kompetanse, eller nødvendig kurs/sertifikat finnes og er gyldig.", false: "Arbeidet krever tydelig et kurs, sertifikat eller en rolle den ansatte mangler eller som er utløpt." },
          };
        });
        try {
          const answers = await jev(state, qs);
          results.forEach((r, i) => {
            const n = answers[`c${i}`]?.noul;
            if (typeof n === "number") r.competence = { noul: n, missing: n < 0.4 };
          });
        } catch (err: any) {
          if (err?.status === 402 || err?.status === 403) return json({ error: err.message, results }, err.status);
          console.error("competence check skipped", err);
        }
      }
      return json({ results, checkedCompetence: hasJob });
    }

    // ---------------- TIMESJEKK (før godkjenning) ----------------
    if (mode === "time_check") {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
      const ok = (roles || []).some((r: any) => ["company_admin", "department_admin", "system_admin"].includes(r.role));
      if (!ok) return json({ error: "Kun leder/admin kan sjekke timer" }, 403);
      const ids: string[] = (Array.isArray(body?.entryIds) ? body.entryIds : []).slice(0, 40).map(String);
      if (!ids.length) return json({ results: [] });
      const { data: rows } = await admin.from("time_entries").select("id, description, hours, entry_date")
        .eq("company_id", companyId).in("id", ids);
      const entries = rows || [];
      const results: Record<string, string[]> = {};
      const qs: Record<string, unknown> = {};
      const state: Record<string, unknown> = {};
      entries.forEach((e: any, i: number) => {
        const w: string[] = [];
        const h = Number(e.hours);
        if (!(h > 0)) w.push("0 timer – mulig tastefeil");
        else if (h > 13) w.push(`${h} t på én dag – mulig tastefeil`);
        const d = clip(e.description, 400);
        if (!d) w.push("Mangler beskrivelse");
        else {
          state[`t${i}`] = { beskrivelse: d, timer: h };
          qs[`d${i}`] = {
            type: "noul",
            instructions: `Er beskrivelsen i \`t${i}.beskrivelse\` konkret nok til at en kunde forstår hvilket arbeid som ble utført og kan godta det på en faktura?`,
            criteria: {
              true: "Konkret: sier hva som ble gjort, f.eks. «Montert gips i stue 2. etg» eller «Service på kran, byttet hydraulikkslange».",
              false: "For vag: sier nesten ingenting om arbeidet, f.eks. «jobb», «jobbet på tomta», «div», «arbeid».",
            },
          };
        }
        results[e.id] = w;
      });
      if (Object.keys(qs).length) {
        try {
          const answers = await jev(state, qs);
          entries.forEach((e: any, i: number) => {
            const n = answers[`d${i}`]?.noul;
            if (typeof n === "number" && n < 0.4) results[e.id].push("Beskrivelsen er trolig for vag til å fakturere");
          });
        } catch (err: any) {
          if (err?.status === 402 || err?.status === 403) return json({ error: err.message }, err.status);
          console.error("time description check skipped", err);
        }
      }
      return json({ results: Object.entries(results).map(([id, warnings]) => ({ id, warnings })) });
    }

    // ---------------- DAGRAPPORT → AVVIK ----------------
    if (mode === "daily_report") {
      const t = body?.texts || {};
      const existing = clip(t.avvik, 3000).toLowerCase();
      const sentences: string[] = [];
      for (const k of ["arbeid", "fremdrift", "hms", "merknader"]) {
        for (const s of clip(t[k], 3000).split(/(?<=[.!?])\s+|\n+/)) {
          const x = s.trim();
          if (x.length >= 12 && !existing.includes(x.toLowerCase()) && !sentences.includes(x)) sentences.push(x);
        }
      }
      const list = sentences.slice(0, 25);
      if (!list.length) return json({ suggestions: [] });
      const state: Record<string, string> = {};
      const qs: Record<string, unknown> = {};
      list.forEach((s, i) => {
        state[`s${i}`] = s;
        qs[`q${i}`] = {
          type: "noul",
          instructions: `Beskriver setningen i \`s${i}\` fra en dagrapport på en byggeplass en hendelse eller et forhold som bør registreres som avvik (feil, skade, nestenulykke, farlig forhold, mangel, brudd på rutine)?`,
          criteria: {
            true: "Ja: noe gikk galt eller er feil/farlig, f.eks. «Stillas manglet rekkverk», «Feil armering oppdaget», «Arbeider skled på is».",
            false: "Nei: vanlig arbeid, fremdrift, vær eller planer, f.eks. «Støpt dekke i 2. etg», «Regn hele dagen».",
          },
        };
      });
      const answers = await jev(state, qs);
      const suggestions = list.map((text, i) => ({ text, noul: answers[`q${i}`]?.noul }))
        .filter((s) => typeof s.noul === "number" && s.noul >= 0.6)
        .sort((a, b) => b.noul - a.noul).slice(0, 5);
      return json({ suggestions });
    }

    // ---------------- OPPSLAGSTAVLE ----------------
    if (mode === "announcement") {
      const title = clip(body?.title, 300), text = clip(body?.body, 3000);
      if ((title + text).length < 8) return json({ error: "Skriv tittel og melding først" }, 400);
      const { data: projs } = await admin.from("ks_module2_projects").select("id, project_name")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(60);
      const projects = (projs || []).filter((p: any) => p.project_name);
      const questions: Record<string, unknown> = {
        importance: {
          type: "choice",
          instructions: "Hvor viktig er meldingen i `melding` for de ansatte som mottar den?",
          criteria: {
            normal: "Vanlig: generell info, sosialt, påminnelser uten konsekvens om man går glipp av dem.",
            important: "Viktig: endringer i plan, oppmøte, frister eller rutiner som alle må få med seg.",
            critical: "Kritisk: fare for liv/helse, stans i arbeid, akutt sikkerhetsbeskjed som må leses straks.",
          },
        },
      };
      if (projects.length) {
        const c: Record<string, string> = { none: "Meldingen gjelder ikke ett bestemt prosjekt." };
        projects.forEach((p: any, i: number) => { c[`p${i}`] = p.project_name; });
        questions.project = { type: "choice", instructions: "Hvilket prosjekt gjelder meldingen i `melding`, om noen?", criteria: c };
      }
      const answers = await jev({ melding: { tittel: title, tekst: text } }, questions);
      const imp = answers.importance;
      if (!imp?.choice) return json({ error: "Fikk ikke et gyldig forslag" }, 502);
      const pc = answers.project;
      const pi = pc?.choice && pc.choice !== "none" ? Number(String(pc.choice).slice(1)) : -1;
      const p = pi >= 0 ? projects[pi] : null;
      return json({
        importance: imp.choice, importanceConfidence: imp.confidence ?? null,
        project: p && (pc.confidence ?? 0) >= 0.4 ? { id: p.id, name: p.project_name, confidence: pc.confidence ?? null } : null,
      });
    }

    // ---------------- PROSJEKTOPPSTART ----------------
    if (mode === "project_start") {
      const description = clip(body?.description, 2000);
      if (description.length < 10) return json({ error: "Beskriv jobben først" }, 400);
      const templates: { id: string; name: string; description: string }[] =
        (Array.isArray(body?.templates) ? body.templates : []).slice(0, 25)
          .map((x: any) => ({ id: clip(x?.id, 60), name: clip(x?.name, 100), description: clip(x?.description, 200) }))
          .filter((x: any) => x.id && x.name);
      const questions: Record<string, unknown> = {
        projectType: {
          type: "choice",
          instructions: "Hvilken prosjekttype passer best for jobben beskrevet i `jobb`?",
          criteria: {
            standard: "Standard: større byggeprosjekt som trenger komplett styring – byggesak, SHA-plan, økonomi, underleverandører, fremdrift.",
            small: "Lite prosjekt: mindre jobb med enklere behov – sjekklister, bilder, timer og befaringer, uten full byggesak.",
            mini: "Mini: enkel jobb eller lite småoppdrag – bare sjekklister, avvik og dokumenter.",
          },
        },
      };
      if (templates.length) {
        const c: Record<string, string> = { blank: "Tomt prosjekt: ingen av malene passer tydelig." };
        templates.forEach((x, i) => { c[`t${i}`] = `${x.name}: ${x.description || "ingen beskrivelse"}`; });
        questions.template = {
          type: "choice",
          instructions: "Hvilken av prosjektmalene i `maler` passer best til jobben i `jobb`? Velg blank om ingen passer tydelig.",
          criteria: c,
        };
      }
      const answers = await jev({ jobb: description, maler: templates.map((x) => `${x.name}: ${x.description}`) }, questions);
      const pt = answers.projectType;
      if (!pt?.choice || !["standard", "small", "mini"].includes(pt.choice)) {
        return json({ error: "Fikk ikke et gyldig forslag" }, 502);
      }
      const tc = answers.template;
      const ti = tc?.choice && tc.choice !== "blank" ? Number(String(tc.choice).slice(1)) : -1;
      const tpl = ti >= 0 && (tc.confidence ?? 0) >= 0.4 ? templates[ti] : null;
      return json({
        projectType: pt.choice, typeConfidence: pt.confidence ?? null,
        template: tpl ? { id: tpl.id, name: tpl.name, confidence: tc.confidence ?? null } : null,
      });
    }

    // ---------------- SJA: FORESLÅ FARER ----------------
    if (mode === "sja") {
      const work = clip(body?.workDescription, 2000);
      if (work.length < 10) return json({ error: "Beskriv arbeidet først" }, 400);
      const existing: string[] = (Array.isArray(body?.existingRisks) ? body.existingRisks : []).slice(0, 30).map((x: unknown) => clip(x, 200).toLowerCase());
      const HAZARDS: { id: string; risk: string; consequence: string; probability: string; measures: string[] }[] = [
        { id: "fall_hoyde", risk: "Fall fra høyde (stillas, stige, tak, åpning i gulv)", consequence: "Alvorlig", probability: "Mulig", measures: ["Rekkverk/gjerding av åpninger", "Godkjent stillas med kontrollert merking", "Personlig fallsikring der rekkverk ikke er mulig", "Sjekk stiger og stillas før bruk"] },
        { id: "fallende_gjenstand", risk: "Fallende gjenstander og verktøy fra arbeid over hodehøyde", consequence: "Alvorlig", probability: "Mulig", measures: ["Fotlist og nett på stillas", "Sikre verktøy og materialer mot fall", "Avsperr området under arbeidet", "Hjelm for alle i sonen"] },
        { id: "kran_loft", risk: "Kran- og løfteoperasjoner – svingende eller fallende last", consequence: "Alvorlig", probability: "Mulig", measures: ["Sertifisert kranfører og signalgiver", "Sjekk løfteutstyr og stropper før bruk", "Hold folk unna svingradius og under last", "Stans løft ved vind over grenseverdi"] },
        { id: "grave_ras", risk: "Rasfare ved graving i grøft/sjakt", consequence: "Alvorlig", probability: "Mulig", measures: ["Sikre grøft med spunt eller avflassing", "Ikke opphold i usikret grøft", "Kontroll av kabler og ledninger før graving"] },
        { id: "strom", risk: "Elektrisk støt fra kabling, skjøteledninger eller anlegg", consequence: "Alvorlig", probability: "Mulig", measures: ["Bruk jordfeilbryter", "Sjekk kabler og koblinger for skade", "Kun fagfolk på elektrisk anlegg"] },
        { id: "maskin_klem", risk: "Klem- og skjærefare fra maskiner og verktøy", consequence: "Moderat", probability: "Mulig", measures: ["Skjerming og sikringer på plass", "Opplæring før bruk av maskin", "Stans maskin før rengjøring/justering"] },
        { id: "kjoretoy_pakjorsel", risk: "Påkjørsel fra anleggsmaskiner, dumper eller trafikk på byggeplassen", consequence: "Alvorlig", probability: "Mulig", measures: ["Skill gående og kjørende med fysiske barrierer", "Ryggesignal/banemann ved rygging", "Refleksvest for alle på området"] },
        { id: "stoy", risk: "Skadelig støy fra maskiner og verktøy", consequence: "Moderat", probability: "Sannsynlig", measures: ["Hørselsvern i merkede soner", "Velg stillere verktøy der mulig", "Begrens eksponeringstid"] },
        { id: "vibrasjon", risk: "Hånd-arm-vibrasjon fra rivehammer, vinkelsliper e.l.", consequence: "Moderat", probability: "Sannsynlig", measures: ["Begrens triggertid per skift", "Pauser og arbeidsrotasjon", "Vedlikeholdt, lavvibrerende verktøy"] },
        { id: "stov_kjemikalier", risk: "Støv, sveisrøyk eller kjemikalier (betong, løsemidler, kvartsstøv)", consequence: "Moderat", probability: "Sannsynlig", measures: ["Punktavsug eller våt kapping", "Åndedrettsvern ved behov", "Les sikkerhetsdatablad før bruk", "God ventilasjon innendørs"] },
        { id: "tung_loft", risk: "Tunge løft og belastningsskader ved manuell håndtering", consequence: "Moderat", probability: "Sannsynlig", measures: ["Bruk løftehjelpemidler", "Toløft over 25 kg", "Varier arbeidsstilling"] },
        { id: "brann_varmt", risk: "Brannfare ved varmt arbeid (sveising, kutting, brenner)", consequence: "Alvorlig", probability: "Mulig", measures: ["Varmt arbeid-tillatelse og brannvakt", "Slokkingsutstyr tilgjengelig", "Etterkontroll minst 1 time etter arbeid"] },
        { id: "vaer_kulde", risk: "Vær og vind – kulde, glatte underlag eller sterk vind", consequence: "Moderat", probability: "Sannsynlig", measures: ["Strø/sand glatte flater", "Stans høydarbeid og kran ved sterk vind", "Egnet arbeidstøy og varmestue"] },
        { id: "asbest_pcb", risk: "Mistanke om asbest, PCB eller andre farlige stoffer i eksisterende bygg", consequence: "Alvorlig", probability: "Mulig", measures: ["Stans arbeid ved funn av mistenkelig materiale", "Prøvetaking og kartlegging før riving", "Sertifisert firma ved sanitetsfjerning"] },
        { id: "arbeid_alene", risk: "Arbeid alene uten tilsyn eller nødkommunikasjon", consequence: "Moderat", probability: "Mulig", measures: ["Avtalt kontakt/intervall med kollega", "Telefon eller nødknapp tilgjengelig"] },
        { id: "orden_rydding", risk: "Dårlig orden – snublefare, blokkerte rømningsveier, skarpe gjenstander", consequence: "Moderat", probability: "Sannsynlig", measures: ["Daglig rydding av arbeidsområdet", "Hold rømningsveier frie", "Kast avfall med spiker/skarp kant straks"] },
      ];
      const state: Record<string, unknown> = { arbeid: work, farer: {} as Record<string, string> };
      const qs: Record<string, unknown> = {};
      HAZARDS.forEach((h, i) => {
        (state.farer as any)[`f${i}`] = h.risk;
        qs[`f${i}`] = {
          type: "noul",
          instructions: `Er faren i \`farer.f${i}\` reelt relevant for arbeidet beskrevet i \`arbeid\`, slik at den bør være med i en SJA (sikker jobbanalyse)?`,
          criteria: {
            true: "Faren kan faktisk oppstå under dette arbeidet, eller er en kjent standardfare for denne typen arbeid.",
            false: "Faren er lite sannsynlig eller irrelevant for dette arbeidet.",
          },
        };
      });
      const answers = await jev(state, qs);
      const suggestions = HAZARDS.map((h, i) => ({ ...h, noul: answers[`f${i}`]?.noul }))
        .filter((h) => typeof h.noul === "number" && h.noul >= 0.55)
        .filter((h) => !existing.some((e) => e && h.risk.toLowerCase().includes(e.slice(0, 20))))
        .sort((a, b) => b.noul - a.noul)
        .slice(0, 8)
        .map(({ noul, ...h }) => h);
      return json({ suggestions });
    }

    // ---------------- PROSJEKT-HJELPER: KONTROLLSJEKK AV FORSLAG ----------------
    if (mode === "setup_review") {
      const description = clip(body?.description, 3000);
      const items: { title: string; description: string }[] = (Array.isArray(body?.items) ? body.items : []).slice(0, 30)
        .map((x: any) => ({ title: clip(x?.title, 150), description: clip(x?.description, 300) }));
      if (description.length < 5 || !items.length) return json({ keep: items.map(() => true) });
      const state: Record<string, unknown> = { prosjekt: description, forslag: {} as Record<string, string> };
      const qs: Record<string, unknown> = {};
      items.forEach((it, i) => {
        (state.forslag as any)[`p${i}`] = `${it.title}${it.description ? ": " + it.description : ""}`;
        qs[`p${i}`] = {
          type: "noul",
          instructions: `Er sjekklisten/rutinen i \`forslag.p${i}\` relevant for byggeprosjektet beskrevet i \`prosjekt\`?`,
          criteria: {
            true: "Relevant: arbeidet eller risikoen den dekker inngår i prosjektet, eller den er en generell KS/HMS-sjekkliste som gjelder alle byggeprosjekter.",
            false: "Irrelevant: den gjelder et fag, en bygningsdel eller en arbeidsoperasjon som ikke inngår i dette prosjektet.",
          },
        };
      });
      const answers = await jev(state, qs);
      // Fjern kun når Jev er ganske sikker på at det er irrelevant; manglende svar = behold.
      const keep = items.map((_, i) => { const n = answers[`p${i}`]?.noul; return typeof n !== "number" || n >= 0.25; });
      return json({ keep });
    }

    // ---------------- PROSJEKT: DAGENS PRIORITERINGER ----------------
    if (mode === "project_priorities") {
      const projectName = clip(body?.projectName, 200);
      const items: { id: string; type: string; title: string; detail: string }[] = (Array.isArray(body?.items) ? body.items : []).slice(0, 25)
        .map((x: any) => ({ id: clip(x?.id, 60), type: clip(x?.type, 20), title: clip(x?.title, 200), detail: clip(x?.detail, 300) }))
        .filter((x) => x.id && x.title);
      if (!items.length) return json({ results: [] });
      const state: Record<string, unknown> = { prosjekt: projectName, dato: new Date().toISOString().slice(0, 10), oppgaver: {} as Record<string, unknown> };
      const qs: Record<string, unknown> = {};
      items.forEach((it, i) => {
        (state.oppgaver as any)[`o${i}`] = { type: it.type, tittel: it.title, detalj: it.detail };
        qs[`o${i}`] = {
          type: "noul",
          instructions: `Bør oppgaven i \`oppgaver.o${i}\` prioriteres av prosjektledelsen I DAG, ut fra type, frist og konsekvens av å vente?`,
          criteria: {
            true: "Bør gjøres i dag: forfalt, frist i dag/i morgen, eller åpen sikkerhets-/kvalitetshendelse som blokkerer videre arbeid.",
            false: "Kan vente: god tid til fristen og ingen umiddelbar konsekvens.",
          },
        };
      });
      const answers = await jev(state, qs);
      const results = items.map((it, i) => ({ id: it.id, noul: typeof answers[`o${i}`]?.noul === "number" ? answers[`o${i}`].noul : null }))
        .sort((a, b) => (b.noul ?? -1) - (a.noul ?? -1));
      return json({ results });
    }

    // ---------------- PROSJEKT: FORFALT-TRIAGE ----------------
    if (mode === "overdue_triage") {
      const projectId = clip(body?.projectId, 60);
      const projectName = clip(body?.projectName, 200);
      const items: { id: string; title: string; daysOverdue: number }[] = (Array.isArray(body?.items) ? body.items : []).slice(0, 15)
        .map((x: any) => ({ id: clip(x?.id, 60), title: clip(x?.title, 200), daysOverdue: Math.max(0, Number(x?.daysOverdue) || 0) }))
        .filter((x) => x.id && x.title);
      if (!items.length) return json({ results: [] });
      let crew: { id: string; name: string; role: string }[] = [];
      if (projectId) {
        const { data: crewRows } = await admin.from("ks_module2_project_crew")
          .select("user_id, display_name, project_role")
          .eq("project_id", projectId).eq("company_id", companyId).eq("is_active", true).limit(30);
        crew = (crewRows || []).map((c: any) => ({ id: c.user_id, name: c.display_name || "Ukjent", role: c.project_role || "" }));
      }
      const state: Record<string, unknown> = { prosjekt: projectName, forfalt: {} as Record<string, unknown>, mannskap: crew.map((c) => ({ navn: c.name, rolle: c.role })) };
      const qs: Record<string, unknown> = {};
      items.forEach((it, i) => {
        (state.forfalt as any)[`f${i}`] = { tittel: it.title, dager_forfalt: it.daysOverdue };
        qs[`k${i}`] = {
          type: "noul",
          instructions: `Er den forfalte egenkontrollen i \`forfalt.f${i}\` kritisk, dvs. at arbeidet ikke bør fortsette før den er gjort, eller at den gjelder sikkerhet, bæring, fukt eller lovpålagt kontroll?`,
          criteria: {
            true: "Kritisk: gjelder sikkerhet, bærende konstruksjon, fukt/tetting, eller lovpålagt kontroll før videre arbeid.",
            false: "Ikke kritisk: dokumentasjon, finish eller kontroll som kan ettergjøres uten fare.",
          },
        };
        if (crew.length) {
          const crit: Record<string, string> = { none: "Ingen i mannskapet passer tydelig bedre enn andre." };
          crew.forEach((c, j) => { crit[`c${j}`] = `${c.name}${c.role ? ` (${c.role})` : ""}`; });
          qs[`a${i}`] = {
            type: "choice",
            instructions: `Hvem i \`mannskap\` bør få ansvar for å gjennomføre den forfalte kontrollen i \`forfalt.f${i}\`, ut fra rolle?`,
            criteria: crit,
          };
        }
      });
      const answers = await jev(state, qs);
      const results = items.map((it, i) => {
        const k = answers[`k${i}`]?.noul;
        const a = answers[`a${i}`];
        let assignee: { id: string; name: string } | null = null;
        if (a?.choice && a.choice !== "none") {
          const j = Number(String(a.choice).slice(1));
          if (j >= 0 && crew[j]) assignee = { id: crew[j].id, name: crew[j].name };
        }
        return { id: it.id, critical: typeof k === "number" ? k : null, assignee };
      });
      return json({ results });
    }

    // ---------------- PROSJEKT: SJEKK FULLFØRTE EGENKONTROLLER ----------------
    if (mode === "checklist_review") {
      const projectName = clip(body?.projectName, 200);
      const lists: { id: string; title: string; items: { label: string; value: string; comment: string }[] }[] = (Array.isArray(body?.checklists) ? body.checklists : []).slice(0, 5)
        .map((c: any) => ({
          id: clip(c?.id, 60), title: clip(c?.title, 200),
          items: (Array.isArray(c?.items) ? c.items : []).slice(0, 30).map((it: any) => ({
            label: clip(it?.label, 150), value: clip(it?.value, 50), comment: clip(it?.comment, 300),
          })),
        }))
        .filter((c) => c.id && c.title && c.items.length);
      if (!lists.length) return json({ results: [] });
      const state: Record<string, unknown> = { prosjekt: projectName, kontroller: {} as Record<string, unknown> };
      const qs: Record<string, unknown> = {};
      lists.forEach((c, i) => {
        (state.kontroller as any)[`k${i}`] = { tittel: c.title, svar: c.items };
        qs[`k${i}`] = {
          type: "noul",
          instructions: `Inneholder svarene i egenkontrollen \`kontroller.k${i}\` noe som bør følges opp som et avvik (feil, mangler, avvikende kommentarer, "nei"-svar på kritiske punkter)?`,
          criteria: {
            true: "Minst ett svar viser en feil, mangel eller et kritisk punkt som ikke er i orden.",
            false: "Alle svar er i orden, eller avvikene er bagatellmessige.",
          },
        };
        qs[`s${i}`] = {
          type: "choice",
          instructions: `Hvor alvorlig er det verste funnet i egenkontrollen \`kontroller.k${i}\`?`,
          criteria: {
            low: "Lav: bagatell, kan rettes ved anledning.",
            medium: "Middels: bør rettes snart, ingen umiddelbar fare.",
            high: "Høy: kan gi skade, stopp eller reklamasjon om det ikke rettes raskt.",
            critical: "Kritisk: fare for liv og helse, eller arbeidet må stoppe.",
          },
        };
      });
      const answers = await jev(state, qs);
      const results = lists.map((c, i) => ({
        id: c.id,
        noul: typeof answers[`k${i}`]?.noul === "number" ? answers[`k${i}`].noul : null,
        severity: ["low", "medium", "high", "critical"].includes(answers[`s${i}`]?.choice) ? answers[`s${i}`].choice : null,
      }));
      return json({ results });
    }

    // ---------------- PROSJEKT: AVVIK (alvorlighet + fremdrift) ----------------
    if (mode === "project_deviation") {
      const title = clip(body?.title, 300);
      const description = clip(body?.description, 3000);
      if (!title && !description) return json({ error: "Skriv tittel eller beskrivelse først" }, 400);
      const state = { avvik: { tittel: title, beskrivelse: description, sted: clip(body?.location, 200) }, prosjekt: clip(body?.projectName, 200) };
      const answers = await jev(state, {
        severity: {
          type: "choice",
          instructions: "Hvor alvorlig er avviket i `avvik`, og hvor raskt må det følges opp?",
          criteria: {
            low: "Lav: liten betydning, kan rettes ved anledning.",
            medium: "Middels: bør rettes innen kort tid, ingen umiddelbar fare.",
            high: "Høy: kan føre til skade, stopp eller betydelig tap om det ikke rettes raskt.",
            critical: "Kritisk: personskade har skjedd, eller det er umiddelbar fare for liv og helse.",
          },
        },
        affects_progress: {
          type: "noul",
          instructions: "Påvirker avviket i `avvik` fremdriften i `prosjekt`, dvs. at planlagt arbeid må vente eller endres?",
          criteria: {
            true: "Arbeid må stoppe eller omplanlegges til avviket er rettet, eller frister/fremdriftsplan rammes.",
            false: "Arbeidet kan fortsette som planlagt mens avviket rettes.",
          },
        },
      });
      const sev = answers.severity;
      if (!["low", "medium", "high", "critical"].includes(sev?.choice)) return json({ error: "Fikk ikke et gyldig forslag, fyll inn selv" }, 502);
      return json({
        severity: sev.choice, severityConfidence: sev.confidence ?? null,
        affectsProgress: typeof answers.affects_progress?.noul === "number" ? answers.affects_progress.noul : null,
      });
    }

    return json({ error: "Ukjent modus" }, 400);
  } catch (e: any) {
    if (e?.status && e?.message) return json({ error: e.message }, e.status);
    console.error("jev-assist error", e);
    return json({ error: "Uventet feil" }, 500);
  }
});
