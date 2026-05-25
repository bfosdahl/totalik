import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth-guard.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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
  companyName?: string; // ignored server-side — kept for backward compatibility
  attachments?: EmailAttachment[];
}

const ALLOWED_DOCUMENT_TYPES = new Set(["deviation", "handbook", "daily-report"]);
const MAX_RECIPIENTS = 50;
const MAX_SUBJECT_LENGTH = 300;
const MAX_HTML_LENGTH = 500_000; // ~500KB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("E-posttjenesten er ikke konfigurert. Kontakt administrator.");
    }

    const data: SendDocumentEmailRequest = await req.json();

    // --- Input validation ---
    if (!ALLOWED_DOCUMENT_TYPES.has(data.documentType)) {
      return new Response(JSON.stringify({ error: "Ugyldig dokumenttype" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!data.subject || typeof data.subject !== "string" || data.subject.length > MAX_SUBJECT_LENGTH) {
      return new Response(JSON.stringify({ error: "Ugyldig emne" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!data.htmlContent || typeof data.htmlContent !== "string" || data.htmlContent.length > MAX_HTML_LENGTH) {
      return new Response(JSON.stringify({ error: "Ugyldig innhold" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Ingen mottakere angitt" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (data.recipients.length > MAX_RECIPIENTS) {
      return new Response(JSON.stringify({ error: `Maks ${MAX_RECIPIENTS} mottakere per e-post` }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const cleanRecipients = Array.from(
      new Set(
        data.recipients
          .filter((r): r is string => typeof r === "string")
          .map((r) => r.trim().toLowerCase())
          .filter((r) => EMAIL_REGEX.test(r) && r.length <= 254),
      ),
    );
    if (cleanRecipients.length === 0) {
      return new Response(JSON.stringify({ error: "Ingen gyldige e-postadresser" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // --- Derive From display name server-side from authenticated user's company ---
    // Never trust client-supplied companyName (prevents impersonation).
    // Also enforce role check: only company/system admins may send transactional emails
    // to prevent the function from being used as a phishing relay by any employee.
    let fromName = "Total-IK";
    let companyId: string | null = null;

    if (auth.userId) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Role check
      const [{ data: isCompanyAdmin }, { data: isSystemAdmin }] = await Promise.all([
        admin.rpc("is_company_admin", { _user_id: auth.userId }),
        admin.rpc("is_system_admin", { _user_id: auth.userId }),
      ]);
      if (!isCompanyAdmin && !isSystemAdmin) {
        return new Response(
          JSON.stringify({ error: "Du har ikke tilgang til å sende e-post fra systemet" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("company_id, companies:company_id(name)")
        .eq("user_id", auth.userId)
        .maybeSingle();

      if (profile?.company_id) {
        companyId = profile.company_id as string;
        const cName = (profile as any).companies?.name;
        if (cName && typeof cName === "string") fromName = cName;
      }
    } else if (data.companyName && typeof data.companyName === "string") {
      // Cron / server-to-server caller can pass through company name
      fromName = data.companyName.slice(0, 100);
    }

    // Strip any characters that could break the From header
    fromName = fromName.replace(/[<>"\r\n]/g, "").trim() || "Total-IK";

    console.log("send-document-email", {
      userId: auth.userId,
      companyId,
      documentType: data.documentType,
      recipientCount: cleanRecipients.length,
      attachmentCount: data.attachments?.length || 0,
    });

    const body: Record<string, unknown> = {
      from: `${fromName} <noreply@totalik.no>`,
      to: cleanRecipients,
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

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending document email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
