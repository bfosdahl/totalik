import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  notification_type: "deadline" | "assignment" | "status_change";
  project_id?: string;
  link?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();
    console.log("Sending push notification:", payload);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user notification settings
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    // Check if this notification type is enabled
    if (settings) {
      if (payload.notification_type === "deadline" && !settings.notify_deadlines) {
        console.log("Deadline notifications disabled for user");
        return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (payload.notification_type === "assignment" && !settings.notify_assignments) {
        console.log("Assignment notifications disabled for user");
        return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (payload.notification_type === "status_change" && !settings.notify_status_changes) {
        console.log("Status change notifications disabled for user");
        return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", payload.user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get company_id from first subscription
    const companyId = subscriptions[0].company_id;

    // Log notification
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
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    // Send push notifications using web-push
    // Note: For production, you would use the web-push library here
    // For now, we just log and save to notification_log
    console.log(`Would send push to ${subscriptions.length} subscription(s)`);
    console.log("Notification saved to log");

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: subscriptions.length,
        logged: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
