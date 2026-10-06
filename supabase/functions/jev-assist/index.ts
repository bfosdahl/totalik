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
      const sentences: { text: string; source: string }[] = [];
      for (const k of ["arbeid", "fremdrift", "hms", "merknader"]) {
        for (const s of clip(t[k], 3000).split(/(?<=[.!?])\s+|\n+/)) {
          const x = s.trim();
          if (x.length >= 12 && !existing.includes(x.toLowerCase()) && !sentences.some((y: any) => y.text === x)) sentences.push({ text: x, source: k });
        }
      }
      const list = sentences.slice(0, 25);
      if (!list.length) return json({ suggestions: [] });
      const state: Record<string, string> = {};
      const qs: Record<string, unknown> = {};
      list.forEach((s, i) => {
        state[`s${i}`] = s.text;
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
      const suggestions = list.map((s, i) => ({ text: s.text, source: s.source, noul: answers[`q${i}`]?.noul }))
        .filter((s) => typeof s.noul === "number" && s.noul >= 0.6)
        .sort((a, b) => b.noul - a.noul).slice(0, 5);
      return json({ suggestions });
    }

    // ---------------- VERNERUNDE → RADER + TILTAKSSJEKK ----------------
    if (mode === "vernerunde_check") {
      const summaryFields: Record<string, string> = {
        avvik: clip(body?.avvik, 1500),
        tiltak: clip(body?.tiltak, 1500),
        ansvarlig: clip(body?.ansvarlig, 200),
        frist: clip(body?.frist, 40),
      };
      const rows: { id: string; category: string; question: string; answer: string; comment: string }[] =
        (Array.isArray(body?.rows) ? body.rows : []).slice(0, 15)
          .map((r: any, i: number) => ({
            id: clip(String(r?.id ?? i), 60),
            category: clip(String(r?.category ?? ""), 80),
            question: clip(String(r?.question ?? ""), 200),
            answer: r?.answer === "ja" ? "ja" : "nei",
            comment: clip(String(r?.comment ?? ""), 300),
          }))
          .filter((r: any) => r.question);
      const state: Record<string, unknown> = { skjema: summaryFields };
      const qs: Record<string, unknown> = {
        match: {
          type: "noul",
          instructions: "Har hvert avvik i `skjema` et tilhørende tiltak?",
          criteria: { true: "Ett eller flere avvik mangler tiltak.", false: "Tiltakene dekker avvikene, eller det er ingen avvik." },
        },
        concrete: {
          type: "noul",
          instructions: "Er tiltakene i `skjema` konkrete, med ansvarlig og frist når det er avvik?",
          criteria: { true: "Vage tiltak, eller mangler ansvarlig eller frist.", false: "Konkrete tiltak med ansvar og frist, eller ingen avvik." },
        },
      };
      rows.forEach((r, i) => {
        state[`r${i}`] = { kategori: r.category, punkt: r.question, kommentar: r.comment };
        qs[`p${i}`] = {
          type: "noul",
          instructions: `Bør sjekkpunktet i \`r${i}\` fra en vernerunde følges opp som avvik eller forhold som må korrigeres?`,
          criteria: {
            true: "Ja: punktet (eller kommentaren) beskriver et forhold som bør korrigeres, registreres eller utredes videre.",
            false: "Nei: punktet er bare ikke sjekket ennå, eller kommentaren er banal og trenger ingen oppfølging.",
          },
        };
      });
      let answers: Record<string, any> = {};
      try {
        answers = await jev(state, qs);
      } catch (err: any) {
        if (err?.status === 402 || err?.status === 403) return json({ error: err.message }, err.status);
        console.error("vernerunde check skipped", err);
      }
      const summary = ["match", "concrete"].map((id) => {
        const p = answers[id]?.noul;
        if (typeof p !== "number") return null;
        return { ok: p < 0.5, text: p >= 0.5
          ? (id === "match" ? "Noen avvik ser ut til å mangle tiltak." : "Tiltakene bør være konkrete og ha ansvarlig og frist.")
          : (id === "match" ? "Tiltakene dekker avvikene." : "Tiltakene er konkrete med ansvar og frist.") };
      }).filter(Boolean);
      const rowFindings = rows
        .map((r, i) => ({ ...r, noul: answers[`p${i}`]?.noul }))
        .filter((r) => typeof r.noul === "number" && r.noul >= 0.5);
      return json({ summary, rowFindings });
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

    // ---------------- KJØREBOK: type kjøring ----------------
    if (mode === "trip_type") {
      const purpose = clip(body?.purpose, 500);
      if (!purpose) return json({ error: "Skriv formål med turen først" }, 400);
      const answers = await jev({ tur: { formaal: purpose, fra: clip(body?.from, 200), til: clip(body?.to, 200), notat: clip(body?.notes, 500) } }, {
        trip_type: {
          type: "choice",
          instructions: "Hvilken type kjøring er turen i `tur` etter norske skatteregler?",
          criteria: {
            business: "Yrkeskjøring: kjøring i jobbens tjeneste, f.eks. kundebesøk, byggeplass, møte, henting av materialer, service.",
            commute: "Arbeidsreise: vanlig reise mellom hjem og fast arbeidssted.",
            private: "Privat: kjøring som ikke har med jobben å gjøre, f.eks. handling, fritid, familie.",
          },
        },
      });
      const c = answers.trip_type;
      if (!["business", "commute", "private"].includes(c?.choice)) return json({ error: "Fikk ikke et gyldig forslag, velg selv" }, 502);
      return json({ tripType: c.choice, confidence: c.confidence ?? null });
    }

    // ---------------- REISEREGNING: kontroll ----------------
    if (mode === "expense_check") {
      const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 40).map((i: any) => ({
        kategori: clip(i?.category, 50), beskrivelse: clip(i?.description, 200), dato: clip(i?.date, 20), belop_kr: Number(i?.amount) || 0,
      }));
      const state = {
        reise: {
          formaal: clip(body?.purpose, 300), destinasjon: clip(body?.destination, 200),
          fra_dato: clip(body?.departureDate, 20), til_dato: clip(body?.returnDate, 20),
          km: Number(body?.totalKm) || 0, diettdogn: Number(body?.dietDays) || 0, overnattinger: Number(body?.accommodationDays) || 0,
          totalt_kr: Number(body?.total) || 0,
        },
        utlegg: items,
      };
      const questions: Record<string, unknown> = {
        ok: {
          type: "noul",
          instructions: "Ser reiseregningen i `reise` og `utlegg` ryddig og troverdig ut, uten tydelige feil eller mangler?",
          criteria: {
            true: "Beløp, datoer, dager og utlegg henger sammen med formål og reiselengde.",
            false: "Noe virker feil: uvanlig høye beløp, utlegg utenfor reisedatoene, flere diettdøgn/overnattinger enn reisen varer, manglende beskrivelse, dobbeltføring eller private utgifter.",
          },
        },
      };
      items.forEach((_: unknown, i: number) => {
        questions[`i${i}`] = {
          type: "noul",
          instructions: `Er utlegg nr. ${i + 1} i \`utlegg\` (indeks ${i}) mistenkelig eller bør sjekkes før godkjenning?`,
          criteria: { true: "Uvanlig beløp, dato utenfor reisen, uklar/manglende beskrivelse, ser privat ut eller er trolig dobbeltført.", false: "Ser normalt ut for denne reisen." },
        };
      });
      const answers = await jev(state, questions);
      const flagged = items.map((it: any, i: number) => ({ index: i, noul: answers[`i${i}`]?.noul })).filter((x: any) => typeof x.noul === "number" && x.noul >= 0.6);
      return json({ ok: typeof answers.ok?.noul === "number" ? answers.ok.noul : null, flagged });
    }

    // ---------------- STOFFKARTOTEK: kontroll av vurdering ----------------
    if (mode === "chemical_check") {
      const state = {
        kjemikalie: { navn: clip(body?.productName, 200), fareklasser: (body?.dangerClasses || []).slice(0, 20).map((d: unknown) => clip(d, 80)) },
        vurdering: {
          eksponeringsveier: (body?.exposureTypes || []).slice(0, 10).map((d: unknown) => clip(d, 40)),
          eksponeringsniva: clip(body?.exposureLevel, 40), varighet: clip(body?.exposureDuration, 40),
          alvorlighet_1_5: Number(body?.hazardSeverity) || 0, sannsynlighet_1_5: Number(body?.exposureProbability) || 0,
          arbeidsoppgaver: (body?.workTasks || []).slice(0, 15).map((w: any) => clip(w?.description, 150)),
          tiltak: (body?.measures || []).slice(0, 15).map((m: any) => clip(m?.description || m?.measure || m, 150)),
          verneutstyr: (body?.ppe || []).slice(0, 15).map((p: unknown) => clip(p, 60)),
        },
      };
      const answers = await jev(state, {
        ppe_ok: { type: "noul", instructions: "Er verneutstyret i `vurdering` tilstrekkelig for fareklassene i `kjemikalie` og eksponeringsveiene?", criteria: { true: "Utstyret dekker de aktuelle eksponeringsveiene (hud, øyne, innånding).", false: "Mangler utstyr for en eller flere eksponeringsveier eller fareklasser." } },
        severity_ok: { type: "noul", instructions: "Står alvorlighet og sannsynlighet i `vurdering` i rimelig forhold til fareklassene i `kjemikalie` og bruken?", criteria: { true: "Tallene virker rimelige.", false: "Alvorlighet eller sannsynlighet er trolig satt for lavt eller for høyt." } },
        measures_ok: { type: "noul", instructions: "Er tiltakene i `vurdering` tilstrekkelige, etter prinsippet substitusjon, tekniske tiltak, organisatoriske tiltak og verneutstyr?", criteria: { true: "Det finnes relevante tiltak utover bare verneutstyr, eller risikoen er lav.", false: "Kun verneutstyr eller ingen tiltak selv om risikoen ikke er lav." } },
      });
      const n = (a: any) => (typeof a?.noul === "number" ? a.noul : null);
      return json({ ppeOk: n(answers.ppe_ok), severityOk: n(answers.severity_ok), measuresOk: n(answers.measures_ok) });
    }

    // ---------------- PERSONALHÅNDBOK: kontroll mot regler ----------------
    if (mode === "handbook_check") {
      const text = clip(String(body?.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), 6000);
      if (text.length < 20) return json({ error: "Kapittelet har for lite tekst" }, 400);
      const answers = await jev({ kapittel: { tittel: clip(body?.title, 200), tekst: text } }, {
        lawful: { type: "noul", instructions: "Er innholdet i `kapittel` i tråd med norsk arbeidsmiljølov, ferielov og folketrygdloven?", criteria: { true: "Ingenting strider mot lovens minstekrav.", false: "Noe gir ansatte dårligere vilkår enn loven, f.eks. for kort oppsigelsestid, for lite ferie, ulovlig overtid eller feil om sykemelding/egenmelding." } },
        clear: { type: "noul", instructions: "Er `kapittel` tydelig nok til at en ansatt forstår hva som gjelder og hva de skal gjøre?", criteria: { true: "Klart, konkret og forståelig.", false: "Uklart, mangler ansvar/frister/fremgangsmåte eller inneholder plassholdertekst." } },
        outdated: { type: "noul", instructions: "Inneholder `kapittel` tegn på utdatert informasjon, f.eks. gamle satser, gamle lovhenvisninger eller årstall som ikke lenger gjelder?", criteria: { true: "Trolig utdatert.", false: "Ingen tegn på utdatert innhold." } },
      });
      const n = (a: any) => (typeof a?.noul === "number" ? a.noul : null);
      return json({ lawful: n(answers.lawful), clear: n(answers.clear), outdated: n(answers.outdated) });
    }

    // ---------------- GENERELL SKJEMASJEKK (IK MAT, fravær, utstyr, vernerunde) ----------------
    if (mode === "form_check") {
      type Q = { id: string; q: string; t: string; f: string; bad: string; good: string };
      const KINDS: Record<string, { name: string; qs: Q[] }> = {
        temperature: { name: "temperaturlogg i IK MAT", qs: [
          { id: "action", q: "Er korrigerende tiltak i `skjema` tilstrekkelig for temperaturen og utstyrstypen (kjøl 0–4 °C, frys -18 °C eller kaldere, varmholding minst 60 °C)?", t: "Temperaturen er innenfor kravet, eller tiltaket beskriver konkret hva som er gjort med varene og utstyret.", f: "Temperaturen er utenfor kravet og tiltaket mangler eller er for vagt.", bad: "Temperaturen ser ut til å være utenfor kravet – beskriv hva som er gjort med varene og utstyret.", good: "Temperatur og tiltak henger sammen." },
          { id: "plausible", q: "Er temperaturen i `skjema` en realistisk avlesning for utstyrstypen (ikke en tastefeil)?", t: "Realistisk.", f: "Trolig tastefeil, f.eks. manglende minus på fryser eller urealistisk tall.", bad: "Temperaturen ser ut som en mulig tastefeil – sjekk fortegn og tall.", good: "Avlesningen virker realistisk." },
        ]},
        traceability: { name: "varemottak og sporbarhet i IK MAT", qs: [
          { id: "complete", q: "Har varemottaket i `skjema` nok informasjon for sporbarhet (leverandør, produkt, batch/lot eller GTIN, holdbarhet)?", t: "Nok til å spore varen ved tilbakekalling.", f: "Mangler batch/lot, holdbarhet eller leverandør.", bad: "Mangler info for sporbarhet – legg inn batch/lot, holdbarhet og leverandør.", good: "Sporbarhetsinfo er komplett." },
          { id: "temp", q: "Er mottakstemperaturen i `skjema` akseptabel for produkttypene (kjølevare maks 4 °C, frysevare -18 °C eller kaldere)?", t: "Akseptabel eller ikke relevant for tørrvare.", f: "For varm for produkttypen, eller mangler for kjøle-/frysevare.", bad: "Mottakstemperaturen er for høy eller mangler for kjøle-/frysevare.", good: "Mottakstemperaturen er i orden." },
          { id: "allergens", q: "Er det sannsynlig at produktet i `skjema` inneholder allergener som ikke er krysset av, ut fra produktnavnet?", t: "Produktnavnet tyder på allergener som mangler (f.eks. melk i ost, gluten i brød, fisk i laks).", f: "Allergenene virker riktige eller produktet er allergenfritt.", bad: "Produktnavnet tyder på allergener som ikke er krysset av – sjekk etiketten.", good: "Allergenene ser riktige ut." },
        ]},
        absence: { name: "fraværsregistrering", qs: [
          { id: "type", q: "Passer fraværstypen i `skjema` med årsaken og lengden på fraværet (egenmelding maks 3 dager per gang, ellers sykmelding)?", t: "Typen passer med årsak og lengde.", f: "Typen passer trolig ikke, f.eks. egenmelding over 3 dager eller ferie registrert som sykdom.", bad: "Fraværstypen passer kanskje ikke med årsak eller lengde – sjekk typen.", good: "Fraværstype og lengde henger sammen." },
          { id: "privacy", q: "Inneholder årsak eller notater i `skjema` helseopplysninger eller diagnoser som arbeidsgiver ikke trenger å vite?", t: "Inneholder diagnose eller detaljerte helseopplysninger.", f: "Ingen sensitive helseopplysninger.", bad: "Teksten ser ut til å ha helseopplysninger – arbeidsgiver trenger ikke diagnose. Vurder å fjerne den.", good: "Ingen unødvendige helseopplysninger." },
        ]},
        equipment: { name: "utlevering av utstyr og klær", qs: [
          { id: "category", q: "Passer typen (klær, verneutstyr, verktøy, annet) i `skjema` med utstyrsnavnet?", t: "Typen passer.", f: "Feil type, f.eks. hjelm som klær eller vinkelsliper som annet.", bad: "Typen passer kanskje ikke med utstyret – sjekk valget.", good: "Typen passer med utstyret." },
          { id: "details", q: "Mangler `skjema` en viktig detalj for denne typen utstyr (størrelse på klær/verneutstyr, serienummer på dyrt verktøy)?", t: "Mangler størrelse eller serienummer der det er naturlig.", f: "Detaljene er dekkende.", bad: "Legg gjerne inn størrelse eller serienummer så det er lett å spore.", good: "Detaljene er dekkende." },
        ]},
        vernerunde: { name: "vernerunde", qs: [
          { id: "match", q: "Har hvert avvik i `skjema` et tilhørende tiltak?", t: "Tiltakene dekker avvikene, eller det er ingen avvik.", f: "Ett eller flere avvik mangler tiltak.", bad: "Noen avvik ser ut til å mangle tiltak.", good: "Tiltakene dekker avvikene." },
          { id: "concrete", q: "Er tiltakene i `skjema` konkrete, med ansvarlig og frist når det er avvik?", t: "Konkrete tiltak med ansvarlig og frist, eller ingen avvik.", f: "Vage tiltak, eller mangler ansvarlig eller frist.", bad: "Tiltakene bør være konkrete og ha ansvarlig og frist.", good: "Tiltakene er konkrete med ansvar og frist." },
        ]},
        ansvar_soker: { name: "sjekkliste for ansvarlig søker (pbl § 23-4, SAK10 § 12-2)", qs: [
          { id: "nei_begrunnet", q: "Har alle «nei»-svar eller ubesvarte punkter i `skjema` en kommentar med tiltak eller begrunnelse?", t: "Ja, eller det finnes ingen nei-svar.", f: "Ett eller flere nei-svar mangler begrunnelse eller tiltak.", bad: "Noen «nei»-svar mangler begrunnelse eller tiltak – skriv hva som gjøres og når.", good: "Alle nei-svar er begrunnet." },
          { id: "ansvarsrett", q: "Viser `skjema` at alle fagområder har ansvarlige foretak med erklæring om ansvarsrett, og at ansvars- og kontrollområdene er fordelt (gjennomføringsplan)?", t: "Ansvarsfordeling og gjennomføringsplan er dekket.", f: "Mangler ansvarsrett for et fagområde, eller gjennomføringsplanen er ikke oppdatert.", bad: "Sjekk at alle fagområder har ansvarlig foretak og at gjennomføringsplanen er oppdatert.", good: "Ansvarsfordeling og gjennomføringsplan ser dekket ut." },
          { id: "grensesnitt", q: "Viser `skjema` at søker har samordnet grensesnittene mellom de ansvarlige foretakene og innhentet samsvars-/kontrollerklæringer?", t: "Grensesnitt og erklæringer er håndtert.", f: "Grensesnitt eller samsvars-/kontrollerklæringer mangler.", bad: "Husk samordning av grensesnitt og å hente inn samsvars- og kontrollerklæringer før ferdigattest.", good: "Grensesnitt og erklæringer er håndtert." },
        ]},
        ansvar_prosjekterende: { name: "sjekkliste for ansvarlig prosjekterende (pbl § 23-5, SAK10 § 12-3)", qs: [
          { id: "nei_begrunnet", q: "Har alle «nei»-svar eller ubesvarte punkter i `skjema` en kommentar med tiltak eller begrunnelse?", t: "Ja, eller det finnes ingen nei-svar.", f: "Ett eller flere nei-svar mangler begrunnelse eller tiltak.", bad: "Noen «nei»-svar mangler begrunnelse eller tiltak – skriv hva som gjøres og når.", good: "Alle nei-svar er begrunnet." },
          { id: "tek", q: "Viser `skjema` at prosjekteringen er dokumentert i samsvar med TEK17 (preaksepterte ytelser eller analyse), og at det er gjort sjekk av eget arbeid?", t: "TEK17-samsvar og egenkontroll er dokumentert.", f: "Mangler dokumentasjon mot TEK17 eller egenkontroll.", bad: "Dokumenter hvordan løsningene oppfyller TEK17, og at egenkontroll er gjort.", good: "TEK17-samsvar og egenkontroll er dokumentert." },
          { id: "grensesnitt", q: "Viser `skjema` at grensesnitt mot andre prosjekterende og utførende er avklart, og at produksjonsunderlaget er overlevert?", t: "Grensesnitt og overlevering er avklart.", f: "Grensesnitt eller overlevering av underlag mangler.", bad: "Avklar grensesnitt mot andre fag og bekreft at produksjonsunderlaget er overlevert utførende.", good: "Grensesnitt og overlevering er avklart." },
        ]},
        ansvar_kontrollerende: { name: "sjekkliste for ansvarlig kontrollerende (pbl § 23-8, SAK10 kap. 14)", qs: [
          { id: "nei_begrunnet", q: "Har alle «nei»-svar eller ubesvarte punkter i `skjema` en kommentar med tiltak eller begrunnelse?", t: "Ja, eller det finnes ingen nei-svar.", f: "Ett eller flere nei-svar mangler begrunnelse eller tiltak.", bad: "Noen «nei»-svar mangler begrunnelse eller tiltak – skriv hva som gjøres og når.", good: "Alle nei-svar er begrunnet." },
          { id: "uavhengig", q: "Viser `skjema` at kontrollen er uavhengig av det foretaket som kontrolleres, og at det finnes en kontrollplan?", t: "Uavhengighet og kontrollplan er dekket.", f: "Uavhengighet eller kontrollplan er ikke bekreftet.", bad: "Bekreft at kontrollen er uavhengig og at det finnes en kontrollplan.", good: "Uavhengighet og kontrollplan er dekket." },
          { id: "avvik_lukket", q: "Viser `skjema` at avvik funnet ved kontrollen er meldt, fulgt opp og lukket før kontrollerklæring/sluttrapport?", t: "Avvik er lukket, eller ingen avvik.", f: "Åpne avvik eller manglende oppfølging.", bad: "Åpne avvik må lukkes eller meldes til kommunen før kontrollerklæring gis.", good: "Avvik er fulgt opp og lukket." },
        ]},
      };
      const kind = KINDS[String(body?.kind)];
      if (!kind) return json({ error: "Ukjent skjema" }, 400);
      const raw = body?.fields && typeof body.fields === "object" ? body.fields : {};
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw).slice(0, 30)) fields[clip(k, 40)] = Array.isArray(v) ? v.slice(0, 20).map((x) => clip(x, 80)) : typeof v === "number" || typeof v === "boolean" ? v : clip(v, 1500);
      const questions: Record<string, unknown> = {};
      for (const q of kind.qs) questions[q.id] = { type: "noul", instructions: q.q, criteria: { true: q.t, false: q.f } };
      const answers = await jev({ skjematype: kind.name, skjema: fields }, questions);
      const findings = kind.qs.map((q) => {
        const p = answers[q.id]?.noul;
        if (typeof p !== "number") return null;
        // For «privacy», «allergens» og «details» betyr ja = problem
        const inverted = ["privacy", "allergens", "details"].includes(q.id);
        const ok = inverted ? p < 0.5 : p >= 0.5;
        return { ok, text: ok ? q.good : q.bad };
      }).filter(Boolean);
      return json({ findings });
    }

    return json({ error: "Ukjent modus" }, 400);
  } catch (e: any) {
    if (e?.status && e?.message) return json({ error: e.message }, e.status);
    console.error("jev-assist error", e);
    return json({ error: "Uventet feil" }, 500);
  }
});
