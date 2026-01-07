import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is a system admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is system admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "system_admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only system admins can send bulk emails" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users with their company info
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        company_id,
        is_active,
        companies (name)
      `)
      .eq("is_active", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${profiles?.length || 0} active users to send emails to`);

    const resend = new Resend(resendApiKey);
    const loginUrl = "https://totalik.no/auth";
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) {
        console.log(`Skipping user ${profile.user_id} - no email`);
        continue;
      }

      const companyName = (profile.companies as any)?.name || "Total-IK";
      const firstName = profile.first_name || "";

      try {
        // Generate a password reset link for the user
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: profile.email,
          options: {
            redirectTo: loginUrl,
          },
        });

        if (resetError) {
          console.error(`Failed to generate reset link for ${profile.email}:`, resetError);
          errors.push(`${profile.email}: ${resetError.message}`);
          errorCount++;
          continue;
        }

        const resetLink = resetData?.properties?.action_link || loginUrl;

        await resend.emails.send({
          from: `Total-IK <noreply@totalik.no>`,
          to: [profile.email],
          subject: `Velkommen til ${companyName} - Din brukerkonto`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
              </div>
              
              <p style="color: #333; font-size: 16px;">Hei${firstName ? ` ${firstName}` : ''},</p>
              
              <p style="color: #333; font-size: 16px;">
                Du har en brukerkonto hos ${companyName} i Total-IK systemet.
              </p>
              
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0066cc;">
                <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">📧 Din innloggingsinformasjon</h3>
                <p style="color: #555; margin: 0;">
                  <strong>Brukernavn:</strong> ${profile.email}
                </p>
              </div>
              
              <p style="color: #333; font-size: 16px;">
                Klikk på knappen under for å sette et nytt passord og logge inn:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Sett passord og logg inn
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Eller gå direkte til <a href="${loginUrl}" style="color: #0066cc;">${loginUrl}</a> og bruk "Glemt passord" funksjonen.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Dette er en automatisk generert e-post fra Total-IK.<br>
                Hvis du har spørsmål, kontakt din administrator.
              </p>
            </div>
          `,
        });

        console.log(`Email sent to ${profile.email}`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError: any) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError.message}`);
        errorCount++;
      }
    }

    console.log(`Bulk email complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in bulk email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
