import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const EMAIL = "ws@lmkindustriarbeid.no";
const COMPANY_ID = "4103c43d-b252-4770-b973-d05272155e49";
const COMPANY_NAME = "Leon Markedskapital AS";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("x-admin-secret") !== Deno.env.get("ONEOFF_LEON_SECRET")) {
    return json({ error: "forbidden" }, 403);
  }

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  let userId: string;
  const { data: created, error: createErr } = await supa.auth.admin.createUser({
    email: EMAIL,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    const { data: p } = await supa.from("profiles").select("user_id").ilike("email", EMAIL).maybeSingle();
    if (!p?.user_id) return json({ error: createErr.message }, 400);
    userId = p.user_id;
    await supa.auth.admin.updateUserById(userId, { password: DEFAULT_PASSWORD });
  } else {
    userId = created.user.id;
  }

  const { error: profErr } = await supa.from("profiles").upsert(
    {
      user_id: userId,
      email: EMAIL,
      company_id: COMPANY_ID,
      is_active: true,
      status: "active",
    },
    { onConflict: "user_id" },
  );
  if (profErr) return json({ error: profErr.message }, 500);

  await supa.from("user_roles").insert({ user_id: userId, role: "company_admin" });

  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#222;">
    <h2 style="margin:0 0 12px 0;">Velkommen til Total-IK!</h2>
    <p>Vi har opprettet en bedriftsadministrator-bruker for <strong>${COMPANY_NAME}</strong> slik at du kan teste systemet.</p>
    ${loginBlockHtml(EMAIL)}
    <h3 style="margin:28px 0 8px 0;">Dette er aktivert for dere</h3>
    <ul style="line-height:1.7;">
      <li><strong>HMS (internkontroll)</strong></li>
      <li><strong>KS Bygg</strong> &ndash; kvalitetssikring og prosjektstyring</li>
      <li><strong>Personaladministrasjon</strong> &ndash; timef&oslash;ring, frav&aelig;r, ansatte</li>
      <li><strong>Personalh&aring;ndbok</strong></li>
    </ul>

    <h3 style="margin:28px 0 8px 0;">Slik kommer du i gang med HMS</h3>
    <p style="line-height:1.7;margin:0 0 12px 0;">Du kan sette opp HMS-modulen p&aring; to m&aring;ter:</p>
    <ol style="line-height:1.7;">
      <li><strong>Last opp en tidligere HMS-h&aring;ndbok</strong> &ndash; systemet leser den og fyller inn rutiner, m&aring;l, organisasjon og risikovurderinger automatisk.</li>
      <li><strong>Gjennomf&oslash;r chatten med v&aring;r AI-hjelper</strong> &ndash; du svarer p&aring; noen sp&oslash;rsm&aring;l, og AI-en bygger HMS-systemet for dere.</li>
    </ol>

    <h3 style="margin:28px 0 8px 0;">Stoffkartotek</h3>
    <p style="line-height:1.7;margin:0;">Stoffkartoteket har AI-funksjoner: du trenger bare &aring; laste opp sikkerhetsdatabladene, s&aring; leses faresymboler, verneutstyr og innhold ut automatisk.</p>

    <h3 style="margin:28px 0 8px 0;">Hvor finner du hva?</h3>
    <ul style="line-height:1.7;">
      <li><strong>Prosjektstyring</strong> &ndash; under <em>KS Bygg</em></li>
      <li><strong>HMS</strong> &ndash; under <em>HMS</em></li>
      <li><strong>Timef&oslash;ring, frav&aelig;r og resten</strong> &ndash; under <em>Personaladministrasjon</em></li>
    </ul>

    <p style="margin:24px 0 0 0;">Sp&oslash;r gjerne om du lurer p&aring; noe underveis &ndash; vi hjelper deg gjerne i gang.</p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e3e3e3;"/>
    <p style="color:#999;font-size:12px;">Total-IK &ndash; Digitalt internkontrollsystem</p>
  </div>`;

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const r = await resend.emails.send({
    from: "Total-IK <noreply@totalik.no>",
    to: EMAIL,
    subject: "Velkommen til Total-IK - innlogging og oppstart",
    html,
  });

  return json({ success: true, userId, emailId: r.data?.id ?? null, emailError: r.error ?? null });
});
