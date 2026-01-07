import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Create client with user's token for auth check
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create admin client for user deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the requesting user
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

    // Get the user's profile to find their company
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Could not find user profile" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the company admin to reassign deviations to
    let companyAdminId: string | null = null;
    if (userProfile.company_id) {
      const { data: companyAdmin } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, profiles!inner(id)")
        .eq("role", "company_admin")
        .eq("profiles.company_id", userProfile.company_id)
        .neq("user_id", userId)
        .limit(1)
        .single();

      if (companyAdmin) {
        // Get the profile id for the company admin
        const { data: adminProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", companyAdmin.user_id)
          .single();
        
        if (adminProfile) {
          companyAdminId = adminProfile.id;
        }
      }
    }

    // Reassign deviations where the user is assignee
    const { error: reassignAssigneeError } = await supabaseAdmin
      .from("deviations")
      .update({ assignee_id: companyAdminId, assignee_name: companyAdminId ? null : null })
      .eq("assignee_id", userProfile.id);

    if (reassignAssigneeError) {
      console.error("Error reassigning deviations (assignee):", reassignAssigneeError);
    }

    // Reassign deviations where the user is reporter
    const { error: reassignReporterError } = await supabaseAdmin
      .from("deviations")
      .update({ reporter_id: companyAdminId })
      .eq("reporter_id", userProfile.id);

    if (reassignReporterError) {
      console.error("Error reassigning deviations (reporter):", reassignReporterError);
    }

    // Update deviation attachments to remove uploaded_by reference
    const { error: attachmentsError } = await supabaseAdmin
      .from("deviation_attachments")
      .update({ uploaded_by: null })
      .eq("uploaded_by", userProfile.id);

    if (attachmentsError) {
      console.error("Error updating deviation attachments:", attachmentsError);
    }

    // Update deviation comments to remove user_id reference
    const { error: commentsError } = await supabaseAdmin
      .from("deviation_comments")
      .update({ user_id: null })
      .eq("user_id", userProfile.id);

    if (commentsError) {
      console.error("Error updating deviation comments:", commentsError);
    }

    // Update audits where user is responsible
    const { error: auditsError } = await supabaseAdmin
      .from("audits")
      .update({ responsible_id: null })
      .eq("responsible_id", userProfile.id);

    if (auditsError) {
      console.error("Error updating audits:", auditsError);
    }

    // Update audit_form_responses
    const { error: auditFormError } = await supabaseAdmin
      .from("audit_form_responses")
      .update({ completed_by_id: null })
      .eq("completed_by_id", userProfile.id);

    if (auditFormError) {
      console.error("Error updating audit form responses:", auditFormError);
    }

    // Update action_plan_followups
    const { error: followupsError } = await supabaseAdmin
      .from("action_plan_followups")
      .update({ completed_by_id: null })
      .eq("completed_by_id", userProfile.id);

    if (followupsError) {
      console.error("Error updating action plan followups:", followupsError);
    }

    // Now delete the profile (this will cascade to related tables if configured)
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      return new Response(JSON.stringify({ error: profileDeleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
