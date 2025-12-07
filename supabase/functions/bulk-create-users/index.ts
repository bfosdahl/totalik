import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserToCreate {
  email: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  role: "user" | "company_admin";
}

interface CreateResult {
  email: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is a system admin
    const { data: isSystemAdmin } = await supabaseAdmin.rpc("is_system_admin", {
      _user_id: requestingUser.id,
    });

    if (!isSystemAdmin) {
      return new Response(
        JSON.stringify({ error: "Only system administrators can bulk create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { users } = await req.json() as { users: UserToCreate[] };

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "Users array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (users.length > 100) {
      return new Response(
        JSON.stringify({ error: "Maximum 100 users per import" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: CreateResult[] = [];

    for (const user of users) {
      try {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!user.email || !emailRegex.test(user.email)) {
          results.push({ email: user.email || "unknown", success: false, error: "Ugyldig e-postadresse" });
          continue;
        }

        if (!user.companyId) {
          results.push({ email: user.email, success: false, error: "Bedrift er påkrevd" });
          continue;
        }

        // Generate secure invite link instead of using hardcoded password
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email: user.email,
          options: {
            data: {
              first_name: user.firstName || null,
              last_name: user.lastName || null,
            },
          },
        });

        if (inviteError) {
          console.error(`Error creating invite for ${user.email}:`, inviteError);
          results.push({ 
            email: user.email, 
            success: false, 
            error: inviteError.message.includes("already been registered") 
              ? "Brukeren eksisterer allerede" 
              : inviteError.message 
          });
          continue;
        }

        if (!inviteData.user) {
          results.push({ email: user.email, success: false, error: "Kunne ikke opprette bruker" });
          continue;
        }
        
        const authData = inviteData;

        // Update profile with company_id
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ company_id: user.companyId })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error(`Error updating profile for ${user.email}:`, profileError);
        }

        // Add role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: user.role || "user" });

        if (roleError) {
          console.error(`Error adding role for ${user.email}:`, roleError);
        }

        results.push({ email: user.email, success: true });
        console.log(`Successfully created user: ${user.email}`);
      } catch (error) {
        console.error(`Unexpected error for ${user.email}:`, error);
        results.push({ email: user.email, success: false, error: "Uventet feil" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Bulk import complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { total: users.length, success: successCount, failed: failCount }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
