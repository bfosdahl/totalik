import { createClient } from "npm:@supabase/supabase-js@2";
import { recordJobRun } from "../_shared/jobRun.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertCheck {
  alert_type: string;
  severity: "warning" | "critical";
  title: string;
  check: (client: any) => Promise<{
    triggered: boolean;
    metric: number;
    threshold: number;
    message: string;
    details?: Record<string, unknown>;
  }>;
}

const DEDUP_WINDOW_MINUTES = 60;

const ALERT_CHECKS: AlertCheck[] = [
  {
    alert_type: "high_error_rate",
    severity: "critical",
    title: "Høy feilrate",
    check: async (client) => {
      const threshold = 20;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await client
        .from("client_error_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneHourAgo);
      const metric = count || 0;
      return {
        triggered: metric >= threshold,
        metric,
        threshold,
        message: `${metric} klientfeil siste time (terskel: ${threshold})`,
      };
    },
  },
  {
    alert_type: "email_bounce_spike",
    severity: "warning",
    title: "E-post bounce-spike",
    check: async (client) => {
      const threshold = 3;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await client
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "bounced")
        .gte("created_at", oneHourAgo);
      const metric = count || 0;
      return {
        triggered: metric >= threshold,
        metric,
        threshold,
        message: `${metric} bounced e-poster siste time (terskel: ${threshold})`,
      };
    },
  },
  {
    alert_type: "provisioning_failure",
    severity: "critical",
    title: "Brukeropprettelse feiler",
    check: async (client) => {
      const threshold = 1;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await client
        .from("user_provisioning_log")
        .select("id", { count: "exact", head: true })
        .eq("all_verified", false)
        .not("error_message", "is", null)
        .gte("created_at", oneHourAgo);
      const metric = count || 0;
      return {
        triggered: metric >= threshold,
        metric,
        threshold,
        message: `${metric} mislykkede brukeropprettelser siste time`,
      };
    },
  },
  {
    alert_type: "edge_function_errors",
    severity: "warning",
    title: "Edge function feil",
    check: async (client) => {
      const threshold = 5;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await client
        .from("client_error_logs")
        .select("id", { count: "exact", head: true })
        .eq("source", "edge_function")
        .gte("created_at", oneHourAgo);
      const metric = count || 0;
      return {
        triggered: metric >= threshold,
        metric,
        threshold,
        message: `${metric} edge function feil siste time (terskel: ${threshold})`,
      };
    },
  },
  {
    alert_type: "heartbeat_silent",
    severity: "critical",
    title: "Ingen aktivitet (heartbeat)",
    check: async (client) => {
      const threshold = 0;
      const windowHours = 6;
      const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

      const countSince = async (table: string, column = "created_at") => {
        const { count, error } = await client
          .from(table)
          .select("id", { count: "exact", head: true })
          .gte(column, since);
        return error ? null : count || 0;
      };

      const lastSeen = async (table: string, column = "created_at") => {
        const { data } = await client
          .from(table)
          .select(column)
          .order(column, { ascending: false })
          .limit(1);
        return data?.[0]?.[column] ?? null;
      };

      const [errors, emails, jobRuns, sensorReadings, tempLogs] = await Promise.all([
        countSince("client_error_logs"),
        countSince("email_logs"),
        countSince("job_run_log", "started_at"),
        countSince("ik_mat_sensors", "last_reading_at"),
        countSince("ik_mat_temperature_logs"),
      ]);

      const [lastError, lastEmail, lastJobRun, lastSensor, lastTemp] = await Promise.all([
        lastSeen("client_error_logs"),
        lastSeen("email_logs"),
        lastSeen("job_run_log", "started_at"),
        lastSeen("ik_mat_sensors", "last_reading_at"),
        lastSeen("ik_mat_temperature_logs"),
      ]);

      const sources = [
        { key: "client_error_logs", label: "Klientfeil-logg", count: errors, last_seen: lastError },
        { key: "email_logs", label: "E-postlogg", count: emails, last_seen: lastEmail },
        { key: "job_run_log", label: "Jobbkjøringer (cron)", count: jobRuns, last_seen: lastJobRun },
        { key: "ik_mat_sensors", label: "Sensoravlesninger", count: sensorReadings, last_seen: lastSensor },
        { key: "ik_mat_temperature_logs", label: "Temperaturlogg (IK Mat)", count: tempLogs, last_seen: lastTemp },
      ];

      const missing = sources.filter((s) => (s.count ?? 0) === 0);
      const totalActivity = sources.reduce((sum, s) => sum + (s.count ?? 0), 0);

      // Silent sensors (registered, active, but no reading in the window)
      const { data: silentSensors } = await client
        .from("ik_mat_sensors")
        .select("id, name, provider, location, last_reading_at, company_id")
        .eq("is_active", true)
        .or(`last_reading_at.is.null,last_reading_at.lt.${since}`)
        .limit(20);

      // Jobs that have not run in the window
      const { data: recentJobs } = await client
        .from("job_run_log")
        .select("job_name, started_at, status")
        .order("started_at", { ascending: false })
        .limit(200);

      const jobLast = new Map<string, { started_at: string; status: string }>();
      for (const row of recentJobs || []) {
        if (!jobLast.has(row.job_name)) jobLast.set(row.job_name, row);
      }
      const silentJobs = Array.from(jobLast.entries())
        .filter(([, v]) => v.started_at < since)
        .map(([job_name, v]) => ({ job_name, last_run: v.started_at, last_status: v.status }));

      return {
        triggered: totalActivity === 0,
        metric: totalActivity,
        threshold,
        message:
          totalActivity === 0
            ? `Ingen aktivitet registrert siste ${windowHours} timer (${missing.map((m) => m.label).join(", ")})`
            : `Aktivitet registrert siste ${windowHours} timer`,
        details: {
          window_hours: windowHours,
          since,
          sources,
          missing_sources: missing.map((m) => m.key),
          silent_sensors: silentSensors || [],
          silent_jobs: silentJobs,
        },
      };
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jobStart = Date.now();
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const results: { type: string; triggered: boolean; alertCreated: boolean }[] = [];

    for (const check of ALERT_CHECKS) {
      try {
        const result = await check.check(adminClient);

        if (result.triggered) {
          // Dedup: check if same alert_type was created within the window
          const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();
          const { data: existing } = await adminClient
            .from("system_alerts")
            .select("id")
            .eq("alert_type", check.alert_type)
            .eq("status", "active")
            .gte("created_at", dedupCutoff)
            .limit(1);

          if (existing && existing.length > 0) {
            results.push({ type: check.alert_type, triggered: true, alertCreated: false });
            continue;
          }

          await adminClient.from("system_alerts").insert({
            alert_type: check.alert_type,
            severity: check.severity,
            title: check.title,
            message: result.message,
            metric_value: result.metric,
            threshold_value: result.threshold,
            details: result.details ?? null,
            status: "active",
          });

          results.push({ type: check.alert_type, triggered: true, alertCreated: true });

          // Send email to system admins via Resend
          try {
            const resendApiKey = Deno.env.get("RESEND_API_KEY");
            if (resendApiKey) {
              // Get system admin emails
              const { data: adminRoles } = await adminClient
                .from("user_roles")
                .select("user_id")
                .eq("role", "system_admin");

              if (adminRoles && adminRoles.length > 0) {
                const adminIds = adminRoles.map((r: any) => r.user_id);
                const { data: adminProfiles } = await adminClient
                  .from("profiles")
                  .select("email")
                  .in("user_id", adminIds)
                  .eq("is_active", true);

                const emails = adminProfiles?.map((p: any) => p.email).filter(Boolean) || [];

                for (const email of emails) {
                  await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                      from: "Total IK Alerts <alerts@notify.totalik.no>",
                      to: email,
                      subject: `[${check.severity.toUpperCase()}] ${check.title}`,
                      html: `
                        <h2>⚠️ ${check.title}</h2>
                        <p>${result.message}</p>
                        <p><strong>Alvorlighet:</strong> ${check.severity}</p>
                        <p><strong>Tidspunkt:</strong> ${new Date().toLocaleString("nb-NO")}</p>
                        <hr/>
                        <p style="color:#888;font-size:12px;">Denne e-posten ble sendt automatisk fra Total IK monitoring.</p>
                      `,
                    }),
                  });
                }
              }
            }
          } catch (emailErr) {
            console.error("Failed to send alert email:", emailErr);
          }
        } else {
          results.push({ type: check.alert_type, triggered: false, alertCreated: false });
        }
      } catch (checkErr) {
        console.error(`Alert check failed: ${check.alert_type}`, checkErr);
        results.push({ type: check.alert_type, triggered: false, alertCreated: false });
      }
    }

    const triggered = results.filter((r: any) => r.triggered).length;
    await recordJobRun("check-alerts", "success", jobStart, {
      itemsProcessed: results.length,
      notificationsSent: triggered,
      details: { results },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-alerts error:", err);
    await recordJobRun("check-alerts", "error", jobStart, {
      errorCount: 1,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
