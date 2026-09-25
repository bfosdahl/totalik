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

    return json({ error: "Ukjent modus" }, 400);
  } catch (e: any) {
    if (e?.status && e?.message) return json({ error: e.message }, e.status);
    console.error("jev-assist error", e);
    return json({ error: "Uventet feil" }, 500);
  }
});
