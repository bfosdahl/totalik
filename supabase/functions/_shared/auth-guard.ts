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
      // Verify the JWT locally (does not depend on the session row still
      // existing, which breaks after refresh-token rotation).
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getClaims(token);
      const userId = data?.claims?.sub as string | undefined;
      if (!error && userId) {
        return { userId };
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
