import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("No authorization header found in request");
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
      console.error("Auth verification failed:", userError?.message, "Status:", userError?.status);
      return new Response(JSON.stringify({ error: "Unauthorized - session may have expired. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", requestingUser.id, requestingUser.email);

    // Check if requesting user is a company admin or system admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    console.log("User roles:", JSON.stringify(roles));

    const isAdmin = roles?.some(r => r.role === "company_admin" || r.role === "system_admin");
    if (!isAdmin) {
      console.error("User lacks admin role:", requestingUser.email);
      return new Response(JSON.stringify({ error: "Insufficient permissions - admin role required" }), {
        status: 403,
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

    // Get the requesting user's company
    const { data: requestingProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", requestingUser.id)
      .single();

    if (!requestingProfile?.company_id) {
      return new Response(JSON.stringify({ error: "No company associated with user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, firstName, lastName, role } = await req.json();

    // Validate input
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Gyldig e-post er påkrevd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists via profiles table (avoids listUsers pagination limit)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, company_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.company_id === requestingProfile.company_id) {
        return new Response(JSON.stringify({ error: "Bruker finnes allerede i denne bedriften" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Bruker finnes allerede med denne e-posten" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the new user with standard default password
    const tempPassword = "Abc_1234";
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
      
      // Handle specific error cases with appropriate status codes
      const errorCode = (createError as any)?.code;
      if (errorCode === "email_exists") {
        return new Response(JSON.stringify({ error: "Bruker finnes allerede med denne e-posten" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: createError?.message || "Kunne ikke opprette bruker" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the profile to link to the company
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        company_id: requestingProfile.company_id,
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

    // Generate a secure password reset link
    const loginUrl = req.headers.get("origin") || "https://athena-kurs-og-internkontroll.lovable.app";
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${loginUrl}/auth`
      }
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // User was created but we couldn't generate a reset link - still return success
      // but log the error
    }

    const resetLink = resetData?.properties?.action_link;

    // Send welcome email with password reset link (NOT plaintext password)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && resetLink) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Get company name
        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("name")
          .eq("id", requestingProfile.company_id)
          .single();

        const companyName = company?.name || "Total-IK";
        
        await resend.emails.send({
          from: `${companyName} <noreply@totalik.no>`,
          to: [email],
          subject: `Velkommen til ${companyName} - Sett ditt passord`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Velkommen til ${companyName}!</h1>
              <p>Hei ${firstName || ""},</p>
              <p>Din brukerkonto har blitt opprettet.</p>
              <p>Klikk på knappen nedenfor for å sette ditt passord:</p>
              <p style="margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sett passord</a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Lenken utløper om 24 timer.
              </p>
              <p style="color: #666; font-size: 14px;">
                Hvis du ikke kan klikke på knappen, kopier og lim inn denne lenken i nettleseren:<br>
                <span style="word-break: break-all; color: #0066cc;">${resetLink}</span>
              </p>
              
              ${getTermsNoticeHtml()}
              
              ${getTermsHtml()}
              
              <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #004085; font-size: 14px;">
                  <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                Dette er en automatisk generert e-post fra ${companyName}.
              </p>
            </div>
          `,
        });
        console.log(`Welcome email with password reset link sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the request if email fails
      }
    } else if (!resetLink) {
      console.warn(`Could not send welcome email to ${email} - reset link generation failed`);
    }

    console.log(`User ${email} created for company ${requestingProfile.company_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Bruker opprettet",
        userId: newUser.user.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-user-direct function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
