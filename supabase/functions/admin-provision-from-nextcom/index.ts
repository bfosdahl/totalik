import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const syncApiKey = Deno.env.get("SYNC_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Invalid auth" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "system_admin")) {
      return json({ error: "Only system_admin allowed" }, 403);
    }

    const body = await req.json();

    // Forward to create-company-from-crm with proper sync api key
    const r = await fetch(`${supabaseUrl}/functions/v1/create-company-from-crm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-api-key": syncApiKey,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    return json(result, r.status);
  } catch (e) {
    console.error('admin-provision-from-nextcom error:', e);
    return json({ error: 'En uventet feil oppstod' }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
