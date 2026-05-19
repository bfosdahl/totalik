import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { requireAuth } from "../_shared/auth-guard.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface NotifyDeviationRequest {
  deviation_id: string;
  deviation_number: string;
  deviation_title: string;
  assignee_email: string;
  assignee_name: string;
  assigner_name: string;
  due_date: string;
  priority: string;
  category: string;
}

const priorityLabels: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

const priorityColors: Record<string, string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      deviation_id,
      deviation_number,
      deviation_title,
      assignee_email,
      assignee_name,
      assigner_name,
      due_date,
      priority,
      category,
    }: NotifyDeviationRequest = await req.json();

    console.log("Sending deviation assignment notification:", {
      deviation_number,
      assignee_email,
      assignee_name,
    });

    if (!assignee_email) {
      console.log("No assignee email provided, skipping notification");
      return new Response(
        JSON.stringify({ message: "No email to send to" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const priorityLabel = priorityLabels[priority] || priority;
    const priorityColor = priorityColors[priority] || "#6b7280";

    const emailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [assignee_email],
      subject: `Du er tildelt avvik ${deviation_number}: ${deviation_title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nytt avvik tildelt deg</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-top: 0;">Hei ${assignee_name},</p>
            
            <p>${assigner_name} har tildelt deg følgende avvik:</p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-family: monospace; color: #6b7280; font-size: 14px;">${deviation_number}</span>
                <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${priorityLabel}</span>
              </div>
              
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${deviation_title}</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; font-size: 14px;">
                <div>
                  <span style="color: #6b7280;">Kategori:</span>
                  <span style="margin-left: 5px; font-weight: 500;">${category}</span>
                </div>
                <div>
                  <span style="color: #6b7280;">Frist:</span>
                  <span style="margin-left: 5px; font-weight: 500;">${due_date}</span>
                </div>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Logg inn i Total-IK for å se detaljer og behandle avviket.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0; text-align: center;">
              Denne e-posten ble sendt automatisk fra Total-IK.<br>
              Vennligst ikke svar på denne e-posten.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-deviation-assignment function:", error);
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
