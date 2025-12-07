import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    .map(p => `<li>${p.name}${p.role ? ` (${p.role})` : ""}${p.company ? ` - ${p.company}` : ""}</li>`)
    .join("");

  const itemsHtml = items.length > 0
    ? items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.item_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.topic}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.decision || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.responsible_name || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.deadline ? new Date(item.deadline).toLocaleDateString("nb-NO") : "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.status === "completed" ? "Fullført" : item.status === "in_progress" ? "Pågår" : "Åpen"}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #666;">Ingen saker registrert</td></tr>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Møtereferat - ${meeting.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; color: #333;">${meeting.title}</h1>
        <p style="margin: 0; color: #666;">
          ${meeting.meeting_number} | ${meeting.meeting_type} | ${projectName} (${projectNumber})
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <p><strong>Dato:</strong> ${formatDate(meeting.meeting_date)}</p>
        ${meeting.location ? `<p><strong>Sted:</strong> ${meeting.location}</p>` : ""}
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
          <p style="white-space: pre-wrap;">${meeting.agenda}</p>
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
          <p style="white-space: pre-wrap;">${meeting.notes}</p>
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SendMeetingMinutesRequest = await req.json();
    console.log("Sending meeting minutes to:", data.recipients);

    const html = generateEmailHtml(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KS System <onboarding@resend.dev>",
        to: data.recipients,
        subject: `Møtereferat: ${data.meeting.title} (${data.meeting.meeting_number})`,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending meeting minutes:", error);
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
