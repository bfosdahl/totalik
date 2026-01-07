import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpiringCourse {
  id: string;
  course_name: string;
  expiry_date: string;
  employee_id: string;
  company_id: string;
  reminder_sent_30_days: boolean;
  reminder_sent_7_days: boolean;
}

interface Employee {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
}

const handler = async (req: Request): Promise<Response> => {
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    // Fetch courses expiring within 30 days
    const { data: expiringCourses, error: coursesError } = await supabase
      .from("employee_courses")
      .select("*")
      .not("expiry_date", "is", null)
      .lte("expiry_date", in30Days.toISOString().split("T")[0])
      .gte("expiry_date", today.toISOString().split("T")[0]);

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      throw coursesError;
    }

    console.log(`Found ${expiringCourses?.length || 0} courses expiring within 30 days`);

    const results = {
      checked: expiringCourses?.length || 0,
      reminders_sent: 0,
      errors: [] as string[],
    };

    if (!expiringCourses || expiringCourses.length === 0) {
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    for (const course of expiringCourses as ExpiringCourse[]) {
      const expiryDate = new Date(course.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine which reminder to send
      let shouldSend30Day = daysUntilExpiry <= 30 && daysUntilExpiry > 7 && !course.reminder_sent_30_days;
      let shouldSend7Day = daysUntilExpiry <= 7 && !course.reminder_sent_7_days;

      if (!shouldSend30Day && !shouldSend7Day) {
        continue;
      }

      // Get employee info
      const { data: employee, error: empError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", course.employee_id)
        .single();

      if (empError || !employee) {
        console.error("Error fetching employee:", empError);
        results.errors.push(`Could not find employee ${course.employee_id}`);
        continue;
      }

      // Get company info
      const { data: company, error: compError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", course.company_id)
        .single();

      if (compError || !company) {
        console.error("Error fetching company:", compError);
        results.errors.push(`Could not find company ${course.company_id}`);
        continue;
      }

      // Get company admins for notification
      const { data: companyAdmins, error: adminError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, user_id")
        .eq("company_id", course.company_id);

      if (adminError) {
        console.error("Error fetching company admins:", adminError);
      }

      // Filter to get actual admins
      const adminEmails: string[] = [];
      if (companyAdmins) {
        for (const admin of companyAdmins) {
          const { data: isAdmin } = await supabase.rpc("is_company_admin", { _user_id: admin.user_id });
          if (isAdmin && admin.email) {
            adminEmails.push(admin.email);
          }
        }
      }

      // Collect all recipients
      const recipients: string[] = [];
      if (employee.email) recipients.push(employee.email);
      recipients.push(...adminEmails.filter(e => e !== employee.email));

      if (recipients.length === 0) {
        console.log(`No recipients for course ${course.id}`);
        continue;
      }

      // Send email if Resend is configured
      if (resend) {
        const reminderType = shouldSend7Day ? "7 dager" : "30 dager";
        const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Ansatt";

        try {
          await resend.emails.send({
            from: "Total-IK <noreply@totalik.no>",
            to: recipients,
            subject: `Kurs utløper snart: ${course.course_name} - ${employeeName}`,
            html: `
              <h2>Kurspåminnelse</h2>
              <p>Dette er en påminnelse om at følgende kurs utløper om <strong>${reminderType}</strong>:</p>
              
              <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Kurs:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${course.course_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ansatt:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${employeeName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Utløpsdato:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(course.expiry_date).toLocaleDateString("nb-NO")}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Bedrift:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${company.name}</td>
                </tr>
              </table>
              
              <p>Vennligst sørg for at kurset fornyes før utløpsdatoen for å opprettholde nødvendige sertifiseringer.</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Denne e-posten ble sendt automatisk fra HMS-systemet.
              </p>
            `,
          });

          console.log(`Sent ${reminderType} reminder for course ${course.id} to ${recipients.join(", ")}`);
          results.reminders_sent++;

          // Update course to mark reminder as sent
          const updateData = shouldSend7Day
            ? { reminder_sent_7_days: true }
            : { reminder_sent_30_days: true };

          await supabase
            .from("employee_courses")
            .update(updateData)
            .eq("id", course.id);

        } catch (emailError) {
          console.error("Error sending email:", emailError);
          results.errors.push(`Failed to send email for course ${course.id}: ${emailError}`);
        }
      } else {
        console.log("Resend not configured, skipping email");
      }
    }

    console.log("Check complete:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in check-course-expiry:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
