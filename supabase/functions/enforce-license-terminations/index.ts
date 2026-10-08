// Daglig jobb:
//  1) Sender ETT varsel 14 dager før planlagt stenging (selger + post@ + gard@).
//  2) Stenger bedriften (status = inactive) når planlagt sluttdato er passert.
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { recordJobRun } from "../_shared/jobRun.ts";
import { guardedResendSend, guardedResendBatch, guardedResendFetch } from "../_shared/emailSuppression.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const WARNING_DAYS = 14;
const INTERNAL_RECIPIENTS = ["post@athenahms.no", "gard@athenahms.no"];
const FROM = "Total-IK <post@athenahms.no>";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatNo(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (cronSecret && expected && cronSecret === expected) return true;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return false;
    const { data: isAdmin } = await client.rpc("is_system_admin", { _user_id: data.user.id });
    return isAdmin === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!(await isAuthorized(req))) return json({ error: "Unauthorized" }, 401);

  const startedAt = Date.now();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* cron uten body */ }
  const dryRun = body?.dry_run === true;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    const today = localDate();
    const warnCutoff = localDate(WARNING_DAYS);

    let warningsSent = 0;
    let terminated = 0;
    const results: Array<Record<string, unknown>> = [];

    // ── 1) Varsel 14 dager før (kun én gang per bedrift)
    const { data: warnCompanies, error: warnErr } = await supabase
      .from("companies")
      .select("id, name, org_number, email, seller_id, license_months, license_start_date, scheduled_termination_date")
      .is("terminated_at", null)
      .is("termination_warning_sent_at", null)
      .not("scheduled_termination_date", "is", null)
      .lte("scheduled_termination_date", warnCutoff)
      .gte("scheduled_termination_date", today);

    if (warnErr) throw new Error(`Kunne ikke hente varsler: ${warnErr.message}`);

    for (const c of warnCompanies || []) {
      let sellerName = "Ukjent";
      let sellerEmail: string | null = null;
      if (c.seller_id) {
        const { data: seller } = await supabase
          .from("sellers")
          .select("name, email")
          .eq("id", c.seller_id)
          .maybeSingle();
        if (seller) {
          sellerName = seller.name || sellerName;
          sellerEmail = seller.email || null;
        }
      }

      const recipients = Array.from(new Set([...INTERNAL_RECIPIENTS, ...(sellerEmail ? [sellerEmail] : [])]));
      const endDate = c.scheduled_termination_date as string;

      if (dryRun || !resend) {
        results.push({ company: c.name, action: "warning_dry_run", recipients, end_date: endDate });
        continue;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1f2937;">
          <h2 style="color:#1e3a5f; margin-bottom: 4px;">Lisens utl&oslash;per om ${WARNING_DAYS} dager</h2>
          <p style="margin-top:0; color:#6b7280;">Mulighet for winback</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="padding:6px 0;"><strong>Bedrift</strong></td><td>${c.name}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Org.nr</strong></td><td>${c.org_number || "-"}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Kontakt</strong></td><td>${c.email || "-"}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Selger</strong></td><td>${sellerName}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Lisensstart</strong></td><td>${c.license_start_date ? formatNo(c.license_start_date as string) : "-"}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Lisensl&oslash;p</strong></td><td>${c.license_months || "-"} mnd</td></tr>
            <tr><td style="padding:6px 0;"><strong>Stenges</strong></td><td><strong>${formatNo(endDate)}</strong></td></tr>
          </table>
          <p>Kunden er markert som <strong>avsluttet kundeforhold</strong> i NextCom. Systemet stenges automatisk p&aring; datoen over.</p>
          <p style="color:#6b7280; font-size: 13px;">Dette er eneste varsel som sendes for denne bedriften.</p>
        </div>`;

      const { error: mailErr } = await guardedResendSend(supabase, "enforce-license-terminations", resend, {
        from: FROM,
        to: recipients,
        subject: `Lisens utløper ${formatNo(endDate)} – ${c.name}`,
        html,
      });

      if (mailErr) {
        results.push({ company: c.name, action: "warning_failed", error: String(mailErr) });
        continue;
      }

      await supabase
        .from("companies")
        .update({ termination_warning_sent_at: new Date().toISOString() })
        .eq("id", c.id);

      warningsSent++;
      results.push({ company: c.name, action: "warning_sent", recipients, end_date: endDate });
    }

    // ── 2) Stenging når datoen er passert
    const { data: dueCompanies, error: dueErr } = await supabase
      .from("companies")
      .select("id, name, scheduled_termination_date")
      .is("terminated_at", null)
      .not("scheduled_termination_date", "is", null)
      .lte("scheduled_termination_date", today);

    if (dueErr) throw new Error(`Kunne ikke hente forfalte lisenser: ${dueErr.message}`);

    for (const c of dueCompanies || []) {
      if (dryRun) {
        results.push({ company: c.name, action: "terminate_dry_run", end_date: c.scheduled_termination_date });
        continue;
      }
      const { error } = await supabase
        .from("companies")
        .update({ status: "inactive", terminated_at: new Date().toISOString() })
        .eq("id", c.id);

      if (error) {
        results.push({ company: c.name, action: "terminate_failed", error: error.message });
      } else {
        terminated++;
        results.push({ company: c.name, action: "terminated", end_date: c.scheduled_termination_date });
      }
    }

    await recordJobRun("enforce-license-terminations", "success", startedAt, {
      itemsProcessed: (warnCompanies?.length || 0) + (dueCompanies?.length || 0),
      notificationsSent: warningsSent,
      details: { terminated },
    });

    return json({ success: true, warnings_sent: warningsSent, terminated, dry_run: dryRun, results });
  } catch (error) {
    console.error("[enforce-license-terminations] Fatal:", error);
    await recordJobRun("enforce-license-terminations", "error", startedAt, { errorMessage: String(error) });
    return json({ error: String(error) }, 500);
  }
});
