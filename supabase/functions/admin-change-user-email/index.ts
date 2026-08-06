import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Ikke autorisert" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authed, error: authedErr } = await anonClient.auth.getUser();
    if (authedErr || !authed?.user) return json({ error: "Ikke autorisert" }, 401);
    const requestingUserId = authed.user.id;

    const { userId, newEmail } = await req.json();
    if (!userId || typeof newEmail !== "string") {
      return json({ error: "Bruker-ID og ny e-post er påkrevd" }, 400);
    }
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ error: "Ugyldig e-postadresse" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Target profile
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!targetProfile) return json({ error: "Bruker ikke funnet" }, 404);

    // Authorization: system_admin, or company_admin in same company
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId);
    const isSystemAdmin = !!roles?.some((r) => r.role === "system_admin");
    const isCompanyAdmin = !!roles?.some((r) => r.role === "company_admin");

    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", requestingUserId)
      .maybeSingle();

    const sameCompany =
      !!requestingProfile?.company_id &&
      !!targetProfile.company_id &&
      requestingProfile.company_id === targetProfile.company_id;

    if (!isSystemAdmin && !(isCompanyAdmin && sameCompany)) {
      return json({ error: "Du har ikke tilgang til å endre e-post for denne brukeren" }, 403);
    }

    // Ensure email is not taken by another profile
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (existing && existing.user_id !== userId) {
      return json({ error: "E-postadressen er allerede i bruk av en annen bruker" }, 400);
    }

    // Update auth login email (confirmed immediately — admin-initiated change)
    const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (authUpdateErr) {
      console.error("Auth email update error:", authUpdateErr);
      return json({ error: "Kunne ikke oppdatere innloggings-e-post: " + authUpdateErr.message }, 400);
    }

    // Keep profile in sync
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ email })
      .eq("user_id", userId);
    if (profileErr) {
      console.error("Profile email update error:", profileErr);
      return json({ error: "E-post endret i innlogging, men profilen ble ikke oppdatert" }, 500);
    }

    console.log(`Email changed for user ${userId} by ${requestingUserId}`);
    return json({ success: true, email });
  } catch (e) {
    console.error("admin-change-user-email error:", e);
    return json({ error: "En uventet feil oppstod" }, 500);
  }
});
