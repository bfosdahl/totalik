import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
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

    const { userId, email, firstName }: WelcomeEmailRequest = await req.json();

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

    // Get user's company info if they have one
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", userId)
      .single();

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

    const emailResponse = await resend.emails.send({
      from: `Total-IK <noreply@totalik.no>`,
      to: [email],
      subject: `Velkommen til ${companyName} - Konto opprettet`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hei${firstName ? ` ${firstName}` : ''},</p>
          
          <p style="color: #333; font-size: 16px;">
            Din brukerkonto har blitt opprettet. For å få tilgang til systemet må kontoen din godkjennes av en administrator.
          </p>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #0066cc;">
            <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">📋 Hva skjer nå?</h3>
            <ol style="color: #555; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">En administrator vil gjennomgå kontoen din</li>
              <li style="margin-bottom: 8px;">Du vil få beskjed når kontoen er aktivert</li>
              <li>Deretter kan du logge inn og bruke systemet</li>
            </ol>
          </div>
          
          <p style="color: #333; font-size: 16px;">
            Du kan allerede logge inn, men funksjonaliteten vil være begrenset til kontoen er godkjent.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
              Gå til innlogging
            </a>
          </div>
          
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
            Hvis du ikke har opprettet denne kontoen, kan du ignorere denne e-posten.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
