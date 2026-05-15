// One-shot helper to send invitations to Virgil, Brahim and an info-mail to Samtax.
// Safe to delete after use.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const results: any[] = [];

  async function ensureUserAndSendWelcome(opts: {
    email: string; firstName: string; lastName: string;
    companyId: string; companyName: string; cc?: string[];
  }) {
    const { email, firstName, lastName, companyId, companyName, cc } = opts;
    let userId: string;

    // Look up existing
    const { data: existingProfile } = await supa
      .from("profiles").select("user_id").eq("email", email).maybeSingle();

    if (existingProfile?.user_id) {
      userId = existingProfile.user_id;
    } else {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error: createErr } = await supa.auth.admin.createUser({
        email, password: tempPassword, email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });
      if (createErr) throw createErr;
      userId = created.user.id;
    }

    await supa.from("profiles").upsert({
      user_id: userId, email, first_name: firstName, last_name: lastName,
      company_id: companyId, is_active: true, status: "active", is_hms_responsible: true,
    }, { onConflict: "user_id" });

    await supa.from("user_roles").insert({ user_id: userId, role: "company_admin" })
      .then(r => { if (r.error && !r.error.message.includes("duplicate")) console.error(r.error); });

    const { data: link } = await supa.auth.admin.generateLink({
      type: "recovery", email,
      options: { redirectTo: "https://totalik.no/auth" },
    });
    const action = link?.properties?.action_link;
    if (!action) throw new Error("No action link");

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2>Velkommen til Total-IK, ${firstName}!</h2>
      <p>Din konto for <strong>${companyName}</strong> er n&aring; klar.</p>
      <p>Klikk p&aring; knappen under for &aring; sette ditt passord og logge inn:</p>
      <p><a href="${action}" style="background:#1e40af;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Sett passord og logg inn</a></p>
      <p style="color:#666;font-size:13px;">Hvis knappen ikke fungerer, kopier denne lenken:<br/>${action}</p>
      <hr/><p style="color:#999;font-size:12px;">Total-IK &ndash; Digitalt internkontrollsystem</p>
    </div>`;

    const r = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: email, cc,
      subject: "Velkommen til Total-IK – sett passordet ditt", html,
    });
    return { email, userId, emailId: r.data?.id, error: r.error };
  }

  try {
    // 1) Virgil — OSLO VB BYGG AS, CC til info@samtax.com
    results.push(await ensureUserAndSendWelcome({
      email: "virgil@oslovbbygg.no",
      firstName: "Virgil", lastName: "",
      companyId: "72bc3763-c5ba-4082-8789-b06be2f77c3b",
      companyName: "Oslo VB Bygg AS",
      cc: ["info@samtax.com"],
    }));
  } catch (e) { results.push({ step: "virgil", error: String(e) }); }

  try {
    // 2) Brahim — Kollen Malerpartner AS (eksisterende pending profil)
    results.push(await ensureUserAndSendWelcome({
      email: "brahim@kollenmp.no",
      firstName: "Brahim", lastName: "Xhema",
      companyId: "603d0a64-8446-445a-9e76-decf609b4886",
      companyName: "Kollen Malerpartner AS",
    }));
  } catch (e) { results.push({ step: "brahim", error: String(e) }); }

  try {
    // 3) Info-mail til Samtax (regnskap), uten passord-lenke
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2>Total-IK &ndash; informasjon til regnskapsf&oslash;rer</h2>
      <p>Hei,</p>
      <p>Dette er en orientering om at <strong>Oslo VB Bygg AS</strong> (kontaktperson Virgil) n&aring; har f&aring;tt opprettet sin konto i Total-IK,
      vårt digitale internkontroll- og HMS-system.</p>
      <p>Dere mottar denne meldingen som regnskapsf&oslash;rer. Det kreves ingen handling fra dere &mdash;
      faktura og l&oslash;pende kommunikasjon h&aring;ndteres som avtalt.</p>
      <p>Ved sp&oslash;rsm&aring;l, kontakt oss p&aring; <a href="mailto:post@totalik.no">post@totalik.no</a>.</p>
      <hr/><p style="color:#999;font-size:12px;">Total-IK &ndash; Digitalt internkontrollsystem</p>
    </div>`;
    const r = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: "info@samtax.com",
      subject: "Total-IK – konto opprettet for Oslo VB Bygg AS",
      html,
    });
    results.push({ step: "samtax", emailId: r.data?.id, error: r.error });
  } catch (e) { results.push({ step: "samtax", error: String(e) }); }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
