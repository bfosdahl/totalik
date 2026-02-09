import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client with the user's token to verify permissions
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is a system admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isSystemAdmin = roles?.some(r => r.role === "system_admin");
    if (!isSystemAdmin) {
      return new Response(JSON.stringify({ error: "Only system admins can create company admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, firstName, lastName, companyId } = await req.json();

    // Validate input
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: "Company ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Check if user is already in this company with company_admin role
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("company_id, first_name, last_name")
        .eq("user_id", existingUser.id)
        .single();

      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id);

      const isAlreadyCompanyAdmin = existingRoles?.some(r => r.role === "company_admin");

      if (existingProfile?.company_id === companyId && isAlreadyCompanyAdmin) {
        return new Response(JSON.stringify({ error: "Bruker er allerede bedriftsadministrator i dette selskapet" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // User exists but is not company_admin for this company - add them
      if (existingProfile?.company_id !== companyId) {
        // Update profile to this company
        await supabaseAdmin
          .from("profiles")
          .update({ 
            company_id: companyId,
            first_name: firstName || existingProfile?.first_name || null,
            last_name: lastName || existingProfile?.last_name || null,
          })
          .eq("user_id", existingUser.id);
      }

      // Add company_admin role if not already present
      if (!isAlreadyCompanyAdmin) {
        await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: existingUser.id,
            role: "company_admin",
          });
      }

      // Generate password reset link for existing user
      const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Eksisterende bruker lagt til som bedriftsadministrator",
          userId: existingUser.id,
          emailSent: false,
          resetLink: resetData?.properties?.action_link
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use standardized default password for easier onboarding
    const tempPassword = "Abc_1234";

    // Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || "",
        last_name: lastName || "",
      },
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the profile to link to the company
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        company_id: companyId,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Add the company_admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "company_admin",
      });

    if (roleError) {
      console.error("Error adding role:", roleError);
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (resetError) {
      console.error("Error generating recovery link:", resetError);
    }

    // Send welcome email with Resend
    let emailSent = false;
    if (resend && resetData?.properties?.action_link) {
      try {
        const companyName = company.name;
        const userName = firstName ? firstName : "Administrator";

        const emailResponse = await resend.emails.send({
          from: "Total-IK <noreply@totalik.no>",
          to: [email],
          subject: `Du er administrator for ${companyName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Velkommen som administrator!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hei ${userName},</p>
                
                <p>Du har blitt opprettet som <strong>administrator</strong> for <strong>${companyName}</strong> i HMS-systemet.</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Bedrift:</strong> ${companyName}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Din rolle:</strong> Bedriftsadministrator</p>
                  <p style="margin: 10px 0 0 0;"><strong>E-post:</strong> ${email}</p>
                </div>
                
                <p>Som administrator kan du:</p>
                <ul>
                  <li>Administrere brukere i din bedrift</li>
                  <li>Sette opp internkontrollsystemet</li>
                  <li>Håndtere avvik og revisjoner</li>
                  <li>Generere HMS-håndbok</li>
                </ul>
                
                <p>For å komme i gang, klikk på knappen nedenfor for å sette ditt passord:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetData.properties.action_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sett passord og logg inn</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren din:</p>
                <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetData.properties.action_link}</p>
                
                ${getTermsNoticeHtml()}
                
                ${getTermsHtml()}
                
                <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; color: #004085; font-size: 14px;">
                    <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #888; font-size: 12px; text-align: center;">
                  Denne e-posten ble sendt fra Total-IK.<br>
                  Hvis du ikke forventet denne invitasjonen, kan du trygt ignorere denne e-posten.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (emailResponse.error) {
          console.error("Email sending failed:", emailResponse.error);
        } else {
          console.log("Email sent successfully:", emailResponse);
          emailSent = true;
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: emailSent ? "Company admin created and email sent" : "Company admin created (email not sent)",
        userId: newUser.user.id,
        emailSent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-company-admin function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
