import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Authenticate an incoming edge-function request.
 * Accepts EITHER:
 *  - A valid Supabase user JWT in `Authorization: Bearer <token>`, OR
 *  - The shared `x-cron-secret` header matching the CRON_SECRET env var
 *    (used for trusted server-to-server invocations).
 *
 * Returns null on success, or a Response (401) to return immediately.
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string | null } | Response> {
  // 1. Cron / server-to-server shared secret
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    return { userId: null };
  }

  // 2. JWT validation
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        return { userId: data.user.id };
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    }
  }

  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
