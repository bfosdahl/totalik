import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Total-IK</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Velkommen til ditt HMS-system</p>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hei ${escapeHtml(displayName)}!</h2>
        <p>Din brukerkonto hos <strong>${escapeHtml(companyName)}</strong> er nå opprettet i Total-IK.</p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Din påloggingsinformasjon:</h3>
          <p style="margin: 5px 0;"><strong>E-post:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 5px 0;">Klikk på knappen nedenfor for å sette ditt passord.</p>
        </div>
        ${loginBlockHtml(email, resetLink)}
        ${getTermsNoticeHtml()}
        ${getTermsHtml()}
        <div style="background: #e8f4f8; border: 1px solid #b8daff; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #004085; font-size: 14px;">
            <strong>Ved å logge inn bekrefter du at du har lest og godtar avtalevilkårene ovenfor.</strong>
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">Har du spørsmål? Kontakt din bedriftsadministrator eller svar på denne e-posten.</p>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${currentYear} Total-IK. Alle rettigheter reservert.</p>
      </div>
    </body>
    </html>
  `;
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
      try {
        const emailBatchPayload = pendingEmails.map(item => ({
          from: "Total-IK <noreply@totalik.no>",
          to: [item.email],
          subject: "Velkommen til Total-IK - innloggingsinformasjon",
          html: buildWelcomeEmailHtml(item.displayName, item.companyName, item.email, item.resetLink)
        }));

        await resend.batch.send(emailBatchPayload);

        pendingEmails.forEach(item => {
          if (results[item.resultIndex]) {
            results[item.resultIndex].emailSent = true;
          }
        });
      } catch (emailErr) {
        console.error("Error sending batch emails via Resend:", emailErr);
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