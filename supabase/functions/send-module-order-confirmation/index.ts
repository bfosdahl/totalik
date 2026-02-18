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

    // Send confirmation email to customer
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Total-IK <noreply@totalik.no>",
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

                <div class="order-box" style="background: #eff6ff; border: 1px solid #93c5fd;">
                  <h3 style="margin-top: 0; color: #1d4ed8;">🔐 Din innloggingsinformasjon</h3>
                  <div class="order-row" style="border-color: #bfdbfe;">
                    <span>Lenke:</span>
                    <span><a href="https://totalik.no" style="color: #5B6BFF;">https://totalik.no</a></span>
                  </div>
                  <div class="order-row" style="border-color: #bfdbfe;">
                    <span>Brukernavn:</span>
                    <span><strong>${recipientEmail}</strong></span>
                  </div>
                  <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">Bruk «Glemt passord» på innloggingssiden for å sette ditt passord.</p>
                </div>

                <p>Du kan nå begynne å bruke ${moduleName} ved å logge inn i Total-IK.</p>
                
                <p>Faktura sendes til bedriftens registrerte e-postadresse innen de første dagene av neste måned.</p>
                
                <p>Har du spørsmål om kjøpet? Kontakt vår salgssjef:<br>
                <strong>Gard Fosdahl</strong><br>
                📞 <a href="tel:+4748404274" style="color: #5B6BFF;">48 40 42 74</a><br>
                ✉️ <a href="mailto:gard@athenahms.no" style="color: #5B6BFF;">gard@athenahms.no</a></p>
                
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

    console.log("Customer confirmation email sent successfully:", emailResponse);

    // Send notification email to Gard Fosdahl about the new order
    const adminNotificationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Total-IK <noreply@totalik.no>",
        to: ["gard@athenahms.no"],
        subject: `Ny bestilling: ${companyName} har bestilt ${moduleName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
              .order-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1fae5; }
              .order-row:last-child { border-bottom: none; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              .money { color: #10b981; font-size: 32px; margin-bottom: 15px; }
              .highlight { color: #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="money">💰</div>
                <h1 style="margin: 0;">Ny bestilling mottatt!</h1>
              </div>
              <div class="content">
                <p>Hei Gard,</p>
                <p>En ny kunde har bekreftet kjøp gjennom Total-IK!</p>
                
                <div class="order-box">
                  <h3 style="margin-top: 0; color: #059669;">Ordredetaljer</h3>
                  <div class="order-row">
                    <span><strong>Bedrift:</strong></span>
                    <span class="highlight">${companyName}</span>
                  </div>
                  <div class="order-row">
                    <span><strong>Kontaktperson:</strong></span>
                    <span>${recipientName}</span>
                  </div>
                  <div class="order-row">
                    <span><strong>E-post:</strong></span>
                    <span><a href="mailto:${recipientEmail}">${recipientEmail}</a></span>
                  </div>
                  <div class="order-row">
                    <span><strong>Modul:</strong></span>
                    <span>${moduleName}</span>
                  </div>
                  <div class="order-row">
                    <span><strong>Bestillingsdato:</strong></span>
                    <span>${orderDate}</span>
                  </div>
                  <div class="order-row">
                    <span><strong>Pris:</strong></span>
                    <span class="highlight">${priceMonthly} kr/mnd ekskl. mva</span>
                  </div>
                </div>

                <p>Modulen er allerede aktivert for kunden. Husk å følge opp med fakturering.</p>
                
                <p style="color: #6b7280; font-size: 14px;">Denne e-posten er automatisk generert fra Total-IK systemet.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Total-IK - Intern varsling</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const adminNotificationResponse = await adminNotificationRes.json();
    
    if (!adminNotificationRes.ok) {
      console.error("Failed to send admin notification:", adminNotificationResponse);
      // Don't throw - customer email was successful, admin notification is secondary
    } else {
      console.log("Admin notification sent successfully:", adminNotificationResponse);
    }

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
