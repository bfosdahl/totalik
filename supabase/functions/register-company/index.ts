import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response(JSON.stringify({ error: authError?.message || "Kunne ikke opprette bruker" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // --- 2. Create company ---
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
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Kunne ikke opprette bedrift" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 3. Update profile with company_id ---
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        company_id: newCompany.id,
        first_name: firstName || null,
        last_name: lastName || null,
        status: "active",
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Not fatal — profile trigger may not have fired yet, retry once
      await new Promise((r) => setTimeout(r, 500));
      await supabaseAdmin
        .from("profiles")
        .update({ company_id: newCompany.id, status: "active" })
        .eq("user_id", userId);
    }

    // --- 4. Assign company_admin role ---
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_admin" });

    if (roleError && !roleError.message?.includes("duplicate")) {
      console.error("Role assignment error:", roleError);
    }

    // --- 5. Send welcome email (best-effort) ---
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const welcomeClient = createClient(supabaseUrl, anonKey);
      await welcomeClient.functions.invoke("send-welcome-email", {
        body: { userId, email, firstName: firstName || "" },
      });
    } catch (emailErr) {
      console.error("Welcome email error:", emailErr);
    }

    // --- 6. Notify admin (best-effort) ---
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const notifyClient = createClient(supabaseUrl, anonKey);
      await notifyClient.functions.invoke("notify-new-company", {
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
