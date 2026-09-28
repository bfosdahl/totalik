import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { brandedEmail } from "../_shared/email-brand.ts";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";
import { loginBlockHtml } from "../_shared/default-password.ts";
import { escapeHtml } from "../_shared/html-escape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Ikke innlogget" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    let callerId: string | undefined;
    const { data: claims } = await userClient.auth.getClaims(token).catch(() => ({ data: null }));
    callerId = claims?.claims?.sub as string | undefined;
    if (!callerId) {
      const { data: u } = await admin.auth.getUser(token);
      callerId = u?.user?.id;
    }
    if (!callerId) return json({ error: "Sesjonen er utløpt. Logg inn på nytt." }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isSys = roles?.some((r) => r.role === "system_admin");
    const isAdmin = isSys || roles?.some((r) => r.role === "company_admin");
    if (!isAdmin) return json({ error: "Kun administrator kan sende invitasjoner" }, 403);

    const body = await req.json().catch(() => null);
    const userIds: string[] = Array.isArray(body?.userIds)
      ? body.userIds.filter((x: unknown) => typeof x === "string").slice(0, 200)
      : [];
    if (userIds.length === 0) return json({ error: "Ingen ansatte valgt" }, 400);

    const { data: me } = await admin.from("profiles").select("company_id").eq("user_id", callerId).limit(1).maybeSingle();
    const companyId = isSys && body?.companyId ? body.companyId : me?.company_id;
    if (!companyId) return json({ error: "Fant ikke bedrift" }, 400);

    const { data: company } = await admin.from("companies").select("name").eq("id", companyId).single();
    const companyName = company?.name || "din bedrift";

    const { data: targets } = await admin
      .from("profiles")
      .select("user_id, email, first_name, is_active")
      .eq("company_id", companyId)
      .in("user_id", userIds);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "E-posttjenesten er ikke satt opp" }, 500);
    const resend = new Resend(resendKey);

    let sent = 0;
    const failed: string[] = [];
    for (const p of targets || []) {
      if (!p.email || p.is_active === false) { failed.push(p.email || p.user_id); continue; }
      try {
        const { data: link } = await admin.auth.admin.generateLink({
          type: "recovery", email: p.email, options: { redirectTo: "https://totalik.no/auth" },
        });
        const resetLink = link?.properties?.action_link || "https://totalik.no/auth";
        const { error } = await resend.emails.send({
          from: "Total-IK <noreply@totalik.no>",
          to: [p.email],
          subject: `Velkommen til ${companyName} - Din konto er opprettet`,
          html: brandedEmail({
            heading: `Velkommen til ${escapeHtml(companyName)}`,
            bodyHtml: `
              <p style="margin:0 0 14px 0;">Hei ${escapeHtml(p.first_name || "")},</p>
              <p style="margin:0 0 14px 0;">Du har f&aring;tt tilgang til HMS- og kvalitetssystemet til <strong>${escapeHtml(companyName)}</strong> i Total IK.</p>
              ${loginBlockHtml(p.email, resetLink)}
              ${getTermsNoticeHtml()}
              ${getTermsHtml()}
              <p style="margin:18px 0 0 0;color:#6B7280;font-size:13px;">Ved &aring; logge inn bekrefter du at du har lest og godtar avtalevilk&aring;rene ovenfor.</p>`,
          }),
        });
        if (error) throw error;
        await admin.from("profiles")
          .update({ invitation_sent_at: new Date().toISOString(), invitation_sent_by: callerId })
          .eq("user_id", p.user_id);
        sent++;
      } catch (e) {
        console.error("Invitation failed for", p.email, e);
        failed.push(p.email);
      }
    }
    return json({ success: true, sent, failed });
  } catch (e) {
    console.error("send-user-invitations error:", e);
    return json({ error: "Uventet feil: " + (e instanceof Error ? e.message : String(e)) }, 500);
  }
});
