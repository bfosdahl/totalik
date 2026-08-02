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
  check: (client: any) => Promise<{ triggered: boolean; metric: number; threshold: number; message: string }>;
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
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const [errorsResult, emailsResult] = await Promise.all([
        client
          .from("client_error_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sixHoursAgo),
        client
          .from("email_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sixHoursAgo),
      ]);
      const totalActivity = (errorsResult.count || 0) + (emailsResult.count || 0);
      return {
        triggered: totalActivity === 0,
        metric: totalActivity,
        threshold,
        message: `Ingen aktivitet registrert siste 6 timer`,
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
