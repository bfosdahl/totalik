import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

interface SendDocumentEmailRequest {
  documentType: "deviation" | "handbook" | "daily-report";
  subject: string;
  recipients: string[];
  htmlContent: string;
  senderName?: string;
  companyName?: string;
  attachments?: EmailAttachment[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("E-posttjenesten er ikke konfigurert. Kontakt administrator.");
    }

    const data: SendDocumentEmailRequest = await req.json();
    console.log(`Sending ${data.documentType} email to:`, data.recipients, "attachments:", data.attachments?.length || 0);

    if (!data.recipients || data.recipients.length === 0) {
      throw new Error("Ingen mottakere angitt");
    }

    if (!data.htmlContent) {
      throw new Error("Ingen innhold å sende");
    }

    const body: Record<string, unknown> = {
      from: `${data.companyName || "Total-IK"} <noreply@totalik.no>`,
      to: data.recipients,
      subject: data.subject,
      html: data.htmlContent,
    };

    if (data.attachments && data.attachments.length > 0) {
      body.attachments = data.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType || "application/pdf",
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const emailResponse = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Kunne ikke sende e-post");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending document email:", error);
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
