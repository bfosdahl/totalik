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

    const body = await req.json().catch(() => null);
    const userIdInput = body?.userId;
    const newEmailInput = body?.newEmail;

    if (typeof userIdInput !== "string" || typeof newEmailInput !== "string") {
      return json({ error: "Bruker-ID og ny e-post er påkrevd" }, 400);
    }

    const userId = userIdInput.trim();
    if (!userId) {
      return json({ error: "Bruker-ID og ny e-post er påkrevd" }, 400);
    }

    const email = newEmailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ error: "Ugyldig e-postadresse" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Parallel fetch of authorization and permission context
    const [targetRes, rolesRes, reqProfileRes, targetRolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, company_id").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", requestingUserId),
      supabaseAdmin.from("profiles").select("company_id").eq("user_id", requestingUserId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (targetRes.error || rolesRes.error || reqProfileRes.error || targetRolesRes.error) {
      console.error("Authorization lookup error:", {
        target: targetRes.error,
        roles: rolesRes.error,
        profile: reqProfileRes.error,
        targetRoles: targetRolesRes.error,
      });
      return json({ error: "Kunne ikke verifisere tilgang" }, 500);
    }

    const targetProfile = targetRes.data;
    if (!targetProfile) return json({ error: "Bruker ikke funnet" }, 404);

    const roles = rolesRes.data;
    const isSystemAdmin = !!roles?.some((r) => r.role === "system_admin");
    const isCompanyAdmin = !!roles?.some((r) => r.role === "company_admin");

    const requestingProfile = reqProfileRes.data;
    const sameCompany =
      !!requestingProfile?.company_id &&
      !!targetProfile.company_id &&
      requestingProfile.company_id === targetProfile.company_id;

    if (!isSystemAdmin && !(isCompanyAdmin && sameCompany)) {
      return json({ error: "Du har ikke tilgang til å endre e-post for denne brukeren" }, 403);
    }

    // Only system_admin may change a system_admin's login email (takeover guard)
    const targetIsSystemAdmin = !!targetRolesRes.data?.some((r) => r.role === "system_admin");
    if (targetIsSystemAdmin && !isSystemAdmin) {
      return json({ error: "Du har ikke tilgang til å endre e-post for denne brukeren" }, 403);
    }

    // 2. Email uniqueness check strictly after authorization
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingErr) {
      console.error("Email lookup error:", existingErr);
      return json({ error: "Kunne ikke kontrollere e-postadressen" }, 500);
    }

    if (existing && existing.user_id !== userId) {
      return json({ error: "E-postadressen er allerede i bruk av en annen bruker" }, 400);
    }

    // 3. Update auth login email
    const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (authUpdateErr) {
      console.error("Auth email update error:", authUpdateErr);
      return json({ error: "Kunne ikke oppdatere innloggings-e-post: " + authUpdateErr.message }, 400);
    }

    // 4. Keep profile in sync
    const { error: profileErr } = await supabaseAdmin.from("profiles").update({ email }).eq("user_id", userId);
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