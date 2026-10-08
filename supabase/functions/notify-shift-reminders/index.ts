import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { guardedResendSend, guardedResendBatch, guardedResendFetch } from "../_shared/emailSuppression.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const TZ = "Europe/Oslo";

/** YYYY-MM-DD for a date in Oslo local time. */
function osloDateString(base: Date, addDays = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + addDays);
  return dt.toISOString().slice(0, 10);
}

function osloHour(base: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false })
      .format(base),
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

const hhmm = (t: unknown) => String(t ?? "").slice(0, 5);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET");
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const providedSecret = req.headers.get("x-cron-secret");
    let isCron = !!(cronSecret && providedSecret && providedSecret === cronSecret);
    let callerCompanyId: string | null = null;

    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        admin.from("user_roles").select("role").eq("user_id", userData.user.id),
        admin.from("profiles").select("company_id").eq("user_id", userData.user.id).maybeSingle(),
      ]);
      const roleSet = new Set((roles || []).map((r: any) => r.role));
      const isSystemAdmin = roleSet.has("system_admin");
      if (!isSystemAdmin && !roleSet.has("company_admin")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerCompanyId = isSystemAdmin ? null : (profile?.company_id ?? null);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body?.dryRun === true;
    // Manual runs may force a kind ("morning" | "evening") regardless of the clock.
    const forcedKind: string | null = body?.kind === "morning" || body?.kind === "evening"
      ? body.kind
      : null;
    const forcedCompanyId: string | null = body?.companyId || callerCompanyId || null;

    const now = new Date();
    const hour = osloHour(now);

    let settingsQuery = admin
      .from("company_notification_settings")
      .select("company_id, shift_reminder_enabled, shift_reminder_time, shift_reminder_evening_enabled, shift_reminder_evening_time");
    if (forcedCompanyId) settingsQuery = settingsQuery.eq("company_id", forcedCompanyId);

    const { data: companySettings, error: settingsError } = await settingsQuery;
    if (settingsError) throw settingsError;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const results: any[] = [];
    let pushed = 0;
    let emailed = 0;

    for (const cs of companySettings || []) {
      const jobs: Array<{ kind: "morning" | "evening"; date: string }> = [];

      const morningHour = Number(hhmm(cs.shift_reminder_time).slice(0, 2));
      const eveningHour = Number(hhmm(cs.shift_reminder_evening_time).slice(0, 2));

      if (forcedKind) {
        jobs.push({
          kind: forcedKind as "morning" | "evening",
          date: osloDateString(now, forcedKind === "evening" ? 1 : 0),
        });
      } else {
        if (cs.shift_reminder_enabled && morningHour === hour) {
          jobs.push({ kind: "morning", date: osloDateString(now, 0) });
        }
        if (cs.shift_reminder_evening_enabled && eveningHour === hour) {
          jobs.push({ kind: "evening", date: osloDateString(now, 1) });
        }
      }

      for (const job of jobs) {
        const { data: shifts, error: shiftError } = await admin
          .from("work_schedules")
          .select("id, employee_id, employee_name, schedule_date, start_time, end_time, location, shift_role, project_name, notes")
          .eq("company_id", cs.company_id)
          .eq("schedule_date", job.date)
          .eq("schedule_type", "planned");

        if (shiftError) {
          console.error("shift query failed", shiftError.message);
          continue;
        }
        if (!shifts || shifts.length === 0) continue;

        const employeeIds = [...new Set(shifts.map((s: any) => s.employee_id).filter(Boolean))];
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, user_id, email, first_name, last_name")
          .in("id", employeeIds);

        const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));

        const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);
        const { data: userSettings } = await admin
          .from("user_notification_settings")
          .select("user_id, notify_shifts_push, notify_shifts_email")
          .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
        const settingsByUser = new Map((userSettings || []).map((s: any) => [s.user_id, s]));

        for (const shift of shifts as any[]) {
          const profile = profileById.get(shift.employee_id);
          if (!profile) continue;
          const userSetting = profile.user_id ? settingsByUser.get(profile.user_id) : null;

          const whereParts = [shift.project_name, shift.location].filter(Boolean);
          const where = whereParts.join(" - ");
          const when = `${hhmm(shift.start_time)}-${hhmm(shift.end_time)}`;
          const dayLabel = job.kind === "morning" ? "I dag" : "I morgen";
          const title = `${dayLabel} ${when}`;
          const text = where
            ? `${where}${shift.shift_role ? ` (${shift.shift_role})` : ""}`
            : shift.shift_role || "Vakt i arbeidsplanen";

          if (dryRun) {
            results.push({ employee: shift.employee_name, title, text, date: job.date, kind: job.kind });
            continue;
          }

          // Push
          if (profile.user_id && userSetting?.notify_shifts_push !== false && cronSecret) {
            try {
              const res = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-cron-secret": cronSecret,
                },
                body: JSON.stringify({
                  user_id: profile.user_id,
                  title: `Arbeidsplan: ${title}`,
                  body: text,
                  notification_type: "shift_reminder",
                  link: "/work-schedule",
                  dedupe_key: `shift-push:${shift.id}:${job.kind}`,
                }),
              });
              const json = await res.json().catch(() => ({}));
              if (json?.sent) pushed += json.sent;
            } catch (err) {
              console.error("push failed", (err as Error).message);
            }
          }

          // E-post
          if (resendApiKey && profile.email && userSetting?.notify_shifts_email !== false) {
            const dedupeKey = `shift-email:${shift.id}:${job.kind}`;
            const { error: dupError } = await admin.from("notification_log").insert({
              user_id: profile.user_id,
              company_id: cs.company_id,
              notification_type: "shift_reminder_email",
              title: `Arbeidsplan: ${title}`,
              body: text,
              link: "/work-schedule",
              dedupe_key: dedupeKey,
            });
            if (dupError) {
              if ((dupError as any).code !== "23505") {
                console.error("log insert failed", dupError.message);
              }
              continue;
            }

            const res = await guardedResendFetch(admin, "notify-shift-reminders", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Total-IK <noreply@totalik.no>",
                to: [profile.email],
                subject: `Påminnelse: arbeidsplan ${formatDate(job.date)}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1a1a2e; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Påminnelse om arbeidsdag</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                      <p>Hei ${esc(profile.first_name || "")},</p>
                      <p>${job.kind === "morning" ? "Dette er arbeidsdagen din i dag" : "Dette er arbeidsdagen din i morgen"}:</p>
                      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #1a1a2e; margin: 16px 0;">
                        <p style="margin: 4px 0;"><strong>Dato:</strong> ${esc(formatDate(job.date))}</p>
                        <p style="margin: 4px 0;"><strong>Tid:</strong> ${esc(when)}</p>
                        ${shift.project_name ? `<p style="margin: 4px 0;"><strong>Prosjekt:</strong> ${esc(shift.project_name)}</p>` : ""}
                        ${shift.location ? `<p style="margin: 4px 0;"><strong>Sted:</strong> ${esc(shift.location)}</p>` : ""}
                        ${shift.shift_role ? `<p style="margin: 4px 0;"><strong>Rolle:</strong> ${esc(shift.shift_role)}</p>` : ""}
                        ${shift.notes ? `<p style="margin: 4px 0;"><strong>Merknad:</strong> ${esc(shift.notes)}</p>` : ""}
                      </div>
                      <p style="text-align:center; margin: 24px 0;">
                        <a href="https://totalik.no/work-schedule" style="background:#1a1a2e;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;">Se arbeidsplanen</a>
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Automatisk p&#229;minnelse fra Total-IK.</p>
                    </div>
                  </div>
                `,
              }),
            });
            if (res.ok) emailed++;
            else console.error("Resend error", res.status);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, hour, pushed, emailed, dryRun, results: dryRun ? results : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("notify-shift-reminders error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
