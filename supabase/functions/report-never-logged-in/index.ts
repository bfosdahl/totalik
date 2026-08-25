import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENTS = [
  "gard@athenahms.no",
  "joe@athenahms.no",
  "viktor@athenahms.no",
  "post@athenahms.no",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    if (body.action === "send") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) throw new Error("RESEND_API_KEY missing");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Total-IK <noreply@totalik.no>",
          to: Array.isArray(body.to) && body.to.length ? body.to : RECIPIENTS,
          subject: body.subject ?? "Bedrifter som aldri har logget inn - Total-IK",
          html: body.html ?? "<p>Se vedlagt PDF.</p>",
          attachments: [
            {
              filename: body.filename ?? "rapport.pdf",
              content: body.pdfBase64,
              content_type: "application/pdf",
            },
          ],
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(out));
      return new Response(JSON.stringify({ success: true, out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // default: list data
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin.rpc("exec_never_logged_in_report");
    if (error) throw error;
    return new Response(JSON.stringify({ rows: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("report-never-logged-in error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
