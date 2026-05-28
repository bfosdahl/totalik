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

interface Checklist {
  id: string;
  title: string;
  deadline_date: string;
  responsible_name: string | null;
  responsible_user_id: string | null;
  status: string;
  project_id: string;
}

interface Project {
  id: string;
  project_name: string;
  project_number: string;
  company_id: string;
}

interface Profile {
  email: string | null;
  first_name: string | null;
}

interface Company {
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Check KS2 deadlines function called");

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

    // Get all incomplete checklists with deadlines and responsible users
    const { data: checklists, error: checklistError } = await supabase
      .from("ks_module2_checklists")
      .select(`
        id, title, deadline_date, responsible_name, responsible_user_id, status, project_id,
        ks_module2_projects!inner(id, project_name, project_number, company_id)
      `)
      .in("status", ["planned", "in_progress"])
      .not("deadline_date", "is", null)
      .not("responsible_user_id", "is", null);

    if (checklistError) {
      console.error("Error fetching checklists:", checklistError);
      throw checklistError;
    }

    console.log(`Found ${checklists?.length || 0} incomplete checklists with deadlines`);

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const checklist of checklists || []) {
      const project = (checklist as any).ks_module2_projects;
      const dueDate = new Date(checklist.deadline_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let reminderType: string | null = null;
      let subject = "";
      let urgency = "";

      if (daysUntilDue < 0) {
        reminderType = "overdue";
        subject = `⚠️ FORFALT: Egenkontroll "${checklist.title}" har passert fristen`;
        urgency = "Egenkontroll har passert fristen og krever umiddelbar oppmerksomhet.";
      } else if (daysUntilDue === 0) {
        reminderType = "day_of";
        subject = `⏰ I dag: Egenkontroll "${checklist.title}" har frist i dag`;
        urgency = "Egenkontroll har frist i dag.";
      } else if (daysUntilDue === 1) {
        reminderType = "day_before";
        subject = `📅 I morgen: Egenkontroll "${checklist.title}" har frist i morgen`;
        urgency = "Egenkontroll har frist i morgen.";
      } else if (daysUntilDue <= 3) {
        reminderType = "three_days";
        subject = `📌 Snart frist: Egenkontroll "${checklist.title}" har frist om ${daysUntilDue} dager`;
        urgency = `Egenkontroll har frist om ${daysUntilDue} dager.`;
      } else if (daysUntilDue === 7) {
        reminderType = "week_before";
        subject = `📋 Påminnelse: Egenkontroll "${checklist.title}" har frist om en uke`;
        urgency = "Egenkontroll har frist om en uke.";
      }

      if (!reminderType) continue;

      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from("ks_module2_checklist_reminders")
        .select("id")
        .eq("checklist_id", checklist.id)
        .eq("reminder_type", reminderType)
        .maybeSingle();

      if (existingReminder) {
        console.log(`Reminder ${reminderType} already sent for checklist ${checklist.id}`);
        continue;
      }

      // Get responsible user's email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("user_id", checklist.responsible_user_id)
        .maybeSingle();

      if (!profile?.email) {
        console.log(`No email found for responsible user of checklist ${checklist.id}`);
        continue;
      }

      // Get company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", project.company_id)
        .maybeSingle();

      const responsibleName = checklist.responsible_name || profile.first_name || "Bruker";
      const companyName = company?.name || "Ditt selskap";
      const formattedDueDate = new Date(checklist.deadline_date).toLocaleDateString("nb-NO", {
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
                .header { background: ${reminderType === 'overdue' ? '#dc2626' : reminderType === 'day_of' ? '#ea580c' : '#5B6BFF'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${reminderType === 'overdue' ? '#dc2626' : '#5B6BFF'}; }
                .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
                .value { font-size: 16px; font-weight: 500; }
                .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 20px;">KS Egenkontroll Påminnelse</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">${esc(companyName)}</p>
                </div>
                <div class="content">
                  <p>Hei ${esc(responsibleName)},</p>
                  <p>${urgency}</p>
                  
                  <div class="info-box">
                    <div style="margin-bottom: 10px;">
                      <span class="label">Prosjekt</span>
                      <div class="value">${esc(project.project_number)} - ${esc(project.project_name)}</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                      <span class="label">Egenkontroll</span>
                      <div class="value">${esc(checklist.title)}</div>
                    </div>
                    <div>
                      <span class="label">Frist</span>
                      <div class="value">${formattedDueDate}</div>
                    </div>
                  </div>
                  
                  <p>Vennligst logg inn for å fullføre egenkontroll før fristen.</p>
                  
                  <div class="footer">
                    <p>Denne e-posten ble sendt automatisk fra ${esc(companyName)} sitt KS-system.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${profile.email} for checklist ${checklist.id}:`, emailResponse);

        // Record the reminder
        const { error: insertError } = await supabase
          .from("ks_module2_checklist_reminders")
          .insert({
            checklist_id: checklist.id,
            project_id: project.id,
            company_id: project.company_id,
            reminder_type: reminderType,
            recipient_email: profile.email,
          });

        if (insertError) {
          console.error("Error recording reminder:", insertError);
        }

        emailsSent.push(`${checklist.title} (${reminderType}) -> ${profile.email}`);
      } catch (emailError: any) {
        console.error(`Error sending email for checklist ${checklist.id}:`, emailError);
        errors.push(`${checklist.title}: ${emailError.message}`);
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
    console.error("Error in check-ks2-deadlines function:", error);
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
