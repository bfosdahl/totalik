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

    const { email: rawEmail, firstName, lastName, role: requestedRole } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    // Server-side role whitelist: prevent privilege escalation.
    // Only system admins may assign elevated roles. Company admins are capped at 'user' or 'company_admin'.
    const isSystemAdmin = roles?.some(r => r.role === "system_admin");
    const ALLOWED_FOR_COMPANY_ADMIN = ["user", "company_admin"];
    const role = isSystemAdmin
      ? (requestedRole || "user")
      : (ALLOWED_FOR_COMPANY_ADMIN.includes(requestedRole) ? requestedRole : "user");

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
      .select("user_id, company_id, is_active, status")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (existingProfile.company_id === requestingProfile.company_id) {
        const needsReactivation = existingProfile.is_active === false || existingProfile.status === "suspended" || existingProfile.status === "pending_approval";
        if (needsReactivation) {
          const reactivationUpdates: Record<string, unknown> = { is_active: true, status: "active" };
          if (firstName) reactivationUpdates.first_name = firstName;
          if (lastName) reactivationUpdates.last_name = lastName;

          await supabaseAdmin
            .from("profiles")
            .update(reactivationUpdates)
            .eq("user_id", existingProfile.user_id);

          if (role && role !== "user") {
            const { data: existingRoles } = await supabaseAdmin
              .from("user_roles")
              .select("role")
              .eq("user_id", existingProfile.user_id);
            if (!existingRoles?.some((r) => r.role === role)) {
              await supabaseAdmin.from("user_roles").insert({ user_id: existingProfile.user_id, role });
            }
          }

          return new Response(JSON.stringify({ success: true, message: "Bruker reaktivert", userId: existingProfile.user_id, reactivated: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

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

    // Generate an unguessable random password. The user will set their own via recovery link.
    const randomPassword = crypto.randomUUID() + "Aa1!";
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
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
        return new Response(JSON.stringify({ error: "Brukeren finnes allerede. Bruk Send invitasjon for å reaktivere eksisterende konto, eller kontakt support hvis kontoen mangler i ansattlisten." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Kunne ikke opprette bruker" }), {
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

    const loginUrl = "https://totalik.no/auth";

    // Generate a one-time recovery link so the user sets their own password.
    let recoveryLink = loginUrl;
    try {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: loginUrl },
      });
      if (linkErr) {
        console.error("Error generating recovery link:", linkErr);
      } else if (linkData?.properties?.action_link) {
        recoveryLink = linkData.properties.action_link;
      }
    } catch (e) {
      console.error("generateLink threw:", e);
    }

    // Send welcome email with the recovery link (no password in email)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("name")
          .eq("id", requestingProfile.company_id)
          .single();

        const companyName = company?.name || "Total-IK";

        await resend.emails.send({
          from: `${companyName} <noreply@totalik.no>`,
          to: [email],
          subject: `Velkommen til ${companyName} - Sett passord`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Velkommen til ${esc(companyName)}!</h1>
              <p>Hei ${esc(firstName || "")},</p>
              <p>Din brukerkonto er opprettet i Total-IK. Klikk p&aring; knappen under for &aring; sette ditt eget passord og logge inn.</p>

              <p style="margin: 30px 0; text-align:center;">
                <a href="${recoveryLink}" style="background-color: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight:600;">Sett passord og logg inn</a>
              </p>

              <p style="font-size:13px;color:#666;">Fungerer ikke knappen? Kopier denne lenken inn i nettleseren:</p>
              <p style="font-size:12px;color:#0066cc;word-break:break-all;">${recoveryLink}</p>

              <p style="color:#b8500a;font-size:14px;background:#fff8ec;border-left:4px solid #f0a020;padding:12px 16px;border-radius:0 8px 8px 0;">
                <strong>Merk:</strong> Lenken er gyldig i 24 timer. Trenger du en ny lenke, be en administrator sette nytt passord fra <em>Ansatte</em>-siden.
              </p>

              ${getTermsNoticeHtml()}

              ${getTermsHtml()}

              <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #004085; font-size: 14px;">
                  <strong>Ved &aring; logge inn bekrefter du at du har lest og godtar avtalevilk&aring;rene ovenfor.</strong>
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                Dette er en automatisk generert e-post fra ${esc(companyName)}.
              </p>
            </div>
          `,
        });
        console.log(`Welcome email with recovery link sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
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
    console.error("create-user-direct error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
