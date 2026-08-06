// Overvåkning av signaturer i hele systemet.
// 1) Feilvarsling: signeringer som feiler (logget i signature_events)
// 2) Etterslep: dokumenter som blir liggende usignert for lenge
//
// Kjøres via pg_cron og logger til job_run_log slik at monitor-job-health
// kan varsle dersom denne jobben selv slutter å kjøre.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const ALERT_EMAIL = Deno.env.get("MONITORING_ALERT_EMAIL") ?? "ben@athenahms.no";

/** Hvor lenge et dokument kan ligge usignert før vi varsler */
const STALE_DAYS = 14;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Problem {
  kind: string;
  area: string;
  message: string;
}

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

  const started = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const staleBefore = new Date(Date.now() - STALE_DAYS * 24 * 3_600_000).toISOString();

    const problems: Problem[] = [];

    // ---- 1) Feilede signeringer siste 24 t ----
    const { data: failures } = await supabase
      .from("signature_events")
      .select("entity_type, entity_id, signer_role, error_message, created_at, company_id")
      .eq("status", "error")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(200);

    const failureCount = failures?.length ?? 0;
    const byType = new Map<string, { count: number; lastError: string }>();
    for (const f of failures ?? []) {
      const key = String(f.entity_type);
      const prev = byType.get(key);
      byType.set(key, {
        count: (prev?.count ?? 0) + 1,
        lastError: prev?.lastError ?? String(f.error_message ?? "ukjent feil"),
      });
    }
    for (const [type, info] of byType) {
      problems.push({
        kind: "signering feilet",
        area: type,
        message: `${info.count} mislykkede signeringer siste 24 t. Siste feil: ${info.lastError}`,
      });
    }

    // ---- 2) Dokumenter som ligger usignert for lenge ----
    const staleChecks: {
      area: string;
      run: () => Promise<number>;
    }[] = [
      {
        area: "Arbeidskontrakter",
        run: async () => {
          const { count } = await supabase
            .from("employment_contracts")
            .select("id", { count: "exact", head: true })
            .or("signed_by_employee.is.false,signed_by_employer.is.false")
            .lt("created_at", staleBefore);
          return count ?? 0;
        },
      },
      {
        area: "SJA (HMS)",
        run: async () => {
          const { count } = await supabase
            .from("hms_sja")
            .select("id", { count: "exact", head: true })
            .is("leader_signature", null)
            .neq("status", "completed")
            .lt("created_at", staleBefore);
          return count ?? 0;
        },
      },
      {
        area: "SJA (KS Bygg)",
        run: async () => {
          const { count } = await supabase
            .from("ks_module2_sja")
            .select("id", { count: "exact", head: true })
            .is("signature_data", null)
            .neq("status", "completed")
            .lt("created_at", staleBefore);
          return count ?? 0;
        },
      },
      {
        area: "Opplæring IK Alkohol",
        run: async () => {
          const { count } = await supabase
            .from("ik_alkohol_training_records")
            .select("id", { count: "exact", head: true })
            .is("signed_at", null)
            .lt("created_at", staleBefore);
          return count ?? 0;
        },
      },
      {
        area: "Verneombudsavtaler",
        run: async () => {
          const { count } = await supabase
            .from("hms_self_declarations")
            .select("id", { count: "exact", head: true })
            .is("signed_at", null)
            .lt("created_at", staleBefore);
          return count ?? 0;
        },
      },
    ];

    const staleSummary: Record<string, number> = {};
    for (const check of staleChecks) {
      try {
        const n = await check.run();
        staleSummary[check.area] = n;
        if (n > 0) {
          problems.push({
            kind: "usignert for lenge",
            area: check.area,
            message: `${n} dokument(er) har ligget usignert i mer enn ${STALE_DAYS} dager.`,
          });
        }
      } catch (e) {
        console.error("stale check failed:", check.area, e);
      }
    }

    // ---- 3) Varsle på e-post (deduplisert per 12 t) ----
    let emailSent = false;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const signature = problems.map((p) => `${p.area}:${p.kind}`).sort().join(",");

    if (problems.length > 0 && resendKey) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 3_600_000).toISOString();
      const { data: recent } = await supabase
        .from("job_run_log")
        .select("details")
        .eq("job_name", "check-signature-health")
        .gte("created_at", twelveHoursAgo)
        .order("created_at", { ascending: false })
        .limit(10);

      const alreadyReported = (recent ?? []).some(
        (r) => (r.details as { signature?: string } | null)?.signature === signature,
      );

      if (!alreadyReported) {
        const rows = problems
          .map(
            (p) =>
              `<tr><td style="padding:6px 10px;border:1px solid #eee;"><strong>${esc(p.area)}</strong></td>` +
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
            from: "Total-IK Monitoring <noreply@totalik.no>",
            to: [ALERT_EMAIL],
            subject: `[MONITORING] ${problems.length} signatur-problem(er)`,
            html: `
              <h2>Overv&#229;kning av signaturer</h2>
              <p>F&#248;lgende ble oppdaget ${esc(new Date().toLocaleString("nb-NO"))}:</p>
              <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
                <tr><th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Omr&#229;de</th>
                    <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Type</th>
                    <th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Detaljer</th></tr>
              ${rows}
              </table>
              <p style="color:#888;font-size:12px;">Sendt automatisk av check-signature-health.</p>
            `,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) {
          console.error("Resend failed:", res.status, await res.text());
        }
      }
    }

    await supabase.from("job_run_log").insert({
      job_name: "check-signature-health",
      status: "success",
      duration_ms: Date.now() - started,
      items_processed: failureCount + Object.values(staleSummary).reduce((a, b) => a + b, 0),
      notifications_sent: emailSent ? 1 : 0,
      error_count: problems.length,
      error_message: problems.map((p) => `${p.area}: ${p.message}`).join(" | ").slice(0, 2000),
      details: { signature, problems, failureCount, staleSummary },
    });

    return new Response(
      JSON.stringify({ ok: true, problems, failureCount, staleSummary, emailSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("check-signature-health error:", error);
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("job_run_log").insert({
        job_name: "check-signature-health",
        status: "error",
        duration_ms: Date.now() - started,
        items_processed: 0,
        notifications_sent: 0,
        error_count: 1,
        error_message: String((error as Error)?.message ?? error).slice(0, 2000),
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
