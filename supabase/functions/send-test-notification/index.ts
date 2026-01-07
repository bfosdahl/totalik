import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestNotificationRequest {
  company_id: string;
  recipient_emails: string[];
  company_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-test-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { company_id, recipient_emails, company_name }: TestNotificationRequest = await req.json();

    if (!company_id || !recipient_emails || recipient_emails.length === 0) {
      console.error("Missing required fields");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending test notification to ${recipient_emails.length} recipients for company ${company_name}`);

    const results = [];
    for (const email of recipient_emails) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Total-IK <noreply@totalik.no>",
          to: [email],
          subject: `Test varsel fra ${company_name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
                .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
                .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🔔 Test Varsel</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">${company_name}</p>
                </div>
                <div class="content">
                  <p>Hei!</p>
                  <p>Dette er en <strong>test-e-post</strong> fra varslingssystemet til ${company_name}.</p>
                  <div style="text-align: center;">
                    <span class="success-badge">✓ Varsling fungerer</span>
                  </div>
                  <p>Hvis du mottar denne e-posten, betyr det at e-postvarsler er korrekt konfigurert for din bedrift.</p>
                  <p style="margin-top: 20px; padding: 15px; background: #fff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <strong>Hva skjer videre?</strong><br>
                    Du vil motta automatiske varsler basert på innstillingene i systemet, inkludert påminnelser om:
                    <ul style="margin: 10px 0;">
                      <li>Avvik og frister</li>
                      <li>Kurs som utløper</li>
                      <li>HMS-kort fornyelse</li>
                    </ul>
                  </p>
                </div>
                <div class="footer">
                  <p style="margin: 0;">Dette er en automatisk test-e-post fra ${company_name}</p>
                  <p style="margin: 5px 0 0 0;">Sendt via Athena HMS</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${email}:`, emailResponse);
        results.push({ email, success: true, id: emailResponse.data?.id });
      } catch (emailError: any) {
        console.error(`Failed to send to ${email}:`, emailError);
        results.push({ email, success: false, error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Test notification complete: ${successCount}/${results.length} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        results,
        message: `${successCount} av ${results.length} test-e-poster sendt`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
