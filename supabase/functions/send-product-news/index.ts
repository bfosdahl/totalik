import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { BRAND, brandedEmail, brandButton } from "../_shared/email-brand.ts";

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
  const out: string[] = [];
  let bullets: string[] = [];
  let para: string[] = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    out.push(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px 0;">${bullets
      .map((b) => `<tr><td valign="top" style="width:18px;padding:4px 0;color:${BRAND.accent};font-size:15px;line-height:1.6;">&#9679;</td><td style="padding:4px 0;color:${BRAND.text};font-size:15px;line-height:1.6;">${esc(b)}</td></tr>`)
      .join("")}</table>`);
    bullets = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p style="margin:0 0 16px 0;color:${BRAND.text};font-size:15px;line-height:1.7;">${para.map(esc).join("<br>")}</p>`);
    para = [];
  };
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) { flushBullets(); flushPara(); continue; }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) { flushPara(); bullets.push(bullet[1]); continue; }
    const isHeading = line.length <= 60 && /[A-ZÆØÅ]/.test(line) && line === line.toUpperCase();
    if (isHeading) {
      flushBullets(); flushPara();
      out.push(`<h2 style="margin:26px 0 10px 0;padding:0 0 8px 0;border-bottom:2px solid ${BRAND.border};color:${BRAND.deep};font-size:16px;letter-spacing:1px;font-weight:700;">${esc(line)}</h2>`);
      continue;
    }
    flushBullets();
    para.push(line);
  }
  flushBullets(); flushPara();
  return out.join("");
}

function imagesToHtml(images: string[]): string {
  if (!images.length) return "";
  return images
    .map(
      (url) =>
        `<div style="margin:0 0 16px 0;text-align:center;"><img src="${esc(url)}" alt="" style="max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto;"></div>`,
    )
    .join("");
}

function renderEmail(subject: string, body: string, r: Recipient, images: string[]): string {
  const bodyHtml = `
    <p style="margin:0 0 18px 0;color:${BRAND.text};font-size:15px;line-height:1.7;">Hei${r.firstName ? ` ${esc(r.firstName)}` : ""},</p>
    ${bodyToHtml(body)}
    ${imagesToHtml(images)}
    ${brandButton(LOGIN_URL, "Logg inn p&aring; Total IK")}`;
  return brandedEmail({
    heading: esc(subject),
    badge: "NYHETER",
    preheader: esc(subject),
    bodyHtml,
    footerNote: `Du mottar denne e-posten fordi ${esc(r.companyName || "din bedrift")} bruker Total IK.`,
  });
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
      html: renderEmail(subject, message, r, images),
    }));

    let sent = 0;
    const errors: string[] = [];
    const MAX_BATCH = 50;
    for (let i = 0; i < payload.length; i += MAX_BATCH) {
      const chunk = payload.slice(i, i + MAX_BATCH);
      const { data: batchResults, error } = await resend.batch.send(chunk);
      if (error) {
        console.error("Resend batch error:", error);
        errors.push(error.message ?? "ukjent feil");
      } else {
        sent += chunk.length;
        // Logg sendingen som nyhetsbrev (skilles fra system-e-poster i Tidligere sendt-listen)
        if (!testEmail) {
          const logs = chunk.map((p, i) => ({
            recipient_email: Array.isArray(p.to) ? p.to[0] : String(p.to),
            subject,
            status: "sent" as const,
            email_type: "newsletter",
            sent_by: user.email ?? null,
            resend_email_id: Array.isArray(batchResults) ? (batchResults[i]?.id ?? null) : null,
          }));
          if (logs.length) {
            const { error: logErr } = await supabase.from("email_logs").insert(logs);
            if (logErr) console.error("email_logs insert error:", logErr);
          }
        }
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
