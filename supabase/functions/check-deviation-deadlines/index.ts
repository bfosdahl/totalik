import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

interface Deviation {
  id: string;
  deviation_number: string;
  title: string;
  due_date: string;
  assignee_name: string | null;
  assignee_id: string | null;
  company_id: string;
  status: string;
}

interface Profile {
  email: string | null;
  first_name: string | null;
}

interface Company {
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Check deviation deadlines function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled job security
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Get all open/in-progress deviations with assignees
    const { data: deviations, error: devError } = await supabase
      .from("deviations")
      .select("id, deviation_number, title, due_date, assignee_name, assignee_id, company_id, status")
      .in("status", ["open", "in-progress"])
      .eq("is_deleted", false)
      .not("due_date", "is", null)
      .not("assignee_id", "is", null);

    if (devError) {
      console.error("Error fetching deviations:", devError);
      throw devError;
    }

    console.log(`Found ${deviations?.length || 0} active deviations with assignees`);

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const deviation of deviations || []) {
      const dueDate = new Date(deviation.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let reminderType: string | null = null;
      let subject = "";
      let urgency = "";

      if (daysUntilDue < 0) {
        reminderType = "overdue";
        subject = `⚠️ FORFALT: Avvik ${deviation.deviation_number} har passert fristen`;
        urgency = "Avviket har passert fristen og krever umiddelbar oppmerksomhet.";
      } else if (daysUntilDue === 0) {
        reminderType = "day_of";
        subject = `⏰ I dag: Avvik ${deviation.deviation_number} har frist i dag`;
        urgency = "Avviket har frist i dag.";
      } else if (daysUntilDue === 1) {
        reminderType = "day_before";
        subject = `📅 I morgen: Avvik ${deviation.deviation_number} har frist i morgen`;
        urgency = "Avviket har frist i morgen.";
      } else if (daysUntilDue <= 3) {
        reminderType = "three_days";
        subject = `📌 Snart frist: Avvik ${deviation.deviation_number} har frist om ${daysUntilDue} dager`;
        urgency = `Avviket har frist om ${daysUntilDue} dager.`;
      } else if (daysUntilDue === 7) {
        reminderType = "week_before";
        subject = `📋 Påminnelse: Avvik ${deviation.deviation_number} har frist om en uke`;
        urgency = "Avviket har frist om en uke.";
      }

      if (!reminderType) continue;

      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from("deviation_deadline_reminders")
        .select("id")
        .eq("deviation_id", deviation.id)
        .eq("reminder_type", reminderType)
        .maybeSingle();

      if (existingReminder) {
        console.log(`Reminder ${reminderType} already sent for deviation ${deviation.id}`);
        continue;
      }

      // Get assignee email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("user_id", deviation.assignee_id)
        .maybeSingle();

      if (!profile?.email) {
        console.log(`No email found for assignee of deviation ${deviation.id}`);
        continue;
      }

      // Get company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", deviation.company_id)
        .maybeSingle();

      const assigneeName = deviation.assignee_name || profile.first_name || "Bruker";
      const companyName = company?.name || "Ditt selskap";
      const formattedDueDate = new Date(deviation.due_date).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      try {
        const emailResponse = await resend.emails.send({
          from: `${companyName} <noreply@totalik.no>`,
          to: [profile.email],
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: ${reminderType === 'overdue' ? '#dc2626' : reminderType === 'day_of' ? '#ea580c' : '#2563eb'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .deviation-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${reminderType === 'overdue' ? '#dc2626' : '#2563eb'}; }
                .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
                .value { font-size: 16px; font-weight: 500; }
                .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 20px;">Avvikspåminnelse</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">${esc(companyName)}</p>
                </div>
                <div class="content">
                  <p>Hei ${esc(assigneeName)},</p>
                  <p>${urgency}</p>
                  
                  <div class="deviation-box">
                    <div style="margin-bottom: 10px;">
                      <span class="label">Avviksnummer</span>
                      <div class="value">${esc(deviation.deviation_number)}</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                      <span class="label">Tittel</span>
                      <div class="value">${esc(deviation.title)}</div>
                    </div>
                    <div>
                      <span class="label">Frist</span>
                      <div class="value">${formattedDueDate}</div>
                    </div>
                  </div>
                  
                  <p>Vennligst logg inn for å oppdatere status eller fullføre nødvendige tiltak.</p>
                  
                  <div class="footer">
                    <p>Denne e-posten ble sendt automatisk fra ${esc(companyName)} sitt internkontrollsystem.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${profile.email} for deviation ${deviation.id}:`, emailResponse);

        // Record the reminder
        const { error: insertError } = await supabase
          .from("deviation_deadline_reminders")
          .insert({
            deviation_id: deviation.id,
            company_id: deviation.company_id,
            reminder_type: reminderType,
            recipient_email: profile.email,
          });

        if (insertError) {
          console.error("Error recording reminder:", insertError);
        }

        emailsSent.push(`${deviation.deviation_number} (${reminderType}) -> ${profile.email}`);
      } catch (emailError: any) {
        console.error(`Error sending email for deviation ${deviation.id}:`, emailError);
        errors.push(`${deviation.deviation_number}: ${emailError.message}`);
      }
    }

    console.log(`Finished processing. Sent ${emailsSent.length} emails, ${errors.length} errors.`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors,
        summary: `Sent ${emailsSent.length} reminder(s), ${errors.length} error(s)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-deviation-deadlines function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
