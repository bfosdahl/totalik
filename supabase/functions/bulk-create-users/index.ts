import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

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
  emailSent?: boolean;
}

// Function to send welcome email with password reset link
async function sendWelcomeEmail(
  resend: Resend,
  supabaseAdmin: any,
  email: string,
  firstName: string | null,
  companyName: string
): Promise<boolean> {
  try {
    // Generate password recovery link — redirectTo MUST point to /auth so the recovery
    // hash is detected by Auth.tsx and the "set new password" form is shown.
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://totalik.no/auth",
      },
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error(`Error generating recovery link for ${email}:`, resetError);
      return false;
    }

    const displayName = firstName || email.split("@")[0];
    const resetLink = resetData.properties.action_link;
    
    const emailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [email],
      subject: "Velkommen til Total-IK - Sett ditt passord",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Total-IK</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Velkommen til ditt HMS-system</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hei ${displayName}!</h2>
            
            <p>Din brukerkonto hos <strong>${companyName}</strong> er nå opprettet i Total-IK.</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Din påloggingsinformasjon:</h3>
              <p style="margin: 5px 0;"><strong>E-post:</strong> ${email}</p>
              <p style="margin: 5px 0;">Klikk på knappen nedenfor for å sette ditt passord.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                        color: white; 
                        padding: 14px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Sett passord og logg inn
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren din:</p>
            <p style="color: #6366f1; font-size: 12px; word-break: break-all;">${resetLink}</p>
            
            ${getTermsNoticeHtml()}
            
            ${getTermsHtml()}
            
            <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #004085; font-size: 14px;">
                <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Har du spørsmål? Kontakt din bedriftsadministrator eller svar på denne e-posten.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Total-IK. Alle rettigheter reservert.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Welcome email sent to ${email}:`, emailResponse);
    return true;
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    return false;
  }
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

    // Initialize Resend for sending emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    if (!resend) {
      console.warn("RESEND_API_KEY not configured - welcome emails will not be sent");
    }

    // Pre-fetch company names for all unique company IDs
    const companyIds = [...new Set(users.map(u => u.companyId))];
    const { data: companiesData } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .in("id", companyIds);
    
    const companyMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

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

        // Random unguessable password — recovery link sent in welcome email
        const tempPassword = crypto.randomUUID() + "Aa1!";

        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName || null,
            last_name: user.lastName || null,
          },
        });

        if (createError) {
          console.error(`Error creating user ${user.email}:`, createError);
          results.push({ 
            email: user.email, 
            success: false, 
            error: createError.message.includes("already been registered") 
              ? "Brukeren eksisterer allerede" 
              : createError.message 
          });
          continue;
        }

        if (!authData.user) {
          results.push({ email: user.email, success: false, error: "Kunne ikke opprette bruker" });
          continue;
        }

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

        // Send welcome email with password reset link
        let emailSent = false;
        if (resend) {
          const companyName = companyMap.get(user.companyId) || "din bedrift";
          emailSent = await sendWelcomeEmail(
            resend,
            supabaseAdmin,
            user.email,
            user.firstName || null,
            companyName
          );
        }

        // === VERIFICATION: Read back from DB ===
        const { data: verifyProfile } = await supabaseAdmin
          .from("profiles")
          .select("company_id")
          .eq("user_id", authData.user.id)
          .single();

        const { data: verifyRole } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id);

        const profileVerified = verifyProfile?.company_id === user.companyId;
        const roleVerified = verifyRole?.some((r: any) => r.role === (user.role || "user")) || false;
        const allVerified = profileVerified && roleVerified && emailSent;

        // Log to provisioning table
        await supabaseAdmin.from("user_provisioning_log").insert({
          email: user.email,
          company_id: user.companyId,
          role: user.role || "user",
          created_by_id: requestingUser.id,
          auth_created: true,
          profile_updated: !profileError,
          role_assigned: !roleError,
          email_sent: emailSent,
          reset_link_generated: emailSent,
          all_verified: allVerified,
          error_message: !allVerified 
            ? `Profile: ${profileVerified}, Role: ${roleVerified}, Email: ${emailSent}` 
            : null,
          source: "bulk-create-users",
        });

        if (!allVerified) {
          console.warn(`⚠️ PARTIAL provisioning for ${user.email}: Profile=${profileVerified}, Role=${roleVerified}, Email=${emailSent}`);
        }

        results.push({ email: user.email, success: true, emailSent });
        console.log(`Successfully created user: ${user.email}, email sent: ${emailSent}, fully verified: ${allVerified}`);
      } catch (error) {
        console.error(`Unexpected error for ${user.email}:`, error);
        results.push({ email: user.email, success: false, error: "Uventet feil" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const emailsSent = results.filter(r => r.emailSent).length;

    console.log(`Bulk import complete: ${successCount} success, ${failCount} failed, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { total: users.length, success: successCount, failed: failCount, emailsSent }
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
