import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const priorityLabels: Record<string, string> = {
  low: "Lav", medium: "Medium", high: "Høy", critical: "Kritisk",
};
const priorityColors: Record<string, string> = {
  low: "#6b7280", medium: "#f59e0b", high: "#ef4444", critical: "#dc2626",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    const isCron = !!(cronSecret && expectedSecret && cronSecret === expectedSecret);

    let callerCompanyId: string | null = null;

    if (!isCron) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userId = userData.user.id;

      const [{ data: roles }, { data: profile }] = await Promise.all([
        admin.from('user_roles').select('role').eq('user_id', userId),
        admin.from('profiles').select('company_id, is_hms_responsible').eq('user_id', userId).maybeSingle(),
      ]);
      const roleSet = new Set((roles || []).map((r: any) => r.role));
      const allowed = roleSet.has('company_admin') || roleSet.has('system_admin') || profile?.is_hms_responsible === true;
      if (!allowed || !profile?.company_id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      callerCompanyId = profile.company_id;
    }

    const body = await req.json();
    const {
      deviation_id,
      assignee_email,
      due_date,
      priority,
    } = body;

    if (!assignee_email || typeof assignee_email !== 'string' || !isValidEmail(assignee_email)) {
      return new Response(JSON.stringify({ message: "Invalid recipient" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify deviation belongs to caller's company; pull sanitized fields from DB
    let deviation: any = null;
    if (deviation_id) {
      const { data } = await admin
        .from('deviations')
        .select('id, company_id, title, deviation_number, category')
        .eq('id', deviation_id)
        .maybeSingle();
      deviation = data;
    }

    if (!isCron) {
      if (!deviation || deviation.company_id !== callerCompanyId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify recipient is in same company
      const { data: recipientProfile } = await admin
        .from('profiles')
        .select('company_id, first_name, last_name')
        .eq('email', assignee_email.toLowerCase().trim())
        .maybeSingle();
      if (!recipientProfile || recipientProfile.company_id !== callerCompanyId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Use DB-sourced values where possible
    const deviation_number = deviation?.deviation_number || body.deviation_number || '';
    const deviation_title = deviation?.title || body.deviation_title || '';
    const category = deviation?.category || body.category || '';
    const assignee_name = body.assignee_name || '';
    const assigner_name = body.assigner_name || '';

    const priorityLabel = priorityLabels[priority] || String(priority || '');
    const priorityColor = priorityColors[priority] || "#6b7280";

    const emailResponse = await resend.emails.send({
      from: "Total-IK <noreply@totalik.no>",
      to: [assignee_email],
      subject: `Du er tildelt avvik ${deviation_number}: ${deviation_title}`,
      html: `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nytt avvik tildelt deg</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-top: 0;">Hei ${esc(assignee_name)},</p>
            <p>${esc(assigner_name)} har tildelt deg følgende avvik:</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <span style="font-family: monospace; color: #6b7280; font-size: 14px;">${esc(deviation_number)}</span>
                <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-left: 10px;">${esc(priorityLabel)}</span>
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${esc(deviation_title)}</h2>
              <div style="margin-top: 15px; font-size: 14px;">
                <div><span style="color: #6b7280;">Kategori:</span> <strong>${esc(category)}</strong></div>
                <div><span style="color: #6b7280;">Frist:</span> <strong>${esc(due_date)}</strong></div>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Logg inn i Total-IK for å se detaljer og behandle avviket.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0; text-align: center;">
              Denne e-posten ble sendt automatisk fra Total-IK.
            </p>
          </div>
        </body></html>
      `,
    });

    return new Response(JSON.stringify({ success: true, id: (emailResponse as any)?.data?.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-deviation-assignment:", error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
