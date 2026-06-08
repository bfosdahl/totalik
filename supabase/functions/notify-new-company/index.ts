import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewCompanyRequest {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    const { companyName, contactPerson, contactEmail }: NewCompanyRequest = await req.json();

    console.log("Sending new company notification:", { companyName, contactPerson, contactEmail });

    const resend = new Resend(resendApiKey);

    const formattedDate = new Date().toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send notification to Gard
    const adminEmailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: ["gard@athenahms.no"],
      subject: `🎉 Ny bedrift registrert: ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Ny bedrift registrert!</h1>
            </div>
            
            <div style="background-color: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
                Hei Gard,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                En ny bedrift har registrert seg i Total-IK:
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Bedriftsnavn:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Kontaktperson:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${contactPerson}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">E-post:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${contactEmail}" style="color: #10b981; text-decoration: none;">${contactEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Registrert:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${formattedDate}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Du kan nå følge opp bedriften i Admin-panelet.
              </p>

              <div style="text-align: center; margin-top: 32px;">
                <a href="https://totalik.no/admin/companies" style="display: inline-block; background: linear-gradient(135deg, #5B6BFF 0%, #7C3AED 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Gå til Admin-panelet
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                Dette er en automatisk varsling fra Total-IK systemet.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin notification sent successfully:", adminEmailResponse);

    return new Response(
      JSON.stringify({ success: true, adminEmailId: adminEmailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-new-company function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
