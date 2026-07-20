// Edge function: admin-edit-time-entry
// Lar company_admin/system_admin justere ansattes timer, logger årsak,
// og varsler ansatt via in-app + e-post + push.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditPayload {
  time_entry_id: string;
  reason: string;
  changes: {
    entry_date?: string;
    hours?: number;
    start_time?: string | null;
    end_time?: string | null;
    description?: string | null;
    hour_type?: "normal" | "overtime_50" | "overtime_100";
    project_name?: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const adminId = userData.user.id;

    const body: EditPayload = await req.json();
    if (!body.time_entry_id || !body.reason || body.reason.trim().length < 3) {
      return json({ error: "Mangler time_entry_id eller årsak (min 3 tegn)" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId);
    const isSystemAdmin = !!roleRows?.some((r: any) => r.role === "system_admin");
    const isCompanyAdmin = !!roleRows?.some((r: any) => r.role === "company_admin");
    if (!isSystemAdmin && !isCompanyAdmin) {
      return json({ error: "Forbidden: krever admin" }, 403);
    }

    // Hent eksisterende time-entry
    const { data: existing, error: exErr } = await admin
      .from("time_entries")
      .select("*")
      .eq("id", body.time_entry_id)
      .maybeSingle();
    if (exErr || !existing) return json({ error: "Fant ikke timeregistrering" }, 404);

    // Hent adminprofil for samme selskap som timen. Viktig for brukere med flere selskaper:
    // .maybeSingle() kun på user_id kan feile eller velge feil selskap.
    const { data: adminProfile, error: adminProfileErr } = await admin
      .from("profiles")
      .select("company_id, first_name, last_name, email")
      .eq("user_id", adminId)
      .eq("company_id", existing.company_id)
      .maybeSingle();

    if (adminProfileErr) {
      console.error("admin profile lookup error", adminProfileErr);
      return json({ error: "Kunne ikke verifisere admin-tilgang" }, 500);
    }

    if (!isSystemAdmin && !adminProfile) {
      return json({ error: "Forbidden: annet selskap" }, 403);
    }

    // Bygg patch
    const patch: Record<string, any> = {
      admin_edit_reason: body.reason.trim(),
      admin_edited_by: adminId,
      admin_edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const c = body.changes || {};
    if (c.entry_date !== undefined) patch.entry_date = c.entry_date;
    if (c.hours !== undefined) patch.hours = c.hours;
    if (c.start_time !== undefined) patch.start_time = c.start_time;
    if (c.end_time !== undefined) patch.end_time = c.end_time;
    if (c.description !== undefined) patch.description = c.description;
    if (c.hour_type !== undefined) patch.hour_type = c.hour_type;
    if (c.project_name !== undefined) patch.project_name = c.project_name;

    const { error: updErr } = await admin
      .from("time_entries")
      .update(patch)
      .eq("id", body.time_entry_id);
    if (updErr) {
      console.error("time_entries update error", updErr);
      return json({ error: updErr.message }, 500);
    }

    // Hent oppdatert + ansattprofil
    const { data: updated } = await admin
      .from("time_entries")
      .select("*")
      .eq("id", body.time_entry_id)
      .maybeSingle();
    const { data: employee } = await admin
      .from("profiles")
      .select("user_id, email, first_name, last_name")
      .eq("user_id", existing.user_id)
      .maybeSingle();

    const adminName = `${adminProfile?.first_name || ""} ${adminProfile?.last_name || ""}`.trim() || adminProfile?.email || "Admin";
    const empName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() || employee?.email || "Ansatt";

    const datoStr = (updated?.entry_date as string) || existing.entry_date;

    // Bygg diff-tekst
    const diffLines: string[] = [];
    const fmtVal = (v: any) => (v == null || v === "" ? "—" : String(v));
    const fmtTime = (v: any) => (v == null || v === "" ? "—" : String(v).substring(0, 5));
    if (c.entry_date !== undefined && c.entry_date !== existing.entry_date) diffLines.push(`Dato: ${fmtVal(existing.entry_date)} → ${fmtVal(c.entry_date)}`);
    if (c.hours !== undefined && Number(c.hours) !== Number(existing.hours)) diffLines.push(`Timer: ${fmtVal(existing.hours)} → ${fmtVal(c.hours)}`);
    if (c.start_time !== undefined && c.start_time !== existing.start_time) diffLines.push(`Fra: ${fmtTime(existing.start_time)} → ${fmtTime(c.start_time)}`);
    if (c.end_time !== undefined && c.end_time !== existing.end_time) diffLines.push(`Til: ${fmtTime(existing.end_time)} → ${fmtTime(c.end_time)}`);
    if (c.hour_type !== undefined && c.hour_type !== existing.hour_type) diffLines.push(`Type: ${fmtVal(existing.hour_type)} → ${fmtVal(c.hour_type)}`);
    if (c.description !== undefined && c.description !== existing.description) diffLines.push(`Beskrivelse: «${fmtVal(existing.description)}» → «${fmtVal(c.description)}»`);
    if (c.project_name !== undefined && c.project_name !== existing.project_name) diffLines.push(`Prosjekt: «${fmtVal(existing.project_name)}» → «${fmtVal(c.project_name)}»`);

    const diffText = diffLines.length > 0 ? diffLines.join("\n") : "(ingen synlige feltendringer)";

    // 1) In-app varsel
    try {
      await admin.from("notification_log").insert({
        user_id: existing.user_id,
        company_id: existing.company_id,
        notification_type: "status_change",
        title: "Timene dine er justert av admin",
        body: `${adminName} endret timene dine for ${datoStr}. Årsak: ${body.reason.trim()}`,
        link: "/time-registration",
      });
    } catch (e) {
      console.error("notification_log insert error", e);
    }

    // 2) Push (best effort)
    try {
      const cronSecret = Deno.env.get("CRON_SECRET");
      if (cronSecret) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-secret": cronSecret,
          },
          body: JSON.stringify({
            user_id: existing.user_id,
            title: "Timene dine er justert",
            body: `${adminName} endret timene dine ${datoStr}. Trykk for å se.`,
            notification_type: "status_change",
            link: "/time-registration",
          }),
        }).catch((e) => console.error("push fetch", e));
      }
    } catch (e) {
      console.error("push error", e);
    }

    // 3) E-post via Resend
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (resendKey && lovableKey && employee?.email) {
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1e3a8a">Timene dine er justert</h2>
            <p>Hei ${empName},</p>
            <p><strong>${adminName}</strong> har justert dine registrerte timer for <strong>${datoStr}</strong>.</p>
            <div style="background:#f3f4f6;border-left:4px solid #1e3a8a;padding:12px;margin:16px 0">
              <strong>Årsak:</strong><br>${escapeHtml(body.reason.trim())}
            </div>
            <div style="background:#fef3c7;padding:12px;margin:16px 0;border-radius:6px">
              <strong>Endringer:</strong>
              <pre style="white-space:pre-wrap;font-family:inherit;margin:8px 0 0 0">${escapeHtml(diffText)}</pre>
            </div>
            <p>Du kan se timene dine i Total-IK under «Timeregistrering».</p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">
              Dette er en automatisk melding fra Total-IK. Spørsmål? Kontakt din leder.
            </p>
          </div>`;
        await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": resendKey,
          },
          body: JSON.stringify({
            from: "Total-IK <noreply@totalik.no>",
            to: [employee.email],
            subject: `Timene dine for ${datoStr} er justert`,
            html,
          }),
        }).catch((e) => console.error("resend fetch", e));
      }
    } catch (e) {
      console.error("email error", e);
    }

    return json({ ok: true, updated });
  } catch (e: any) {
    console.error("admin-edit-time-entry", e);
    return json({ error: e?.message || "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
