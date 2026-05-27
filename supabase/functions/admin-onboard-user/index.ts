import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml } from "../_shared/html-escape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Simple shared-secret guard
  const secret = req.headers.get("x-admin-secret");
  if (secret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { email, firstName, lastName, phone, companyId, companyName } = await req.json();
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Find or create user
    let userId: string;
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: created, error: createErr } = await supa.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (createErr) {
      if (createErr.message?.toLowerCase().includes("already")) {
        // Look up via profiles table to avoid listUsers pagination limit
        const { data: existingProfile } = await supa
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();
        if (!existingProfile?.user_id) {
          throw new Error(`User exists in auth but no profile found for ${email}`);
        }
        userId = existingProfile.user_id;
      } else throw createErr;
    } else { userId = created.user.id; }

    await supa.from("profiles").upsert({
      user_id: userId, email, first_name: firstName, last_name: lastName, phone,
      company_id: companyId, is_active: true, status: "active", is_hms_responsible: true,
    }, { onConflict: "user_id" });

    await supa.from("user_roles").insert({ user_id: userId, role: "company_admin" })
      .then(r => { if (r.error && !r.error.message.includes("duplicate")) console.error(r.error); });

    // Generate recovery link with redirect
    const { data: link } = await supa.auth.admin.generateLink({
      type: "recovery", email,
      options: { redirectTo: "https://totalik.no/auth" },
    });
    const action = link?.properties?.action_link;

    // Send email via Resend
    let emailId = null;
    if (action && Deno.env.get("RESEND_API_KEY")) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2>Velkommen til Total-IK, ${firstName}!</h2>
        <p>Din konto for <strong>${companyName}</strong> er opprettet, og vi har importert HMS-håndboken din fra det gamle systemet.</p>
        <p>Klikk på knappen for å sette ditt passord og logge inn:</p>
        <p><a href="${action}" style="background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Sett passord og logg inn</a></p>
        <p style="color:#666;font-size:13px;">Hvis knappen ikke fungerer, kopier denne lenken: <br/>${action}</p>
        <hr/><p style="color:#999;font-size:12px;">Total-IK – Digitalt internkontrollsystem</p>
      </div>`;
      const r = await resend.emails.send({
        from: "Total-IK <noreply@totalik.no>", to: email,
        subject: "Velkommen til Total-IK – sett passordet ditt", html,
      });
      emailId = r.data?.id || null;
    }

    return new Response(JSON.stringify({ success: true, userId, emailId, hasLink: !!action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-onboard-user error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
