import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth-guard.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface MeetingParticipant {
  name: string;
  role?: string;
  email?: string;
  company?: string;
}

interface MeetingItem {
  item_number: number;
  topic: string;
  decision?: string;
  responsible_name?: string;
  deadline?: string;
  status: string;
}

interface Meeting {
  meeting_number: string;
  meeting_type: string;
  title: string;
  meeting_date: string;
  location?: string;
  participants: MeetingParticipant[];
  agenda?: string;
  notes?: string;
}

interface SendMeetingMinutesRequest {
  meeting: Meeting;
  items: MeetingItem[];
  projectName: string;
  projectNumber: string;
  recipients: string[];
}

// HTML-escape user-controlled strings before embedding in the email template
// to prevent HTML/script injection via meeting fields.
const esc = (s: unknown): string => {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateEmailHtml = (data: SendMeetingMinutesRequest): string => {
  const { meeting, items, projectName, projectNumber } = data;

  const participantsHtml = meeting.participants
    .map(p => `<li>${esc(p.name)}${p.role ? ` (${esc(p.role)})` : ""}${p.company ? ` - ${esc(p.company)}` : ""}</li>`)
    .join("");

  const itemsHtml = items.length > 0
    ? items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.item_number)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.topic)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.decision || "-")}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.responsible_name || "-")}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.deadline ? esc(new Date(item.deadline).toLocaleDateString("nb-NO")) : "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.status === "completed" ? "Fullført" : item.status === "in_progress" ? "Pågår" : "Åpen"}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #666;">Ingen saker registrert</td></tr>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Møtereferat - ${esc(meeting.title)}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; color: #333;">${esc(meeting.title)}</h1>
        <p style="margin: 0; color: #666;">
          ${esc(meeting.meeting_number)} | ${esc(meeting.meeting_type)} | ${esc(projectName)} (${esc(projectNumber)})
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <p><strong>Dato:</strong> ${esc(formatDate(meeting.meeting_date))}</p>
        ${meeting.location ? `<p><strong>Sted:</strong> ${esc(meeting.location)}</p>` : ""}
      </div>

      ${meeting.participants.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">Deltakere</h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${participantsHtml}
          </ul>
        </div>
      ` : ""}

      ${meeting.agenda ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">Agenda</h2>
          <p style="white-space: pre-wrap;">${esc(meeting.agenda)}</p>
        </div>
      ` : ""}

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin-bottom: 10px;">Saker og oppfølgingspunkter</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Sak</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Beslutning</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Ansvarlig</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Frist</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      ${meeting.notes ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">Notater</h2>
          <p style="white-space: pre-wrap;">${esc(meeting.notes)}</p>
        </div>
      ` : ""}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>Dette møtereferatet ble generert automatisk fra KS-systemet.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const data: SendMeetingMinutesRequest = await req.json();

    // --- Authorization: only company/system admins or HMS-responsible may send ---
    // Prevents the endpoint from being used as a phishing/spam relay by any employee.
    if (auth.userId) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const [{ data: isCompanyAdmin }, { data: isSystemAdmin }, { data: isHmsResp }] = await Promise.all([
        admin.rpc("is_company_admin", { _user_id: auth.userId }),
        admin.rpc("is_system_admin", { _user_id: auth.userId }),
        admin.rpc("is_hms_responsible", { user_id: auth.userId }),
      ]);
      if (!isCompanyAdmin && !isSystemAdmin && !isHmsResp) {
        return new Response(
          JSON.stringify({ error: "Du har ikke tilgang til å sende møtereferat" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    // --- Validate recipients: cap count + enforce valid email format ---
    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Minst én mottaker kreves" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    if (data.recipients.length > MAX_RECIPIENTS) {
      return new Response(
        JSON.stringify({ error: `Maks ${MAX_RECIPIENTS} mottakere per e-post` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const cleanRecipients = data.recipients
      .map(r => (typeof r === "string" ? r.trim().toLowerCase() : ""))
      .filter(r => EMAIL_RE.test(r));
    if (cleanRecipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Ingen gyldige e-postadresser" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Sending meeting minutes to:", cleanRecipients.length, "recipient(s)");

    const html = generateEmailHtml({ ...data, recipients: cleanRecipients });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Total-IK <noreply@totalik.no>",
        to: cleanRecipients,
        subject: `Møtereferat: ${data.meeting.title} (${data.meeting.meeting_number})`,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Email sent successfully");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending meeting minutes:", error?.message || error);
    return new Response(
      JSON.stringify({ error: "Kunne ikke sende møtereferat" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
