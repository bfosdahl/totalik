import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

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
      return new Response(JSON.stringify({ error: "Only system administrators can delete users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (userId === requestingUser.id) {
      return new Response(JSON.stringify({ error: "You cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id, first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Could not find user profile" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SOFT DELETE: deactivate profile, preserve all data ---
    const { error: softDeleteError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        status: "deleted",
      })
      .eq("user_id", userId);

    if (softDeleteError) {
      console.error("Error soft-deleting profile:", softDeleteError);
      return new Response(JSON.stringify({ error: softDeleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remove user roles so they can't access anything
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error removing user roles:", rolesError);
    }

    // Remove department assignments
    const { error: deptError } = await supabaseAdmin
      .from("user_departments")
      .delete()
      .eq("user_id", userId);

    if (deptError) {
      console.error("Error removing department assignments:", deptError);
    }

    // Disable the auth user (ban instead of delete — preserves audit trail)
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h", // ~100 years
    });

    if (banError) {
      console.error("Error banning auth user:", banError);
      // Non-fatal — profile is already deactivated
    }

    console.log(`[delete-user] Soft-deleted user ${userId} (${userProfile.email})`);

    return new Response(JSON.stringify({ success: true, softDeleted: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in delete-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
