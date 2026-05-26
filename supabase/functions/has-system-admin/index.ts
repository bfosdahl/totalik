import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "system_admin")
      .limit(1);

    if (error) throw error;

    const hasSystemAdmin = !!(data && data.length > 0);

    // SECURITY: Once the system has been provisioned with a system admin, the
    // first-run check no longer needs to be publicly enumerable. Require either
    // a valid Supabase user JWT or the optional SETUP_TOKEN shared secret to
    // see the answer. This blocks unauthenticated reconnaissance while still
    // letting the /setup-admin page work on a fresh deployment.
    if (hasSystemAdmin) {
      const authHeader = req.headers.get("Authorization") || "";
      const setupToken = req.headers.get("x-setup-token");
      const expectedSetupToken = Deno.env.get("SETUP_TOKEN");

      let authorized = false;

      if (setupToken && expectedSetupToken && setupToken === expectedSetupToken) {
        authorized = true;
      } else if (authHeader.startsWith("Bearer ")) {
        try {
          const userClient = createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } },
          );
          const { data: userData } = await userClient.auth.getUser();
          if (userData?.user) authorized = true;
        } catch (_e) { /* fall through to 401 */ }
      }

      if (!authorized) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ hasSystemAdmin }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Don't leak internal error details to unauthenticated callers.
    console.error("has-system-admin error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
