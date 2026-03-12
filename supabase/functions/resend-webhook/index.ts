import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Status hierarchy: higher number = more advanced status, never downgrade
const STATUS_RANK: Record<string, number> = {
  sent: 0,
  delivered: 1,
  opened: 2,
  clicked: 3,
  bounced: -1,
  failed: -2,
  complained: -3,
};

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Check timestamp drift (max 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(svixTimestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) return false;

  // Compute expected signature
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const secretBytes = Uint8Array.from(
    atob(secret.startsWith("whsec_") ? secret.slice(6) : secret),
    (c) => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign)
  );

  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // svix-signature can contain multiple signatures separated by spaces
  const signatures = svixSignature.split(" ");
  return signatures.some((s) => {
    const val = s.startsWith("v1,") ? s.slice(3) : s;
    return val === expectedSig;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();

    // Verify svix signature
    const valid = await verifyWebhookSignature(body, req.headers, webhookSecret);
    if (!valid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const eventType = event.type as string;
    const data = event.data;
    const resendEmailId = data?.email_id;

    if (!resendEmailId) {
      return new Response(JSON.stringify({ error: "No email_id in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map event type to status and timestamp field
    let newStatus: string | null = null;
    let timestampField: string | null = null;
    const now = new Date().toISOString();

    switch (eventType) {
      case "email.delivered":
        newStatus = "delivered";
        timestampField = "delivered_at";
        break;
      case "email.opened":
        newStatus = "opened";
        timestampField = "opened_at";
        break;
      case "email.clicked":
        newStatus = "clicked";
        timestampField = "clicked_at";
        break;
      case "email.bounced":
        newStatus = "bounced";
        timestampField = "bounced_at";
        break;
      case "email.delivery_delayed":
        newStatus = "delayed";
        break;
      case "email.complained":
        newStatus = "complained";
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Find existing log entry
    const { data: existing } = await supabase
      .from("email_logs")
      .select("id, status")
      .eq("resend_email_id", resendEmailId)
      .maybeSingle();

    if (existing) {
      // Don't downgrade status (clicked > opened > delivered)
      const currentRank = STATUS_RANK[existing.status] ?? 0;
      const newRank = STATUS_RANK[newStatus] ?? 0;

      // Allow negative statuses (bounce/fail/complain) to override, and positive only if higher
      const shouldUpdate =
        newRank < 0 || newRank > currentRank;

      if (shouldUpdate) {
        const updateData: Record<string, unknown> = { status: newStatus };
        if (timestampField) updateData[timestampField] = now;
        if (eventType === "email.bounced" || eventType === "email.complained") {
          updateData.error_message =
            data?.bounce?.message || data?.reason || eventType;
        }

        await supabase
          .from("email_logs")
          .update(updateData)
          .eq("id", existing.id);
      } else if (timestampField) {
        // Still update the timestamp even if we don't change status
        await supabase
          .from("email_logs")
          .update({ [timestampField]: now })
          .eq("id", existing.id);
      }
    } else {
      // Create a new entry if none exists (edge case: webhook arrives before our insert)
      const insertData: Record<string, unknown> = {
        resend_email_id: resendEmailId,
        recipient_email: Array.isArray(data?.to) ? data.to[0] : data?.to || "unknown",
        subject: data?.subject || null,
        status: newStatus,
        email_type: "unknown",
      };
      if (timestampField) insertData[timestampField] = now;

      await supabase.from("email_logs").insert(insertData);
    }

    console.log(`Processed ${eventType} for ${resendEmailId}`);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
