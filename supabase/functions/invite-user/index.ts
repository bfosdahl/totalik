import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

    // Check if requesting user is a company admin or system admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some(r => r.role === "company_admin" || r.role === "system_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the request body first to check for companyId
    const { email: rawEmail, firstName, lastName, role: requestedRole, companyId: requestedCompanyId } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    // Check if system admin (can specify any company / role)
    const isSystemAdmin = roles?.some(r => r.role === "system_admin");

    // Server-side role whitelist: prevent privilege escalation.
    // Only system admins may assign elevated roles. Company admins are capped at 'user' or 'company_admin'.
    const ALLOWED_FOR_COMPANY_ADMIN = ["user", "company_admin"];
    const role = isSystemAdmin
      ? (requestedRole || "user")
      : (ALLOWED_FOR_COMPANY_ADMIN.includes(requestedRole) ? requestedRole : "user");

    // Get the requesting user's company
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", requestingUser.id)
      .single();

    // Determine which company to use
    let targetCompanyId = requestingProfile?.company_id;
    
    // System admins can specify a different company
    if (isSystemAdmin && requestedCompanyId) {
      targetCompanyId = requestedCompanyId;
    }

    if (!targetCompanyId) {
      return new Response(JSON.stringify({ error: "No company specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company name for the email
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", targetCompanyId)
      .single();

    // Validate input
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists via profiles table (avoids listUsers pagination limit)
    let existingUser = null;
    const { data: existingProfileCheck } = await supabaseAdmin
      .from("profiles")
      .select("user_id, company_id")
      .ilike("email", email)
      .maybeSingle();
    
    if (existingProfileCheck?.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingProfileCheck.user_id);
      existingUser = userData?.user || null;
    }

    if (existingUser) {
      if (existingProfileCheck?.company_id === targetCompanyId) {
        // Same company — reactivate if suspended/inactive instead of erroring
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("is_active, status")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        const needsReactivation =
          existingProfile?.is_active === false ||
          existingProfile?.status === "suspended" ||
          existingProfile?.status === "pending_approval";

        if (!needsReactivation) {
          return new Response(JSON.stringify({ error: "Bruker er allerede aktiv i dette selskapet" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Reactivate the user without wiping existing names when the invite form only sends email
        const reactivationUpdates: Record<string, unknown> = {
          is_active: true,
          status: "active",
        };
        if (firstName) reactivationUpdates.first_name = firstName;
        if (lastName) reactivationUpdates.last_name = lastName;

        await supabaseAdmin
          .from("profiles")
          .update(reactivationUpdates)
          .eq("user_id", existingUser.id);

        // Ensure role
        if (role && role !== "user") {
          const { data: existingRoles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", existingUser.id);
          const hasRole = existingRoles?.some((r) => r.role === role);
          if (!hasRole) {
            await supabaseAdmin
              .from("user_roles")
              .insert({ user_id: existingUser.id, role });
          }
        }

        // Send a fresh recovery link so the user can re-enter the system
        let resetLink = "https://totalik.no/auth";
        try {
          const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: "https://totalik.no/auth" },
          });
          resetLink = resetData?.properties?.action_link || resetLink;
        } catch (e) {
          console.error("generateLink failed during reactivation:", e);
        }

        let emailSent = false;
        if (resend) {
          try {
            const companyName = company?.name || "din bedrift";
            await resend.emails.send({
              from: "Total-IK <noreply@totalik.no>",
              to: [email],
              subject: `Du har fått tilgang igjen til ${companyName}`,
              html: `<p>Hei,</p><p>Din konto i <strong>${esc(companyName)}</strong> er reaktivert. Klikk lenken under for å sette nytt passord og logge inn.</p><p><a href="${resetLink}">Sett nytt passord og logg inn</a></p><p>Lenken er gyldig i 24 timer.</p>`,
            });
            emailSent = true;
          } catch (e) {
            console.error("Reactivation email failed:", e);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Bruker reaktivert i selskapet",
            userId: existingUser.id,
            reactivated: true,
            emailSent,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Block cross-tenant hijacking: an admin must NOT be able to move a user
      // who already belongs to another company into their own company.
      if (existingProfileCheck?.company_id && existingProfileCheck.company_id !== targetCompanyId) {
        return new Response(
          JSON.stringify({ error: "Denne e-postadressen er allerede registrert hos en annen organisasjon. Brukeren må selv kontakte support for å bytte selskap." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }


      // User exists but not in this company - update their profile to this company
      await supabaseAdmin
        .from("profiles")
        .update({ 
          company_id: targetCompanyId,
          first_name: firstName || null,
          last_name: lastName || null,
        })
        .eq("user_id", existingUser.id);

      // Add role if specified and not already present
      if (role && role !== "user") {
        const { data: existingRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", existingUser.id);
        
        const hasRole = existingRoles?.some(r => r.role === role);
        if (!hasRole) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: existingUser.id, role });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Eksisterende bruker lagt til i selskapet",
          userId: existingUser.id,
          emailSent: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }


    // Random unguessable password — user receives recovery link to set their own
    const tempPassword = crypto.randomUUID() + "Aa1!";

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
      const errorCode = (createError as any)?.code;
      if (errorCode === "email_exists") {
        return new Response(JSON.stringify({ error: "Brukeren finnes allerede. Prøv invitasjon på nytt med samme e-post, eller kontakt support hvis kontoen mangler i ansattlisten." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the profile to link to the company
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        company_id: targetCompanyId,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Add the user role if specified
    if (role && role !== "user") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role,
        });

      if (roleError) {
        console.error("Error adding role:", roleError);
      }
    }

    // Generate recovery link so the user sets their own password
    const loginUrl = "https://totalik.no/auth";
    const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${loginUrl}` },
    });
    const resetLink = resetData?.properties?.action_link || loginUrl;

    // Send welcome email with Resend - includes secure recovery link (no plaintext password)
    let emailSent = false;
    if (resend) {
      try {
        const companyName = company?.name || "din bedrift";
        const userName = firstName ? firstName : "bruker";
        const roleName = role === "company_admin" ? "Administrator" : "Bruker";

        const emailResponse = await resend.emails.send({
          from: "Total-IK <noreply@totalik.no>",
          to: [email],
          subject: `Velkommen til ${companyName} - Din konto er opprettet`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Velkommen til ${esc(companyName)}!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hei ${esc(userName)},</p>
                
                <p>Du har blitt invitert til å bruke HMS-systemet til <strong>${esc(companyName)}</strong>.</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Din rolle:</strong> ${esc(roleName)}</p>
                  <p style="margin: 8px 0 0 0;"><strong>E-post:</strong> ${esc(email)}</p>
                </div>
                
                <p>Klikk på knappen nedenfor for å sette ditt passord og logge inn.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sett passord og logg inn</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier denne lenken (utløper om 24 timer):</p>
                <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetLink}</p>
                
                ${getTermsNoticeHtml()}
                
                ${getTermsHtml()}
                
                <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; color: #004085; font-size: 14px;">
                    <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #888; font-size: 12px; text-align: center;">
                  Denne e-posten ble sendt fra HMS-systemet til ${esc(companyName)}.<br>
                  Hvis du ikke forventet denne invitasjonen, kan du trygt ignorere denne e-posten.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: emailSent ? "User invited successfully and email sent" : "User invited successfully (email not sent)",
        userId: newUser.user.id,
        emailSent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in invite-user function:", error);
    console.error("invite-user error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
