import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("x-admin-secret") !== Deno.env.get("ADMIN_ACTIONS_SECRET")) {
    return json({ error: "forbidden" }, 403);
  }

  const body = await req.json().catch(() => null);
  if (!body?.to || !body?.subject || !body?.html) return json({ error: "missing to/subject/html" }, 400);

  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
  const r = await resend.emails.send({
    from: "Total-IK <noreply@totalik.no>",
    to: String(body.to),
    reply_to: typeof body.replyTo === "string" ? body.replyTo : undefined,
    subject: String(body.subject),
    html: String(body.html),
  });

  return json({ success: !r.error, emailId: r.data?.id ?? null, emailError: r.error ?? null });
});
