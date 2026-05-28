import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Poll for profile existence after auth user creation.
 * The handle_new_user trigger creates the profile asynchronously.
 * Returns true if profile found within the retry window.
 */
async function waitForProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  maxAttempts = 5,
  intervalMs = 400
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.id) {
      console.log(`[register-company] Profile found on attempt ${attempt}`);
      return true;
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, firstName, lastName, companyName, orgNumber } = await req.json();

    // --- Validation ---
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Ugyldig e-postadresse" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Passordet må være minst 6 tegn" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!companyName || companyName.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Bedriftsnavn må være minst 2 tegn" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!orgNumber || !/^\d{9}$/.test(orgNumber)) {
      return new Response(JSON.stringify({ error: "Org.nr må være 9 siffer" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Check existing user ---
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: "Denne e-postadressen er allerede registrert" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Check existing org number ---
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("org_number", orgNumber.trim())
      .maybeSingle();

    if (existingCompany) {
      return new Response(JSON.stringify({ error: "En bedrift med dette organisasjonsnummeret er allerede registrert" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 1. Create auth user ---
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || "",
        last_name: lastName || "",
      },
    });

    if (authError || !authData.user) {
      console.error("Auth create error:", authError);
      return new Response(JSON.stringify({ error: "Kunne ikke opprette bruker" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // --- 2. Wait for profile trigger ---
    const profileExists = await waitForProfile(supabaseAdmin, userId);

    if (!profileExists) {
      console.error(`[register-company] Profile never created for user ${userId} — rolling back auth user`);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Kunne ikke opprette brukerprofil. Prøv igjen." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 3. Create company ---
    const { data: newCompany, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName.trim(),
        org_number: orgNumber.trim(),
      })
      .select("id, name")
      .single();

    if (companyError || !newCompany) {
      console.error("Company create error:", companyError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Kunne ikke opprette bedrift" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 4. Update profile with company_id + verify ---
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        company_id: newCompany.id,
        first_name: firstName || null,
        last_name: lastName || null,
        status: "active",
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      // Rollback company + auth user
      await supabaseAdmin.from("companies").delete().eq("id", newCompany.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Kunne ikke knytte profil til bedrift" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the update actually took effect (catches 0-row update)
    const { data: verifiedProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", userId)
      .single();

    if (verifiedProfile?.company_id !== newCompany.id) {
      console.error(`[register-company] Profile update verification failed: expected ${newCompany.id}, got ${verifiedProfile?.company_id}`);
      await supabaseAdmin.from("companies").delete().eq("id", newCompany.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Kunne ikke knytte profil til bedrift. Prøv igjen." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 5. Assign company_admin role ---
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_admin" });

    if (roleError && !roleError.message?.includes("duplicate")) {
      console.error("Role assignment error:", roleError);
    }

    // --- 6. Send welcome email (best-effort) ---
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const welcomeClient = createClient(supabaseUrl, anonKey);
      await welcomeClient.functions.invoke("send-welcome-email", {
        headers: { "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "" },
        body: { userId, email, firstName: firstName || "" },
      });
    } catch (emailErr) {
      console.error("Welcome email error:", emailErr);
    }

    // --- 7. Notify admin (best-effort) ---
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const notifyClient = createClient(supabaseUrl, anonKey);
      await notifyClient.functions.invoke("notify-new-company", {
        headers: { "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "" },
        body: {
          companyName: companyName.trim(),
          contactPerson: `${firstName || ""} ${lastName || ""}`.trim(),
          contactEmail: email,
        },
      });
    } catch (notifyErr) {
      console.error("Admin notification error:", notifyErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        companyId: newCompany.id,
        companyName: newCompany.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in register-company:", error);
    return new Response(
      JSON.stringify({ error: "En uventet feil oppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
