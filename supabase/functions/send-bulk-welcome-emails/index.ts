import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileWithCompany {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
  is_active: boolean;
  companies: { name: string } | null;
}

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const rawOffset = Number((body as any)?.offset ?? 0);
    const rawLimit = Number((body as any)?.limit ?? 200);
    const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
    const limit = Number.isFinite(rawLimit) ? Math.min(500, Math.max(1, Math.floor(rawLimit))) : 200;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. System admin only
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "system_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only system admins can send bulk emails" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch a deterministic, paginated slice of active users
    const { data: profiles, error: profilesError, count } = await supabase
      .from("profiles")
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        company_id,
        is_active,
        companies (name)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("user_id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active profiles found to process", processed: 0, sent: 0, failed: 0, total: count || 0, nextOffset: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing batch: ${profiles.length} users (offset ${offset}, total active ${count})`);

    const resend = new Resend(resendApiKey);
    const loginUrl = "https://totalik.no/auth";
    const emailBatchPayload: any[] = [];
    const errors: string[] = [];

    // 4. Generate recovery links + compile payloads with bounded concurrency
    const CONCURRENCY = 20;
    const activeProfiles = profiles as unknown as ProfileWithCompany[];

    for (let i = 0; i < activeProfiles.length; i += CONCURRENCY) {
      const chunk = activeProfiles.slice(i, i + CONCURRENCY);

      await Promise.all(
        chunk.map(async (profile) => {
          if (!profile.email) {
            console.log(`Skipping user ${profile.user_id} - no email`);
            return;
          }

          const companyName = profile.companies?.name || "Total-IK";
          const firstName = profile.first_name || "";

          try {
            const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
              type: "recovery",
              email: profile.email,
              options: { redirectTo: loginUrl },
            });

            if (resetError) {
              console.error(`Failed to generate reset link for ${profile.email}:`, resetError);
              errors.push(`${profile.email}: ${resetError.message}`);
              return;
            }

            const resetLink = resetData?.properties?.action_link || loginUrl;

            emailBatchPayload.push({
              from: `Total-IK <noreply@totalik.no>`,
              to: [profile.email],
              subject: `Velkommen til ${companyName} - Din brukerkonto`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1a1a2e; margin: 0;">Velkommen til Total-IK!</h1>
                  </div>

                  <p style="color: #333; font-size: 16px;">Hei${firstName ? ` ${esc(firstName)}` : ''},</p>

                  <p style="color: #333; font-size: 16px;">
                    Du har en brukerkonto hos ${esc(companyName)} i Total-IK systemet.
                  </p>

                  ${loginBlockHtml(profile.email, resetLink)}

                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Dette er en automatisk generert e-post fra Total-IK.<br>
                    Hvis du har spørsmål, kontakt din administrator.
                  </p>
                </div>
              `,
            });
          } catch (e: any) {
            console.error(`Error preparing email payload for ${profile.email}:`, e);
            errors.push(`${profile.email}: ${e?.message ?? "unknown error"}`);
          }
        })
      );
    }

    // 5. Dispatch via Resend batch API (max 100 per request)
    let successCount = 0;
    const RESEND_MAX_BATCH = 100;

    for (let i = 0; i < emailBatchPayload.length; i += RESEND_MAX_BATCH) {
      const batchChunk = emailBatchPayload.slice(i, i + RESEND_MAX_BATCH);
      const { error: batchError } = await resend.batch.send(batchChunk);

      if (batchError) {
        console.error(`Failed to send batch chunk:`, batchError);
        errors.push(`Resend batch error: ${batchError.message}`);
      } else {
        successCount += batchChunk.length;
      }
    }

    const totalRecords = count || 0;
    const nextOffset = offset + activeProfiles.length < totalRecords ? offset + activeProfiles.length : null;

    console.log(`Bulk email batch complete: ${successCount} sent, ${errors.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: activeProfiles.length,
        sent: successCount,
        failed: errors.length,
        total: totalRecords,
        nextOffset,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk email function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
