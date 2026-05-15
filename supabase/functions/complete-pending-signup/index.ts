import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const { companyName, orgNumber } = await req.json();
    if (!companyName || companyName.trim().length < 2) {
      return json({ error: "Bedriftsnavn må være minst 2 tegn" }, 400);
    }
    if (!orgNumber || !/^\d{9}$/.test(orgNumber.trim())) {
      return json({ error: "Org.nr må være 9 siffer" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Make sure this user does not already have a company / role
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("company_id, first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile?.company_id) {
      return json({ error: "Du er allerede knyttet til en bedrift" }, 400);
    }

    const { data: existingRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (existingRoles && existingRoles.length > 0) {
      return json({ error: "Brukeren har allerede en rolle" }, 400);
    }

    // Create company
    const { data: newCompany, error: companyError } = await admin
      .from("companies")
      .insert({ name: companyName.trim(), org_number: orgNumber.trim() })
      .select("id, name")
      .single();
    if (companyError || !newCompany) {
      return json({ error: "Kunne ikke opprette bedrift" }, 500);
    }

    // Link profile
    const { error: profileError } = await admin
      .from("profiles")
      .update({ company_id: newCompany.id, status: "active" })
      .eq("user_id", userId);
    if (profileError) {
      await admin.from("companies").delete().eq("id", newCompany.id);
      return json({ error: "Kunne ikke aktivere konto" }, 500);
    }

    // Assign company_admin
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_admin" });
    if (roleError && !roleError.message?.toLowerCase().includes("duplicate")) {
      console.error("Role assign error:", roleError);
    }

    // Best-effort admin notification
    try {
      const notify = createClient(supabaseUrl, anonKey);
      await notify.functions.invoke("notify-new-company", {
        body: {
          companyName: newCompany.name,
          contactPerson: `${existingProfile?.first_name || ""} ${existingProfile?.last_name || ""}`.trim() || userEmail,
          contactEmail: userEmail,
        },
      });
    } catch (e) {
      console.error("notify-new-company failed:", e);
    }

    return json({ success: true, companyId: newCompany.id });
  } catch (e) {
    console.error("complete-pending-signup error:", e);
    return json({ error: e instanceof Error ? e.message : "Ukjent feil" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
