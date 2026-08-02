// Watchdog for the alarm/background jobs themselves.
// Runs hourly and emails the system owner if:
//  - a job has not run successfully within its expected interval (job silent)
//  - a job's last run failed
//  - a job suddenly sends an abnormal number of notifications (runaway alerts)

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const ALERT_EMAIL = Deno.env.get("MONITORING_ALERT_EMAIL") ?? "ben@athenahms.no";

interface JobSpec {
  name: string;
  /** Max hours allowed between successful runs before we consider the job silent */
  maxSilentHours: number;
  /** Max notifications a single run is expected to send */
  maxNotificationsPerRun: number;
}

const JOBS: JobSpec[] = [
  { name: "check-deviation-deadlines", maxSilentHours: 26, maxNotificationsPerRun: 200 },
  { name: "check-ks2-deadlines", maxSilentHours: 26, maxNotificationsPerRun: 200 },
  { name: "check-hms-card-expiry", maxSilentHours: 26, maxNotificationsPerRun: 200 },
  { name: "check-course-expiry", maxSilentHours: 26, maxNotificationsPerRun: 200 },
  { name: "check-alerts", maxSilentHours: 3, maxNotificationsPerRun: 20 },
  { name: "ik-mat-sensor-watchdog", maxSilentHours: 2, maxNotificationsPerRun: 100 },
];

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const problems: { job: string; kind: string; message: string }[] = [];
    const status: Record<string, unknown>[] = [];

    for (const job of JOBS) {
      const { data: runs } = await supabase
        .from("job_run_log")
        .select("status, created_at, notifications_sent, error_count, error_message")
        .eq("job_name", job.name)
        .order("created_at", { ascending: false })
        .limit(5);

      const last = runs?.[0];
      const lastSuccess = runs?.find((r) => r.status === "success");
      const hoursSinceSuccess = lastSuccess
        ? (Date.now() - new Date(lastSuccess.created_at as string).getTime()) / 3_600_000
        : Infinity;

      status.push({
        job: job.name,
        last_status: last?.status ?? "never_run",
        last_run: last?.created_at ?? null,
        hours_since_success: Number.isFinite(hoursSinceSuccess)
          ? Math.round(hoursSinceSuccess * 10) / 10
          : null,
      });

      if (!lastSuccess || hoursSinceSuccess > job.maxSilentHours) {
        problems.push({
          job: job.name,
          kind: "stille jobb",
          message: lastSuccess
            ? `Ingen vellykket kjøring på ${Math.round(hoursSinceSuccess)} timer (grense ${job.maxSilentHours} t).`
            : `Jobben har aldri logget en vellykket kjøring.`,
        });
      }

      if (last?.status === "error") {
        problems.push({
          job: job.name,
          kind: "feilet kjøring",
          message: `Siste kjøring feilet: ${last.error_message ?? "ukjent feil"}`,
        });
      }

      if (last && (last.notifications_sent as number) > job.maxNotificationsPerRun) {
        problems.push({
          job: job.name,
          kind: "unormalt mange varsler",
          message: `Sendte ${last.notifications_sent} varsler i én kjøring (grense ${job.maxNotificationsPerRun}). Mulig feilvarsling.`,
        });
      }

      if (last && (last.error_count as number) > 0 && last.status === "success") {
        problems.push({
          job: job.name,
          kind: "delvise feil",
          message: `${last.error_count} feil under siste kjøring: ${last.error_message ?? ""}`,
        });
      }
    }

    let emailSent = false;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (problems.length > 0 && resendKey) {
      // Dedupe: only mail once per 6 hours for the same problem set
      const sixHoursAgo = new Date(Date.now() - 6 * 3_600_000).toISOString();
      const signature = problems.map((p) => `${p.job}:${p.kind}`).sort().join(",");

      const { data: recent } = await supabase
        .from("job_run_log")
        .select("id, details")
        .eq("job_name", "monitor-job-health")
        .gte("created_at", sixHoursAgo)
        .order("created_at", { ascending: false })
        .limit(10);

      const alreadyReported = (recent ?? []).some(
        (r) => (r.details as { signature?: string } | null)?.signature === signature,
      );

      if (!alreadyReported) {
        const rows = problems
          .map(
            (p) =>
              `<tr><td style="padding:6px 10px;border:1px solid #eee;"><strong>${esc(p.job)}</strong></td>` +
              `<td style="padding:6px 10px;border:1px solid #eee;">${esc(p.kind)}</td>` +
              `<td style="padding:6px 10px;border:1px solid #eee;">${esc(p.message)}</td></tr>`,
          )
          .join("");

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Total IK Monitoring <alerts@notify.totalik.no>",
            to: [ALERT_EMAIL],
            subject: `[MONITORING] ${problems.length} problem(er) med alarmjobbene`,
            html: `
              <h2>Overvåkning av alarmjobber</h2>
              <p>Følgende problemer ble oppdaget ${esc(new Date().toLocaleString("nb-NO"))}:</p>
              <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
                <tr><th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Jobb</th>
                    <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Type</th>
                    <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Detaljer</th></tr>
              ${rows}
              </table>
              <p style="color:#888;font-size:12px;">Sendt automatisk av monitor-job-health.</p>
            `,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) {
          console.error("Resend failed:", res.status, await res.text());
        }
      }

      await supabase.from("job_run_log").insert({
        job_name: "monitor-job-health",
        status: "success",
        duration_ms: 0,
        items_processed: JOBS.length,
        notifications_sent: emailSent ? 1 : 0,
        error_count: problems.length,
        error_message: problems.map((p) => `${p.job}: ${p.message}`).join(" | ").slice(0, 2000),
        details: { signature, problems, status },
      });
    } else {
      await supabase.from("job_run_log").insert({
        job_name: "monitor-job-health",
        status: "success",
        duration_ms: 0,
        items_processed: JOBS.length,
        notifications_sent: 0,
        error_count: problems.length,
        details: { problems, status },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, problems, status, emailSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("monitor-job-health error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
