import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

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

    // Extract the token from the header
    const token = authHeader.replace("Bearer ", "");

    // Decode the JWT to get user ID (token is already validated by Supabase API gateway)
    let requestingUserId: string;
    try {
      const [_header, payload, _signature] = decode(token);
      const claims = payload as { sub?: string };
      requestingUserId = claims.sub as string;
      if (!requestingUserId) {
        throw new Error("No user ID in token");
      }
    } catch (decodeError) {
      console.error("JWT decode error:", decodeError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse request body - userId is the auth user ID
    // newPassword is optional - if provided, set password directly; otherwise send recovery link
    const { userId, sendEmail, newPassword } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Bruker-ID er påkrevd" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the profile data using user_id (auth user ID)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profileData) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Bruker ikke funnet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileId = profileData.id;

    // Check if requesting user is a system admin
    const { data: systemAdminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId)
      .eq("role", "system_admin")
      .maybeSingle();
    
    const isSystemAdmin = !!systemAdminRole;

    // Check if requesting user is a company admin
    const { data: companyAdminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId)
      .eq("role", "company_admin")
      .maybeSingle();
    
    const isCompanyAdmin = !!companyAdminRole;

    // Get requesting user's profile to check company
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", requestingUserId)
      .single();

    // Authorization check:
    // 1. System admins can reset any password
    // 2. Company admins can reset passwords for users in their own company
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

    if (!targetUser.user.email) {
      return new Response(
        JSON.stringify({ error: "Brukeren har ingen e-postadresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If newPassword is provided, set it directly (admin password reset)
    if (newPassword) {
      // Validate password length
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Passordet må være minst 6 tegn" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the user's password directly
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Kunne ikke oppdatere passord: " + updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Password set directly for user ${userId} by admin ${requestingUserId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Passordet er oppdatert",
          passwordSet: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Otherwise, generate a secure password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.user.email,
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error("Password reset link generation error:", resetError);
      return new Response(
        JSON.stringify({ error: "Kunne ikke generere tilbakestillingslenke" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset link generated for user ${userId} by admin ${requestingUserId}`);

    // Send email with reset link if requested
    let emailSent = false;
    if (sendEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          
          // Get user's profile for name
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", profileId)
            .maybeSingle();
          
          const userName = profile?.first_name 
            ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
            : "bruker";

          const emailResponse = await resend.emails.send({
            from: "Internkontroll <noreply@totalik.no>",
            to: [targetUser.user.email],
            subject: "Tilbakestill passord",
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
                  .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                  .button:hover { background: #1d4ed8; }
                  .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
                  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">Internkontroll</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Tilbakestill passord</p>
                  </div>
                  <div class="content">
                    <p>Hei ${userName},</p>
                    <p>En administrator har bedt om at du tilbakestiller passordet ditt. Klikk på knappen nedenfor for å velge et nytt passord:</p>
                    <p style="text-align: center;">
                      <a href="${resetData.properties.action_link}" class="button" style="color: white;">
                        Sett nytt passord
                      </a>
                    </p>
                    <div class="warning">
                      <strong>Viktig:</strong> Denne lenken utløper om 24 timer. Hvis du ikke ba om denne tilbakestillingen, kan du ignorere denne e-posten.
                    </div>
                    <p>Med vennlig hilsen,<br>Internkontroll Team</p>
                  </div>
                  <div class="footer">
                    <p>Denne e-posten ble sendt fra Internkontroll. Hvis du ikke forventet denne meldingen, vennligst kontakt din administrator.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          console.log("Password reset email sent:", emailResponse);
          emailSent = !emailResponse.error;
        } catch (emailError) {
          console.error("Error sending password reset email:", emailError);
          // Don't fail the whole operation if email fails
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tilbakestillingslenke sendt",
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
