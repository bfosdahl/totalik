import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const LOGIN_URL = "https://totalik.no/auth";

interface Recipient {
  email: string;
  firstName: string | null;
  companyName: string | null;
}

function bodyToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => `<p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px 0;">${esc(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function imagesToHtml(images: string[]): string {
  if (!images.length) return "";
  return images
    .map(
      (url) =>
        `<div style="margin:0 0 16px 0;text-align:center;"><img src="${esc(url)}" alt="" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;"></div>`,
    )
    .join("");
}

function renderEmail(subject: string, body: string, r: Recipient, images: string[]): string {
  return `
    <meta charset="utf-8">
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#1a1a2e;margin:0;font-size:22px;">${esc(subject)}</h1>
      </div>
      <p style="color:#333;font-size:16px;">Hei${r.firstName ? ` ${esc(r.firstName)}` : ""},</p>
      ${bodyToHtml(body)}
      ${imagesToHtml(images)}
      <div style="text-align:center;margin:28px 0;">
        <a href="${LOGIN_URL}" style="background:linear-gradient(135deg,#0066cc 0%,#0052a3 100%);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Logg inn p&aring; Total-IK</a>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
      <p style="color:#999;font-size:12px;text-align:center;">
        Du mottar denne e-posten fordi ${esc(r.companyName || "din bedrift")} har en aktiv l&oslash;sning i Total-IK.<br>
        Har du sp&oslash;rsm&aring;l, svar p&aring; denne e-posten eller kontakt post@athenahms.no.
      </p>
    </div>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const moduleType = String((body as any)?.moduleType ?? "").trim();
    const subject = String((body as any)?.subject ?? "").trim();
    const message = String((body as any)?.body ?? "").trim();
    const audience = (body as any)?.audience === "all_users" ? "all_users" : "company_admins";
    const testEmail = (body as any)?.testEmail ? String((body as any).testEmail).trim() : null;
    const dryRun = Boolean((body as any)?.dryRun);
    const images: string[] = Array.isArray((body as any)?.images)
      ? (body as any).images
          .map((u: unknown) => String(u ?? "").trim())
          .filter((u: string) => /^https:\/\//.test(u))
          .slice(0, 10)
      : [];

    if (!moduleType || !/^[A-Z_]{2,30}$/.test(moduleType)) {
      return new Response(JSON.stringify({ error: "Ugyldig modul" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!dryRun && (subject.length < 3 || subject.length > 150)) {
      return new Response(JSON.stringify({ error: "Emnet må være mellom 3 og 150 tegn" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!dryRun && (message.length < 10 || message.length > 20000)) {
      return new Response(JSON.stringify({ error: "Meldingen må være mellom 10 og 20000 tegn" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "system_admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only system admins can send product news" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bedrifter med aktiv modul
    const { data: modules, error: modErr } = await supabase
      .from("company_modules")
      .select("company_id")
      .eq("module_type", moduleType)
      .eq("is_active", true)
      .eq("is_deleted", false);
    if (modErr) throw modErr;

    const companyIds = Array.from(new Set((modules ?? []).map((m: any) => m.company_id).filter(Boolean)));
    if (companyIds.length === 0) {
      return new Response(JSON.stringify({ companies: 0, recipients: 0, sent: 0, failed: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, email, first_name, company_id, is_active, companies (name)")
      .in("company_id", companyIds)
      .eq("is_active", true);
    if (profErr) throw profErr;

    let candidates = (profiles ?? []).filter((p: any) => p.email);

    if (audience === "company_admins") {
      const { data: roles, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", candidates.map((p: any) => p.user_id));
      if (roleErr) throw roleErr;
      const adminIds = new Set(
        (roles ?? [])
          .filter((r: any) => r.role === "company_admin" || r.role === "system_admin")
          .map((r: any) => r.user_id),
      );
      candidates = candidates.filter((p: any) => adminIds.has(p.user_id));
    }

    // Dedup på e-post
    const byEmail = new Map<string, Recipient>();
    for (const p of candidates as any[]) {
      const email = String(p.email).toLowerCase();
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          email,
          firstName: p.first_name ?? null,
          companyName: p.companies?.name ?? null,
        });
      }
    }
    let recipients = Array.from(byEmail.values());

    if (dryRun) {
      return new Response(
        JSON.stringify({ companies: companyIds.length, recipients: recipients.length, sent: 0, failed: 0, dryRun: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (testEmail) {
      const sample = recipients[0];
      recipients = [{ email: testEmail, firstName: null, companyName: sample?.companyName ?? null }];
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const resend = new Resend(resendApiKey);

    const payload = recipients.map((r) => ({
      from: "Total-IK <noreply@totalik.no>",
      to: [r.email],
      subject,
      html: renderEmail(subject, message, r),
    }));

    let sent = 0;
    const errors: string[] = [];
    const MAX_BATCH = 50;
    for (let i = 0; i < payload.length; i += MAX_BATCH) {
      const chunk = payload.slice(i, i + MAX_BATCH);
      const { error } = await resend.batch.send(chunk);
      if (error) {
        console.error("Resend batch error:", error);
        errors.push(error.message ?? "ukjent feil");
      } else {
        sent += chunk.length;
      }
    }

    console.log(`Product news (${moduleType}): ${sent} sent, ${errors.length} batch errors, test=${Boolean(testEmail)}`);

    return new Response(
      JSON.stringify({
        success: true,
        companies: companyIds.length,
        recipients: recipients.length,
        sent,
        failed: recipients.length - sent,
        test: Boolean(testEmail),
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("send-product-news error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
