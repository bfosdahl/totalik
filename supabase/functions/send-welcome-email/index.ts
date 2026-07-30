import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { escapeHtml } from "../_shared/html-escape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
  source?: string; // 'crm' for NextCom orders, 'signup' for self-registration
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, email, firstName, source }: WelcomeEmailRequest = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing userId or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get target user's profile (company + registered email)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, email")
      .eq("user_id", userId)
      .single();

    // ===== AUTHORIZATION =====
    // Cron/server-to-server (auth.userId === null) is trusted.
    // Otherwise: caller must be the user themselves, or an admin of that user's company.
    if (auth.userId) {
      const isSelf = auth.userId === userId;
      if (!isSelf) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", auth.userId);
        const isSystemAdmin = roles?.some((r) => r.role === "system_admin");
        const isCompanyAdmin = roles?.some((r) => r.role === "company_admin");

        let allowed = !!isSystemAdmin;
        if (!allowed && isCompanyAdmin) {
          const { data: callerProfile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("user_id", auth.userId)
            .single();
          allowed = !!callerProfile?.company_id &&
            !!profile?.company_id &&
            callerProfile.company_id === profile.company_id;
        }

        if (!allowed) {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // Never send to an attacker-supplied address: always use the registered email.
    const recipientEmail = profile?.email ?? email;
    if (auth.userId && recipientEmail !== email) {
      return new Response(
        JSON.stringify({ error: "Email does not match the user account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // =========================

    let companyName = "Total-IK";
    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .single();
      if (company?.name) {
        companyName = company.name;
      }
    }

    const loginUrl = "https://totalik.no/auth";
    const isCrmOrder = source === "crm";

    // Different content for CRM customers (immediate access) vs self-signups (needs approval)
    const safeCompanyName = escapeHtml(companyName);
    const safeFirstName = escapeHtml(firstName ?? "");
    const bodyContent = isCrmOrder
      ? `
          <p style="color: #333; font-size: 16px;">
            Din brukerkonto er opprettet og klar til bruk. Du kan logge inn med e-postadressen din og passordet du mottar i en egen e-post.
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">&#10004; Kontoen din er aktiv</h3>
            <p style="color: #555; margin: 0;">Du har full tilgang til ${safeCompanyName} sitt system i Total-IK. Logg inn for &#229; komme i gang.</p>
          </div>
        `
      : `
          <p style="color: #333; font-size: 16px;">
            Din brukerkonto har blitt opprettet. For &#229; f&#229; tilgang til systemet m&#229; kontoen din godkjennes av en administrator.
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0066cc;">
            <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">Hva skjer n&#229;?</h3>
            <ol style="color: #555; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">En administrator vil gjennomg&#229; kontoen din</li>
              <li style="margin-bottom: 8px;">Du vil f&#229; beskjed n&#229;r kontoen er aktivert</li>
              <li>Deretter kan du logge inn og bruke systemet</li>
            </ol>
          </div>
          
          <p style="color: #333; font-size: 16px;">
            Du kan allerede logge inn, men funksjonaliteten vil v&#230;re begrenset til kontoen er godkjent.
          </p>
        `;

    const emailResponse = await resend.emails.send({
      from: `Total-IK <noreply@totalik.no>`,
      to: [recipientEmail],
      subject: `Velkommen til ${companyName} - Konto opprettet`,
      html: `<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"></head>
<body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hei${firstName ? ` ${safeFirstName}` : ''},</p>
          
          
          ${bodyContent}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              G&#229; til innlogging
            </a>
          </div>
          
          ${getTermsNoticeHtml()}
          
          ${getTermsHtml()}
          
          <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #004085; font-size: 14px;">
              <strong>Ved &#229; logge inn bekrefter du at du har lest og godtar avtalevilk&#229;rene ovenfor.</strong>
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Dette er en automatisk generert e-post fra Total-IK.<br>
            Hvis du ikke har opprettet denne kontoen, kan du ignorere denne e-posten.
          </p>
        </div>
</body>
</html>`,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
