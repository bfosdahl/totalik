import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, message } = await req.json();

    if (!subject || !message || subject.trim().length < 2 || message.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Emne og melding er påkrevd" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile + company info
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, company_id, companies(name, seller_id)")
      .eq("user_id", user.id)
      .single();

    if (!profile || !profile.company_id) {
      return new Response(
        JSON.stringify({ error: "Brukerprofil ikke funnet" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email;
    const companyName = (profile.companies as any)?.name || "Ukjent bedrift";
    const sellerId = (profile.companies as any)?.seller_id;

    // Save ticket to database
    const { error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_name: userName,
        user_email: profile.email || user.email,
        subject: subject.trim(),
        message: message.trim(),
      });

    if (ticketError) {
      console.error("Error saving ticket:", ticketError);
      return new Response(
        JSON.stringify({ error: "Kunne ikke lagre henvendelsen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build recipient list
    const recipients: string[] = ["post@athenahms.no", "gard@athenahms.no"];

    // Add seller email if assigned
    if (sellerId) {
      const { data: seller } = await supabase
        .from("sellers")
        .select("email, name")
        .eq("id", sellerId)
        .single();

      if (seller?.email && !recipients.includes(seller.email)) {
        recipients.push(seller.email);
      }
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "Total-IK Support <noreply@totalik.no>",
      to: recipients,
      replyTo: profile.email || user.email,
      subject: `[Support] ${companyName} - ${subject.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e4a8a 0%, #163a6e 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📩 Ny supporthenvendelse</h1>
          </div>
          
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;"><strong>Bedrift:</strong></td>
                <td style="padding: 8px 0; color: #333;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>Bruker:</strong></td>
                <td style="padding: 8px 0; color: #333;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>E-post:</strong></td>
                <td style="padding: 8px 0; color: #333;">${profile.email || user.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>Emne:</strong></td>
                <td style="padding: 8px 0; color: #333; font-weight: 600;">${subject.trim()}</td>
              </tr>
            </table>
            
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">Melding:</h3>
              <p style="color: #555; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message.trim()}</p>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Svar direkte på denne e-posten for å svare kunden.
            </p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-support-ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
