import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function uses service-level auth via SUPABASE_SERVICE_ROLE_KEY
    // The curl tool sends the anon key automatically, so we accept that
    // and verify the request using a shared secret in the body
    const body = await req.json();
    const { email, firstName, lastName, companyId, role, adminSecret } = body;
    
    // For programmatic access, verify admin secret
    const expectedSecret = Deno.env.get("SYNC_API_KEY");
    if (adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid admin secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // email, firstName, lastName, companyId, role already destructured above

    if (!email || !companyId) {
      return new Response(
        JSON.stringify({ error: "Email and companyId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company details
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Create auth user
    const tempPassword = "Abc_1234";
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: firstName || "", last_name: lastName || "" },
    });

    if (createError || !authData.user) {
      return new Response(
        JSON.stringify({ 
          error: createError?.message || "Failed to create user",
          step: "auth_create",
          verification: { authCreated: false, profileUpdated: false, roleAssigned: false, emailSent: false }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Step 1: Auth user created for ${email} (ID: ${authData.user.id})`);

    // Step 2: Update profile with company
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        company_id: companyId,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .eq("user_id", authData.user.id);

    const profileUpdated = !profileError;
    if (profileError) {
      console.error(`❌ Step 2 FAILED: Profile update error for ${email}:`, profileError);
    } else {
      console.log(`✅ Step 2: Profile updated for ${email}`);
    }

    // Step 3: Assign role
    const assignRole = role || "company_admin";
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: assignRole });

    const roleAssigned = !roleError;
    if (roleError) {
      console.error(`❌ Step 3 FAILED: Role assignment error for ${email}:`, roleError);
    } else {
      console.log(`✅ Step 3: Role '${assignRole}' assigned to ${email}`);
    }

    // Step 4: Generate recovery link and send email
    let emailSent = false;
    let resetLink: string | null = null;

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase(),
    });

    if (resetError) {
      console.error(`❌ Step 4a FAILED: Recovery link generation error for ${email}:`, resetError);
    } else {
      resetLink = resetData?.properties?.action_link || null;
      console.log(`✅ Step 4a: Recovery link generated for ${email}`);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && resetLink) {
      const resend = new Resend(resendApiKey);
      const displayName = firstName || email.split("@")[0];

      try {
        const emailResponse = await resend.emails.send({
          from: "Total-IK <noreply@totalik.no>",
          to: [email],
          subject: `Velkommen som administrator for ${company.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Velkommen som administrator!</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hei ${displayName},</p>
                <p>Du har blitt opprettet som <strong>administrator</strong> for <strong>${company.name}</strong> i HMS-systemet.</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Bedrift:</strong> ${company.name}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Din rolle:</strong> Bedriftsadministrator</p>
                  <p style="margin: 10px 0 0 0;"><strong>E-post:</strong> ${email}</p>
                </div>
                <p>For å komme i gang, klikk på knappen nedenfor for å sette ditt passord:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sett passord og logg inn</a>
                </div>
                <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier og lim inn denne lenken i nettleseren:</p>
                <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetLink}</p>
                ${getTermsNoticeHtml()}
                ${getTermsHtml()}
                <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; color: #004085; font-size: 14px;"><strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong></p>
                </div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #888; font-size: 12px; text-align: center;">Denne e-posten ble sendt fra Total-IK.</p>
              </div>
            </body>
            </html>
          `,
        });

        if (emailResponse.error) {
          console.error(`❌ Step 4b FAILED: Email send error for ${email}:`, emailResponse.error);
        } else {
          emailSent = true;
          console.log(`✅ Step 4b: Welcome email sent to ${email}`);
        }
      } catch (emailError) {
        console.error(`❌ Step 4b FAILED: Email exception for ${email}:`, emailError);
      }
    } else {
      console.warn(`⚠️ Step 4b SKIPPED: ${!resendApiKey ? 'No RESEND_API_KEY' : 'No reset link'}`);
    }

    // Final verification - read back from DB to confirm
    const { data: verifyProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, email, first_name, last_name, company_id")
      .eq("user_id", authData.user.id)
      .single();

    const { data: verifyRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);

    const verification = {
      authCreated: true,
      profileUpdated,
      profileVerified: verifyProfile?.company_id === companyId,
      roleAssigned,
      roleVerified: verifyRole?.some((r: any) => r.role === assignRole) || false,
      emailSent,
      resetLinkGenerated: !!resetLink,
    };

    const allGood = Object.values(verification).every(v => v === true);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`PROVISIONING ${allGood ? '✅ COMPLETE' : '⚠️ PARTIAL'} for ${email}`);
    console.log(`Verification:`, JSON.stringify(verification, null, 2));
    console.log(`${'='.repeat(50)}\n`);

    return new Response(
      JSON.stringify({
        success: allGood,
        message: allGood 
          ? `Bruker ${email} er fullstendig opprettet og e-post sendt` 
          : `Bruker opprettet, men noen steg feilet`,
        userId: authData.user.id,
        verification,
        profile: verifyProfile,
        roles: verifyRole,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Provisioning error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
