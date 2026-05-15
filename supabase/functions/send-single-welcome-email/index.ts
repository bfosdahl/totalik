import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  email: string;
}

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

    // ===== AUTH: Require an authenticated company/system admin =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);
    const isAdmin = roles?.some(r => r.role === "company_admin" || r.role === "system_admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden — admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ===============================================================

    const { email }: SendEmailRequest = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending welcome email to: ${email}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        company_id,
        companies (name)
      `)
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tenant isolation: company_admin can only invite users in their own company
    const isSystemAdmin = roles?.some(r => r.role === "system_admin");
    if (!isSystemAdmin) {
      const { data: requestingProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", requestingUser.id)
        .single();
      if (!requestingProfile || requestingProfile.company_id !== profile.company_id) {
        return new Response(
          JSON.stringify({ error: "Forbidden — cross-tenant access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const companyName = (profile.companies as any)?.name || "Total-IK";
    const firstName = profile.first_name || "";
    const loginUrl = "https://totalik.no/auth";

    // Generate a secure recovery link instead of resetting to a known password
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: { redirectTo: loginUrl },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("Error generating recovery link:", linkErr);
      return new Response(
        JSON.stringify({ error: `Could not generate recovery link: ${linkErr?.message ?? "unknown"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = linkData.properties.action_link;
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: `Total-IK <noreply@totalik.no>`,
      to: [profile.email],
      subject: `Velkommen til ${companyName} - Sett ditt passord`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
          </div>

          <p style="color: #333; font-size: 16px;">Hei${firstName ? ` ${firstName}` : ''},</p>

          <p style="color: #333; font-size: 16px;">
            Du har fått en brukerkonto hos ${companyName} i Total-IK systemet.
          </p>

          <p style="color: #333; font-size: 16px;">
            Klikk på knappen nedenfor for å sette ditt passord og logge inn. Lenken er gyldig i 24 timer.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              Sett passord og logg inn
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">Hvis knappen ikke fungerer, kopier denne lenken inn i nettleseren:</p>
          <p style="color: #0066cc; font-size: 12px; word-break: break-all;">${resetLink}</p>

          ${getTermsNoticeHtml()}

          ${getTermsHtml()}

          <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #004085; font-size: 14px;">
              <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Dette er en automatisk generert e-post fra Total-IK.<br>
            Hvis du har spørsmål, kontakt din administrator.
          </p>
        </div>
      `,
    });

    console.log(`Email sent successfully to ${profile.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-single-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
