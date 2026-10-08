// Månedlig e-post til Ben og Joe: sjekklister kundene har laget siste måned,
// slik at gode maler kan vurderes for malbiblioteket. Publiserer ingenting selv.
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4";
import { brandedEmail } from "../_shared/email-brand.ts";
import { escapeHtml } from "../_shared/html-escape.ts";
import { recordJobRun } from "../_shared/jobRun.ts";
import { guardedResendSend, guardedResendBatch, guardedResendFetch } from "../_shared/emailSuppression.ts";

const RECIPIENTS = ["ben@athenahms.no", "joe@athenahms.no"];
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
  }
  const started = Date.now();
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - 31 * 86400000).toISOString();
    const { data, error } = await db
      .from("ks_module2_checklist_templates")
      .select("template_name, category, checkpoints, created_at, companies(name)")
      .eq("is_system_template", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = (data ?? []).filter((t: any) => !/test/i.test(t.template_name));
    const byCompany = new Map<string, any[]>();
    for (const t of rows) {
      const n = (t as any).companies?.name ?? "Ukjent bedrift";
      byCompany.set(n, [...(byCompany.get(n) ?? []), t]);
    }
    const list = rows.length
      ? [...byCompany].map(([c, ts]) =>
          `<p style="margin:16px 0 4px"><strong>${escapeHtml(c)}</strong> (${ts.length})</p><ul style="margin:0;padding-left:18px">` +
          ts.map((t) => `<li>${escapeHtml(t.template_name)} &ndash; ${escapeHtml(t.category)}, ${Array.isArray(t.checkpoints) ? t.checkpoints.length : 0} punkter</li>`).join("") +
          "</ul>").join("")
      : "<p>Ingen nye kundelagde sjekklister siste m&aring;ned.</p>";

    const html = brandedEmail({
      badge: "M&Aring;NEDLIG OVERSIKT",
      heading: "Nye sjekklister fra kundene",
      preheader: `${rows.length} nye kundelagde sjekklister`,
      bodyHtml: `<p>Disse sjekklistene er laget av kunder siste m&aring;ned. Svar i Lovable-chatten hvilke som skal renses og legges i malbiblioteket &ndash; ingenting publiseres uten at dere sier ja.</p>${list}`,
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const r = await guardedResendSend(db, "monthly-customer-templates-digest", resend, {
      from: "Total-IK <noreply@totalik.no>",
      to: RECIPIENTS,
      subject: `Kundelagde sjekklister – ${rows.length} nye siste måned`,
      html,
    });
    if (r.error) throw new Error(JSON.stringify(r.error));
    await recordJobRun("monthly-customer-templates-digest", "success", started, { itemsProcessed: rows.length, notificationsSent: RECIPIENTS.length });
    return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordJobRun("monthly-customer-templates-digest", "error", started, { errorCount: 1, errorMessage: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
