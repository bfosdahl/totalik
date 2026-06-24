import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const APP_URL = "https://totalik.no";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  // Get schedules due today (or overdue) and not yet notified
  const { data: dueSchedules } = await supabase
    .from("audit_schedules")
    .select("id, company_id, module, next_due_at, reminder_due_sent_at, companies(name, email)")
    .lte("next_due_at", today)
    .is("reminder_due_sent_at", null)
    .eq("is_active", true);

  // Get schedules due in 30 days, not yet 30-day notified
  const { data: upcoming } = await supabase
    .from("audit_schedules")
    .select("id, company_id, module, next_due_at, reminder_30_sent_at, companies(name, email)")
    .gt("next_due_at", today)
    .lte("next_due_at", in30)
    .is("reminder_30_sent_at", null)
    .eq("is_active", true);

  let dueCount = 0, upcomingCount = 0;

  for (const sched of dueSchedules ?? []) {
    const companyName = (sched.companies as any)?.name || "din bedrift";
    const companyEmail = (sched.companies as any)?.email;

    // Find a company admin email if companies.email not set
    let toEmail = companyEmail;
    if (!toEmail) {
      const { data: admin } = await supabase
        .from("profiles")
        .select("email")
        .eq("company_id", sched.company_id)
        .eq("is_active", true)
        .limit(1).maybeSingle();
      toEmail = admin?.email;
    }
    if (!toEmail) continue;

    // Create the pending audit
    const { data: newAudit } = await supabase
      .from("audits")
      .insert({
        company_id: sched.company_id,
        title: `&Aring;rlig HMS-revisjon ${new Date().getFullYear()}`,
        type: "annual",
        status: "pending",
        scheduled_date: sched.next_due_at,
        trigger_source: "annual_auto",
        schedule_id: sched.id,
        checklist_total: 8,
        checklist_completed: 0,
      })
      .select("id, audit_number")
      .single();

    try {
      await resend.emails.send({
        from: "Total-IK <noreply@totalik.no>",
        to: [toEmail],
        bcc: ["ben@athenahms.no"],
        subject: `&Aring;rlig HMS-revisjon forfaller for ${companyName}`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#111">
          <h2 style="color:#0b3d6e">&Aring;rlig HMS-revisjon</h2>
          <p>Hei,</p>
          <p>Det er n&aring; tid for den &aring;rlige HMS-revisjonen for <strong>${esc(companyName)}</strong>.</p>
          <p>Du har to valg:</p>
          <div style="background:#f1f5f9;border-left:4px solid #0b3d6e;padding:12px 16px;margin:12px 0">
            <strong>1. Gj&oslash;r det selv &ndash; gratis</strong><br>
            Logg inn p&aring; Total-IK, &aring;pne revisjonen og fyll ut de 8 punktene. Tar ca. 30&ndash;60 minutter.
          </div>
          <div style="background:#fef3c7;border-left:4px solid #d97706;padding:12px 16px;margin:12px 0">
            <strong>2. La Total-IK gj&oslash;re jobben &ndash; 990,- eks. mva</strong><br>
            Vi gjennomg&aring;r systemet, dokumenterer revisjonen og sender den signert til deg. Faktureres etter levering.
          </div>
          <p style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/audits" style="background:#0b3d6e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">&Aring;pne revisjon</a>
          </p>
          <p style="color:#666;font-size:13px">Logger du inn finner du valgene i en pop-up p&aring; forsiden.</p>
        </div>`,
      });

      await supabase.from("audit_schedules")
        .update({ reminder_due_sent_at: new Date().toISOString() })
        .eq("id", sched.id);
      dueCount++;
    } catch (e) {
      console.error("Failed sending due email for", sched.id, e);
    }
  }

  for (const sched of upcoming ?? []) {
    const companyName = (sched.companies as any)?.name || "din bedrift";
    const companyEmail = (sched.companies as any)?.email;
    let toEmail = companyEmail;
    if (!toEmail) {
      const { data: admin } = await supabase
        .from("profiles").select("email")
        .eq("company_id", sched.company_id).eq("is_active", true)
        .limit(1).maybeSingle();
      toEmail = admin?.email;
    }
    if (!toEmail) continue;

    try {
      await resend.emails.send({
        from: "Total-IK <noreply@totalik.no>",
        to: [toEmail],
        bcc: ["ben@athenahms.no"],
        subject: `P&aring;minnelse: &Aring;rlig HMS-revisjon om 30 dager (${companyName})`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#111">
          <h2 style="color:#0b3d6e">P&aring;minnelse om HMS-revisjon</h2>
          <p>Hei,</p>
          <p>Den &aring;rlige HMS-revisjonen for <strong>${esc(companyName)}</strong> forfaller <strong>${esc(sched.next_due_at)}</strong> (om ca. 30 dager).</p>
          <p>Du kan begynne n&aring;, eller bestille bistand fra oss for 990,- eks. mva.</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/audits" style="background:#0b3d6e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">G&aring; til revisjon</a>
          </p>
        </div>`,
      });
      await supabase.from("audit_schedules")
        .update({ reminder_30_sent_at: new Date().toISOString() })
        .eq("id", sched.id);
      upcomingCount++;
    } catch (e) {
      console.error("Failed sending 30-day email for", sched.id, e);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, due_sent: dueCount, upcoming_sent: upcomingCount }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
