import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  notification_type: "deadline" | "assignment" | "status_change" | "shift_reminder";
  project_id?: string;
  link?: string;
  dedupe_key?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");

    const payload: PushPayload = await req.json();

    let authorized = false;
    if (cronSecret && providedSecret && providedSecret === cronSecret) {
      authorized = true;
    } else if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (user && user.id === payload.user_id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Respect the user's notification preferences
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    if (settings) {
      const disabledMap: Record<string, boolean> = {
        deadline: settings.notify_deadlines === false,
        assignment: settings.notify_assignments === false,
        status_change: settings.notify_status_changes === false,
        shift_reminder: settings.notify_shifts_push === false,
      };
      if (settings.push_enabled === false || disabledMap[payload.notification_type]) {
        return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", payload.user_id);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = subscriptions[0].company_id;

    // Log first (dedupe_key has a unique index — a conflict means already sent)
    const { error: logError } = await supabase
      .from("notification_log")
      .insert({
        user_id: payload.user_id,
        company_id: companyId,
        project_id: payload.project_id || null,
        notification_type: payload.notification_type,
        title: payload.title,
        body: payload.body,
        link: payload.link || null,
        dedupe_key: payload.dedupe_key || null,
      });

    if (logError) {
      if (payload.dedupe_key && (logError as any).code === "23505") {
        return new Response(JSON.stringify({ skipped: true, reason: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Error logging notification:", logError.message);
    }

    webpush.setVapidDetails(
      "mailto:noreply@totalik.no",
      vapidPublicKey,
      vapidPrivateKey,
    );

    const notificationBody = JSON.stringify({
      title: payload.title,
      body: payload.body,
      link: payload.link || "/",
      tag: payload.dedupe_key || payload.notification_type,
    });

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationBody,
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          stale.push(sub.endpoint);
        } else {
          console.error("Push send failed:", status, err?.body || err?.message);
        }
      }
    }));

    if (stale.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", stale);
    }

    return new Response(
      JSON.stringify({ success: true, sent, removed: stale.length, logged: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
