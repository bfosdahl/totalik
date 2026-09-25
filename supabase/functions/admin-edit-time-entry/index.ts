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
    project_number?: string | null;
    subproject?: string | null;
    tags?: string[] | null;
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

    const body: EditPayload | null = await req.json().catch(() => null);
    if (!body || !body.time_entry_id || !body.reason || body.reason.trim().length < 3) {
      return json({ error: "Mangler time_entry_id eller årsak (min 3 tegn)" }, 400);
    }

    // Strict validation of the requested changes
    const c = body.changes || {};
    const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const isTime = (v: unknown) => typeof v === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
    if (c.entry_date !== undefined && !isDate(c.entry_date)) {
      return json({ error: "Ugyldig dato (forventet YYYY-MM-DD)" }, 400);
    }
    if (c.hours !== undefined) {
      const h = Number(c.hours);
      if (!Number.isFinite(h) || h <= 0 || h > 24) {
        return json({ error: "Timer må være et tall mellom 0 og 24" }, 400);
      }
      c.hours = h;
    }
    if (c.start_time !== undefined && c.start_time !== null && !isTime(c.start_time)) {
      return json({ error: "Ugyldig starttid (forventet HH:MM)" }, 400);
    }
    if (c.end_time !== undefined && c.end_time !== null && !isTime(c.end_time)) {
      return json({ error: "Ugyldig sluttid (forventet HH:MM)" }, 400);
    }
    if (c.hour_type !== undefined && !["normal", "overtime_50", "overtime_100"].includes(c.hour_type)) {
      return json({ error: "Ugyldig timetype" }, 400);
    }
    if (c.description !== undefined && c.description !== null && typeof c.description !== "string") {
      return json({ error: "Ugyldig beskrivelse" }, 400);
    }
    if (c.project_name !== undefined && c.project_name !== null && typeof c.project_name !== "string") {
      return json({ error: "Ugyldig prosjektnavn" }, 400);
    }
    if (typeof c.description === "string") c.description = c.description.trim().slice(0, 2000) || null;
    if (typeof c.project_name === "string") c.project_name = c.project_name.trim().slice(0, 200) || null;
    if (typeof c.project_number === "string") c.project_number = c.project_number.trim().slice(0, 60) || null;
    if (typeof c.subproject === "string") c.subproject = c.subproject.trim().slice(0, 200) || null;
    if (c.tags !== undefined && c.tags !== null) {
      if (!Array.isArray(c.tags)) return json({ error: "Ugyldige tagger" }, 400);
      c.tags = c.tags
        .filter((x: unknown) => typeof x === "string")
        .map((x: string) => x.trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 20);
      if (c.tags.length === 0) c.tags = null;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch the target row first so permissions can be checked for ITS company
    const { data: existing, error: exErr } = await admin
      .from("time_entries")
      .select("*")
      .eq("id", body.time_entry_id)
      .maybeSingle();
    if (exErr || !existing) return json({ error: "Fant ikke timeregistrering" }, 404);

    // Roles and the admin's profile for exactly this company, in parallel
    const [roleRes, adminProfileRes] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", adminId),
      admin
        .from("profiles")
        .select("company_id, first_name, last_name, email")
        .eq("user_id", adminId)
        .eq("company_id", existing.company_id)
        .maybeSingle(),
    ]);

    if (roleRes.error) {
      console.error("role lookup error", roleRes.error);
      return json({ error: "Kunne ikke verifisere admin-tilgang" }, 500);
    }
    if (adminProfileRes.error) {
      console.error("admin profile lookup error", adminProfileRes.error);
      return json({ error: "Kunne ikke verifisere admin-tilgang" }, 500);
    }

    const isSystemAdmin = !!roleRes.data?.some((r: any) => r.role === "system_admin");
    const isCompanyAdmin = !!roleRes.data?.some((r: any) => r.role === "company_admin");
    const adminProfile = adminProfileRes.data;

    // System admins may edit anywhere; company admins only inside their own company;
    // department leaders only for other employees in their own department(s).
    let isDeptLeader = false;
    if (!isSystemAdmin && !isCompanyAdmin && adminProfile && existing.user_id !== adminId) {
      const { data: lead } = await admin.rpc("is_department_leader_of", {
        _leader: adminId,
        _employee: existing.user_id,
      });
      isDeptLeader = lead === true;
    }
    if (!isSystemAdmin && !((isCompanyAdmin || isDeptLeader) && adminProfile)) {
      return json({ error: "Forbidden: krever admin for dette selskapet" }, 403);
    }

    // Build patch
    const patch: Record<string, any> = {
      admin_edit_reason: body.reason.trim(),
      admin_edited_by: adminId,
      admin_edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (c.entry_date !== undefined) patch.entry_date = c.entry_date;
    if (c.hours !== undefined) patch.hours = c.hours;
    if (c.start_time !== undefined) patch.start_time = c.start_time;
    if (c.end_time !== undefined) patch.end_time = c.end_time;
    if (c.description !== undefined) patch.description = c.description;
    if (c.hour_type !== undefined) patch.hour_type = c.hour_type;
    if (c.project_name !== undefined) patch.project_name = c.project_name;
    if (c.project_number !== undefined) patch.project_number = c.project_number;
    if (c.subproject !== undefined) patch.subproject = c.subproject;
    if (c.tags !== undefined) patch.tags = c.tags;

    // Optimistic locking on updated_at (skipped defensively if the row has none)
    const expectedUpdatedAt = existing.updated_at as string | null;
    let updateQuery = admin.from("time_entries").update(patch).eq("id", body.time_entry_id);
    if (expectedUpdatedAt) updateQuery = updateQuery.eq("updated_at", expectedUpdatedAt);

    const { data: updatedRows, error: updErr } = await updateQuery.select();
    if (updErr) {
      console.error("time_entries update error", updErr);
      return json({ error: "Kunne ikke lagre timeregistreringen" }, 500);
    }
    if (!updatedRows || updatedRows.length === 0) {
      return json(
        { error: "Timeregistreringen ble endret av en annen bruker imens. Oppdater siden og prøv igjen." },
        409,
      );
    }

    let updated: any = updatedRows[0];

    // Everything after the DB update is best-effort. A notification/e-mail/push failure must never
    // make the admin see "Edge Function returned a non-2xx status code" after the hours are saved.
    try {
      const { data: employee, error: employeeErr } = await admin
        .from("profiles")
        .select("user_id, email, first_name, last_name")
        .eq("user_id", existing.user_id)
        .eq("company_id", existing.company_id)
        .maybeSingle();
      if (employeeErr) console.error("employee lookup error", employeeErr.message);

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

      // 1) In-app varsel (best effort)
      try {
        const { error: notificationErr } = await admin.from("notification_log").insert({
          user_id: existing.user_id,
          company_id: existing.company_id,
          notification_type: "status_change",
          title: "Timene dine er justert av admin",
          body: `${adminName} endret timene dine for ${datoStr}. Årsak: ${body.reason.trim()}`,
          link: "/time-registration",
        });
        if (notificationErr) console.error("notification_log insert error", notificationErr.message);
      } catch (e) {
        console.error("notification_log insert error", stringifyError(e));
      }

      // 2) Push (best effort)
      try {
        const cronSecret = Deno.env.get("CRON_SECRET");
        if (cronSecret) {
          const pushResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
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
          });
          if (!pushResponse.ok) console.error("push failed", pushResponse.status, await pushResponse.text());
        }
      } catch (e) {
        console.error("push error", stringifyError(e));
      }

      // 3) E-post via Resend (best effort)
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey && employee?.email) {
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
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Total-IK <noreply@totalik.no>",
              to: [employee.email],
              subject: `Timene dine for ${datoStr} er justert`,
              html,
            }),
          });
          if (!emailResponse.ok) {
            console.error("resend failed", emailResponse.status, await emailResponse.text());
          }
        }
      } catch (e) {
        console.error("email error", stringifyError(e));
      }
    } catch (e) {
      console.error("post-update notification flow error", stringifyError(e));
    }

    return json({ ok: true, updated });
  } catch (e: any) {
    console.error("admin-edit-time-entry", stringifyError(e));
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

function stringifyError(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}\n${e.stack || ""}`;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
