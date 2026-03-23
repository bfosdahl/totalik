import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user is system_admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "system_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // All queries in parallel
    const [
      companiesResult,
      profilesResult,
      errors24hResult,
      errors7dResult,
      emailsResult,
      provisioningResult,
      errorTrendResult,
    ] = await Promise.all([
      // Active companies
      adminClient
        .from("companies")
        .select("id, status", { count: "exact" }),

      // Active users
      adminClient
        .from("profiles")
        .select("id, is_active", { count: "exact" }),

      // Client errors last 24h
      adminClient
        .from("client_error_logs")
        .select("id", { count: "exact" })
        .gte("created_at", twentyFourHoursAgo),

      // Client errors last 7d
      adminClient
        .from("client_error_logs")
        .select("id", { count: "exact" })
        .gte("created_at", sevenDaysAgo),

      // Email stats
      adminClient
        .from("email_logs")
        .select("id, status"),

      // User provisioning last 7d
      adminClient
        .from("user_provisioning_log")
        .select("id, all_verified", { count: "exact" })
        .gte("created_at", sevenDaysAgo),

      // Error trend per day (last 7 days) — fetch raw, aggregate in code
      adminClient
        .from("client_error_logs")
        .select("created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true }),
    ]);

    // Aggregate stats
    const totalCompanies = companiesResult.count || 0;
    const activeCompanies = companiesResult.data?.filter((c) => c.status === "active").length || 0;

    const totalUsers = profilesResult.count || 0;
    const activeUsers = profilesResult.data?.filter((p) => p.is_active).length || 0;

    const errors24h = errors24hResult.count || 0;
    const errors7d = errors7dResult.count || 0;

    const totalEmails = emailsResult.data?.length || 0;
    const deliveredEmails = emailsResult.data?.filter((e) => e.status === "delivered").length || 0;
    const bouncedEmails = emailsResult.data?.filter((e) => e.status === "bounced").length || 0;
    const bounceRate = totalEmails > 0 ? Math.round((bouncedEmails / totalEmails) * 100) : 0;

    const provisioningCount = provisioningResult.count || 0;
    const provisioningSuccess = provisioningResult.data?.filter((p) => p.all_verified).length || 0;

    // Error trend: group by day
    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    errorTrendResult.data?.forEach((row) => {
      const day = row.created_at?.slice(0, 10);
      if (day && dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
    });
    const errorTrend = Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    const result = {
      activeCompanies,
      totalCompanies,
      activeUsers,
      totalUsers,
      errors24h,
      errors7d,
      totalEmails,
      deliveredEmails,
      bouncedEmails,
      bounceRate,
      provisioningCount,
      provisioningSuccess,
      errorTrend,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
