import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create client with user's token to verify permissions
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body - userId here is the profile ID, not auth user ID
    const { userId: profileId, newPassword, sendEmail } = await req.json();

    if (!profileId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Profil-ID og nytt passord er påkrevd" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the auth user_id from the profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, company_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profileData?.user_id) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Bruker ikke funnet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = profileData.user_id;

    // Validate password length
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Passordet må være minst 6 tegn" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is a system admin
    const { data: isSystemAdmin } = await supabaseAdmin.rpc("is_system_admin", {
      _user_id: requestingUser.id,
    });

    // Get requesting user's profile to check if they're a company admin
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, company_id")
      .eq("user_id", requestingUser.id)
      .single();

    // Authorization check:
    // 1. System admins can reset any password
    // 2. Company admins can reset passwords for users in their own company
    const isCompanyAdmin = requestingProfile?.role === "company_admin";
    const isSameCompany = requestingProfile?.company_id && 
                          profileData.company_id && 
                          requestingProfile.company_id === profileData.company_id;

    if (!isSystemAdmin && !(isCompanyAdmin && isSameCompany)) {
      console.error("Permission denied: user is not system admin or company admin for this user");
      return new Response(
        JSON.stringify({ error: "Du har ikke tilgang til å endre passord for denne brukeren" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user info for email
    const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUserError || !targetUser?.user) {
      console.error("Error fetching target user:", targetUserError);
      return new Response(
        JSON.stringify({ error: "Bruker ikke funnet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset successful for user ${userId} by admin ${requestingUser.id}`);

    // Send email if requested
    let emailSent = false;
    if (sendEmail && targetUser.user.email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          
          // Get user's profile for name (use profileId which is the profile table ID)
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", profileId)
            .maybeSingle();
          
          const userName = profile?.first_name 
            ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
            : "bruker";

          const emailResponse = await resend.emails.send({
            from: "Athena HMS <noreply@athenahms.no>",
            to: [targetUser.user.email],
            subject: "Ditt passord er endret",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                  .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
                  .password-box { background: #fff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                  .password { font-family: monospace; font-size: 24px; color: #1a365d; letter-spacing: 2px; }
                  .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
                  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">Athena HMS</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Passord endret</p>
                  </div>
                  <div class="content">
                    <p>Hei ${userName},</p>
                    <p>Passordet ditt har blitt endret av en administrator. Her er ditt nye passord:</p>
                    <div class="password-box">
                      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Nytt passord:</p>
                      <p class="password">${newPassword}</p>
                    </div>
                    <div class="warning">
                      <strong>Viktig:</strong> Vi anbefaler at du endrer passordet til noe du husker etter første innlogging.
                    </div>
                    <p>Du kan logge inn her: <a href="https://athenahms.no" style="color: #2563eb;">athenahms.no</a></p>
                    <p>Med vennlig hilsen,<br>Athena HMS Team</p>
                  </div>
                  <div class="footer">
                    <p>Denne e-posten ble sendt fra Athena HMS. Hvis du ikke forventet denne meldingen, vennligst kontakt din administrator.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          console.log("Password email sent successfully:", emailResponse);
          emailSent = true;
        } catch (emailError) {
          console.error("Error sending password email:", emailError);
          // Don't fail the whole operation if email fails
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Passord oppdatert",
        emailSent 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "En uventet feil oppstod" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
