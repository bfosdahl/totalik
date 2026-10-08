import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { brandedEmail } from "../_shared/email-brand.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml } from "../_shared/html-escape.ts";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";
import { guardedResendSend, guardedResendBatch, guardedResendFetch } from "../_shared/emailSuppression.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Dedicated admin-actions secret (separate from CRON_SECRET to limit blast radius)
  const secret = req.headers.get("x-admin-secret");
  const expected = Deno.env.get("ADMIN_ACTIONS_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "forbidden" }, 403);
  }

  try {
    // 1. Safe JSON parsing & input validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Ugyldig JSON-body" }, 400);
    }

    const cleanEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !companyId) {
      return json({ error: "Mangler eller ugyldige felt (email, companyId)" }, 400);
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 2. Find or create user in Supabase Auth
    let userId: string;
    const { data: created, error: createErr } = await supa.auth.admin.createUser({
      email: cleanEmail,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (createErr) {
      if (createErr.message?.toLowerCase().includes("already")) {
        // Look up via profiles table to avoid listUsers pagination limit
        const { data: existingProfile } = await supa
          .from("profiles")
          .select("user_id")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (!existingProfile?.user_id) {
          return json({ error: "Brukeren finnes i auth, men mangler profil" }, 400);
        }
        userId = existingProfile.user_id;
      } else {
        throw createErr;
      }
    } else {
      userId = created.user.id;
    }

    // 3. Concurrently execute profile upsert, role assignment, and recovery link generation
    const [profileRes, roleRes, linkRes] = await Promise.all([
      supa.from("profiles").upsert({
        user_id: userId,
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        phone,
        company_id: companyId,
        is_active: true,
        status: "active",
        is_hms_responsible: true,
      }, { onConflict: "user_id" }),

      supa.from("user_roles").insert({ user_id: userId, role: "company_admin" }),

      supa.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: { redirectTo: "https://totalik.no/auth" },
      }),
    ]);

    if (profileRes.error) {
      console.error("Profile upsert error:", profileRes.error);
      return json({ error: "Kunne ikke lagre brukerprofil" }, 500);
    }
    if (roleRes.error && !roleRes.error.message.includes("duplicate")) {
      console.error("User role insert error:", roleRes.error);
    }
    if (linkRes.error) {
      console.error("generateLink error:", linkRes.error);
    }

    const action = linkRes.data?.properties?.action_link ?? null;

    // 4. Best-effort email delivery (Resend) - isolated from primary DB operation.
    // Sendes uansett om recovery-lenken feiler: standardpassordet er hovedinnholdet.
    let emailId: string | null = null;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const html = brandedEmail({
          heading: `Velkommen til Total IK`,
          subheading: escapeHtml(companyName),
          preheader: "Kontoen din i Total IK er opprettet",
          bodyHtml: `
            <p style="margin:0 0 14px 0;">Hei ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 14px 0;">Kontoen din for <strong>${escapeHtml(companyName)}</strong> er opprettet, og vi har importert HMS-h&aring;ndboken din fra det gamle systemet.</p>
            ${loginBlockHtml(cleanEmail, action)}
          `,
        });

        const r = await guardedResendSend(supa, "admin-onboard-user", resend, {
          from: "Total-IK <noreply@totalik.no>",
          to: cleanEmail,
          subject: "Velkommen til Total-IK - innloggingsinformasjon",
          html,
        });
        if (r.error) console.error("Resend rejected welcome email:", r.error);
        emailId = r.data?.id || null;
      } catch (emailErr) {
        console.error("Failed to send welcome email via Resend:", emailErr);
      }
    }

    return json({ success: true, userId, emailId, hasLink: !!action });
  } catch (e) {
    console.error("admin-onboard-user error:", e);
    return json({ error: "An unexpected error occurred" }, 500);
  }
});
