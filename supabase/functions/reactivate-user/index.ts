import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to requesting user (for auth validation)
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is system admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_system_admin", {
      _user_id: requestingUser.id,
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only system administrators can reactivate users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, role } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user exists and is actually soft-deleted
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, company_id, email, is_active, status, deleted_at")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.is_active && profile.status !== "deleted" && profile.status !== "suspended") {
      return new Response(JSON.stringify({ error: "User is already active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Reactivate profile — clear deleted_at, set active
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_active: true,
        status: "active",
        deleted_at: null,
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("Error reactivating profile:", profileUpdateError);
      return new Response(JSON.stringify({ error: profileUpdateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Remove auth ban
    const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (unbanError) {
      console.error("Error removing auth ban:", unbanError);
      return new Response(JSON.stringify({ error: "Failed to remove auth ban: " + unbanError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Assign default role (soft-delete removed all roles)
    const assignedRole = role || "user";
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: assignedRole },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Error assigning role:", roleError);
      // Non-fatal — profile and auth are already restored
    }

    // Step 4: Departments are NOT auto-restored (they were removed on delete).
    // Admin must reassign departments manually via the UI after reactivation.

    console.log(`[reactivate-user] Reactivated user ${userId} (${profile.email}) with role ${assignedRole}`);

    return new Response(JSON.stringify({ success: true, role: assignedRole }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in reactivate-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
