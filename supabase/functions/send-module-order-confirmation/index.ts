import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  moduleName: string;
  priceMonthly: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { 
      recipientEmail, 
      recipientName, 
      companyName, 
      moduleName, 
      priceMonthly 
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", recipientEmail);
    console.log("Module:", moduleName, "Company:", companyName);

    const orderDate = new Date().toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Total-IK <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Ordrebekreftelse - ${moduleName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #5B6BFF 0%, #7C8AFF 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
              .order-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .order-row:last-child { border-bottom: none; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              .check { color: #10b981; font-size: 48px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="check">✓</div>
                <h1 style="margin: 0;">Bestilling bekreftet!</h1>
              </div>
              <div class="content">
                <p>Hei ${recipientName},</p>
                <p>Takk for din bestilling! Modulen er nå aktivert og klar til bruk.</p>
                
                <div class="order-box">
                  <h3 style="margin-top: 0;">Ordredetaljer</h3>
                  <div class="order-row">
                    <span>Bedrift:</span>
                    <span>${companyName}</span>
                  </div>
                  <div class="order-row">
                    <span>Modul:</span>
                    <span>${moduleName}</span>
                  </div>
                  <div class="order-row">
                    <span>Bestillingsdato:</span>
                    <span>${orderDate}</span>
                  </div>
                  <div class="order-row">
                    <span>Pris:</span>
                    <span>${priceMonthly} kr/mnd ekskl. mva</span>
                  </div>
                </div>

                <p>Du kan nå begynne å bruke ${moduleName} ved å logge inn i Total-IK.</p>
                
                <p>Faktura sendes til bedriftens registrerte e-postadresse innen de første dagene av neste måned.</p>
                
                <p>Har du spørsmål? Kontakt oss på support@athenahms.no</p>
                
                <p>Med vennlig hilsen,<br><strong>Total-IK teamet</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Total-IK. Alle rettigheter forbeholdt.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-module-order-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
