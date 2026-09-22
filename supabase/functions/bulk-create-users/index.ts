import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { brandedEmail } from "../_shared/email-brand.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTermsHtml, getTermsNoticeHtml } from "../_shared/terms-content.ts";
import { escapeHtml } from "../_shared/html-escape.ts";
import { DEFAULT_PASSWORD, loginBlockHtml } from "../_shared/default-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserToCreate {
  email: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  role: "user" | "company_admin";
}

interface CreateResult {
  email: string;
  success: boolean;
  error?: string;
  emailSent?: boolean;
}

interface PendingEmail {
  email: string;
  displayName: string;
  companyName: string;
  resetLink: string;
  resultIndex: number;
}

function buildWelcomeEmailHtml(displayName: string, companyName: string, email: string, resetLink: string): string {
  return brandedEmail({
    heading: `Velkommen til Total IK`,
    subheading: `Brukerkontoen din hos ${escapeHtml(companyName)} er klar`,
    preheader: "Din brukerkonto i Total IK er opprettet",
    bodyHtml: `
      <p style="margin:0 0 14px 0;">Hei ${escapeHtml(displayName)},</p>
      <p style="margin:0 0 14px 0;">Brukerkontoen din hos <strong>${escapeHtml(companyName)}</strong> er n&aring; opprettet i Total IK.</p>
      ${loginBlockHtml(email, resetLink)}
      ${getTermsNoticeHtml()}
      ${getTermsHtml()}
      <p style="margin:18px 0 0 0;color:#6B7280;font-size:13px;">Ved &aring; logge inn bekrefter du at du har lest og godtar avtalevilk&aring;rene ovenfor.</p>
    `,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isSystemAdmin, error: rpcError } = await supabaseAdmin.rpc("is_system_admin", {
      _user_id: requestingUser.id,
    });

    if (rpcError || !isSystemAdmin) {
      return new Response(
        JSON.stringify({ error: "Only system administrators can bulk create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => null);
    const users = body?.users as UserToCreate[] | undefined;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "Users array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (users.length > 100) {
      return new Response(
        JSON.stringify({ error: "Maximum 100 users per import" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const companyIds = [...new Set(users.map(u => u?.companyId).filter((id): id is string => Boolean(id)))];
    const companyMap = new Map<string, string>();
    
    if (companyIds.length > 0) {
      const { data: companiesData } = await supabaseAdmin
        .from("companies")
        .select("id, name")
        .in("id", companyIds);
      
      companiesData?.forEach(c => companyMap.set(c.id, c.name));
    }

    const results: CreateResult[] = new Array(users.length);
    const provisioningLogs: Record<string, unknown>[] = [];
    const pendingEmails: PendingEmail[] = [];
    
    const CONCURRENCY = 10;

    const processUser = async (user: UserToCreate, index: number) => {
      try {
        const cleanEmail = String(user?.email || "").trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          results[index] = { email: user?.email || "unknown", success: false, error: "Ugyldig e-postadresse" };
          return;
        }

        if (!user.companyId) {
          results[index] = { email: cleanEmail, success: false, error: "Bedrift er påkrevd" };
          return;
        }

        const validRole = (user.role === "company_admin" || user.role === "user") ? user.role : "user";
        const tempPassword = DEFAULT_PASSWORD;

        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName?.trim() || null,
            last_name: user.lastName?.trim() || null,
          },
        });

        if (createError) {
          results[index] = {
            email: cleanEmail,
            success: false,
            error: createError.message.includes("already been registered")
              ? "Bruker finnes allerede"
              : "Kunne ikke opprette bruker",
          };
          return;
        }

        if (!authData.user) {
          results[index] = { email: cleanEmail, success: false, error: "Kunne ikke opprette bruker" };
          return;
        }

        const [{ error: profileError }, { error: roleError }, resetResult] = await Promise.all([
          supabaseAdmin
            .from("profiles")
            .upsert({ user_id: authData.user.id, company_id: user.companyId }, { onConflict: "user_id" }),
          supabaseAdmin
            .from("user_roles")
            .insert({ user_id: authData.user.id, role: validRole }),
          resend ? supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: cleanEmail,
            options: { redirectTo: "https://totalik.no/auth" },
          }) : null
        ]);

        const profileVerified = !profileError;
        const roleVerified = !roleError;
        const resetLink = resetResult?.data?.properties?.action_link;

        if (resend && resetLink) {
          const companyName = companyMap.get(user.companyId) || "din bedrift";
          const displayName = user.firstName?.trim() || cleanEmail.split("@")[0];
          pendingEmails.push({
            email: cleanEmail,
            displayName,
            companyName,
            resetLink,
            resultIndex: index,
          });
        }

        provisioningLogs.push({
          email: cleanEmail,
          company_id: user.companyId,
          role: validRole,
          created_by_id: requestingUser.id,
          auth_created: true,
          profile_updated: profileVerified,
          role_assigned: roleVerified,
          email_sent: false,
          reset_link_generated: Boolean(resetLink),
          all_verified: profileVerified && roleVerified && Boolean(resetLink),
          source: "bulk-create-users",
        });

        results[index] = { email: cleanEmail, success: true, emailSent: false };
      } catch (error) {
        console.error(`Unexpected error for ${user?.email}:`, error);
        results[index] = { email: user?.email || "unknown", success: false, error: "Uventet feil" };
      }
    };

    for (let i = 0; i < users.length; i += CONCURRENCY) {
      const chunk = users.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map((u, j) => processUser(u, i + j)));
    }

    if (resend && pendingEmails.length > 0) {
      const RESEND_BATCH_SIZE = 50;
      for (let i = 0; i < pendingEmails.length; i += RESEND_BATCH_SIZE) {
        const chunk = pendingEmails.slice(i, i + RESEND_BATCH_SIZE);
        try {
          const emailBatchPayload = chunk.map(item => ({
            from: "Total-IK <noreply@totalik.no>",
            to: [item.email],
            subject: "Velkommen til Total-IK - innloggingsinformasjon",
            html: buildWelcomeEmailHtml(item.displayName, item.companyName, item.email, item.resetLink)
          }));

          const { error: batchError } = await resend.batch.send(emailBatchPayload);

          if (batchError) {
            console.error(`Resend batch send returned error (chunk ${i / RESEND_BATCH_SIZE}):`, batchError);
          } else {
            chunk.forEach(item => {
              if (results[item.resultIndex]) {
                results[item.resultIndex].emailSent = true;
              }
            });
          }
        } catch (emailErr) {
          console.error(`Error sending batch emails via Resend (chunk ${i / RESEND_BATCH_SIZE}):`, emailErr);
        }
      }
    }


    if (provisioningLogs.length > 0) {
      provisioningLogs.forEach(log => {
        const res = results.find(r => r.email === log.email);
        if (res) log.email_sent = Boolean(res.emailSent);
      });

      await supabaseAdmin.from("user_provisioning_log").insert(provisioningLogs);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const emailsSent = results.filter(r => r.emailSent).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { total: users.length, success: successCount, failed: failCount, emailsSent }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});