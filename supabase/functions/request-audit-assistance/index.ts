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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { auditId } = await req.json();
    if (!auditId || typeof auditId !== "string") {
      return new Response(JSON.stringify({ error: "auditId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Load audit + company
    const { data: audit } = await supabase
      .from("audits")
      .select("id, audit_number, company_id, title, assistance_status")
      .eq("id", auditId).single();
    if (!audit) {
      return new Response(JSON.stringify({ error: "Audit not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (audit.assistance_status && audit.assistance_status !== "none") {
      return new Response(JSON.stringify({ error: "Allerede bestilt", status: audit.assistance_status }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name, org_number, seller_id")
      .eq("id", audit.company_id).single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone")
      .eq("user_id", user.id).maybeSingle();

    // Seller lookup
    let sellerEmail: string | null = null;
    let sellerName: string | null = null;
    if (company?.seller_id) {
      const { data: seller } = await supabase
        .from("sellers")
        .select("name, email")
        .eq("id", company.seller_id).maybeSingle();
      sellerEmail = seller?.email ?? null;
      sellerName = seller?.name ?? null;
    }

    // Mark audit as requested
    await supabase.from("audits").update({
      assistance_requested: true,
      assistance_status: "paid",
      assistance_requested_at: new Date().toISOString(),
      paid_amount_nok: 990,
    }).eq("id", audit.id);

    // Create support ticket
    await supabase.from("support_tickets").insert({
      company_id: audit.company_id,
      user_id: user.id,
      user_name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || user.email,
      user_email: profile?.email ?? user.email,
      subject: `Bestilling: &Aring;rlig HMS-revisjon &ndash; ${company?.name ?? ""}`,
      message: `Kunden har bestilt bistand til &aring;rlig HMS-revisjon (990,- eks. mva).\n\n` +
               `Revisjon: ${audit.audit_number ?? audit.id}\n` +
               `Bedrift: ${company?.name ?? ""} (org.nr ${company?.org_number ?? "?"})\n` +
               `Selger: ${sellerName ?? "ikke registrert"}\n` +
               `Kontakt: ${profile?.first_name ?? ""} ${profile?.last_name ?? ""} &ndash; ${profile?.email ?? user.email} ${profile?.phone ?? ""}`,
      status: "open",
    });

    // Build BCC list: Ben always + Gard + seller
    const bccList = ["ben@athenahms.no", "gard@totalik.no"];
    if (sellerEmail && sellerEmail !== "ben@athenahms.no" && sellerEmail !== "gard@totalik.no") {
      bccList.push(sellerEmail);
    }

    // Internal team email
    await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: ["ben@athenahms.no"],
      bcc: bccList.filter(e => e !== "ben@athenahms.no"),
      subject: `Ny bestilling 990,- &ndash; HMS-revisjon for ${company?.name ?? ""}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#111">
        <h2 style="color:#0b3d6e">Ny bestilling: Bistand &aring;rlig HMS-revisjon</h2>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Bedrift</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(company?.name)}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Org.nr</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(company?.org_number)}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Revisjon</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(audit.audit_number ?? audit.id)}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Kontaktperson</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(profile?.first_name ?? "")} ${esc(profile?.last_name ?? "")}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>E-post</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(profile?.email ?? user.email)}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Telefon</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(profile?.phone ?? "&ndash;")}</td></tr>
          <tr><td style="padding:6px;border-bottom:1px solid #eee"><strong>Selger</strong></td><td style="padding:6px;border-bottom:1px solid #eee">${esc(sellerName ?? "ikke registrert")}</td></tr>
          <tr><td style="padding:6px"><strong>Bel&oslash;p</strong></td><td style="padding:6px">990,- eks. mva</td></tr>
        </table>
        <p>Det er opprettet en support-sak. Faktura sendes manuelt etter levering.</p>
        <p><a href="https://totalik.no/admin/audit-orders" style="background:#0b3d6e;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">&Aring;pne bestillinger</a></p>
      </div>`,
    });

    // Customer confirmation
    await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [profile?.email ?? user.email!],
      bcc: ["ben@athenahms.no"],
      subject: "Bekreftelse: Bistand til &aring;rlig HMS-revisjon",
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#111">
        <h2 style="color:#0b3d6e">Takk for bestillingen</h2>
        <p>Hei ${esc(profile?.first_name ?? "")},</p>
        <p>Vi har mottatt bestillingen p&aring; bistand til den &aring;rlige HMS-revisjonen for <strong>${esc(company?.name)}</strong>.</p>
        <p>Total-IK gj&oslash;r jobben for deg og sender den ferdige revisjonen p&aring; e-post n&aring;r den er klar. Bel&oslash;pet er <strong>990,- eks. mva</strong> og faktureres etter levering.</p>
        <p>Trenger vi mer informasjon tar vi kontakt p&aring; ${esc(profile?.email ?? user.email)}.</p>
        <p style="color:#666;font-size:13px">Total-IK &ndash; Athena Kurs og Internkontroll AS</p>
      </div>`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e: any) {
    console.error("request-audit-assistance error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
