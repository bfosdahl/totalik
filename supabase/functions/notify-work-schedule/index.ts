import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Allow trusted cron invocations
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

      // Role check: company_admin OR system_admin OR hms_responsible
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
    const { employeeEmail, scheduleDate, startTime, endTime } = body;

    if (!employeeEmail || typeof employeeEmail !== 'string' || !isValidEmail(employeeEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid recipient' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify recipient belongs to caller's company (skip for cron)
    const { data: recipient } = await admin
      .from('profiles')
      .select('first_name, last_name, email, company_id, companies(name)')
      .eq('email', employeeEmail.toLowerCase().trim())
      .maybeSingle();

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Recipient not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isCron && recipient.company_id !== callerCompanyId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const employeeName = `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim();
    const companyName = (recipient.companies as any)?.name || 'din bedrift';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;

    if (resendApiKey) {
      let formattedDate = '';
      try {
        formattedDate = new Date(scheduleDate).toLocaleDateString('nb-NO', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
      } catch { formattedDate = String(scheduleDate || ''); }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Total-IK <noreply@totalik.no>`,
          to: [recipient.email],
          subject: `Ny arbeidsplan - ${formattedDate}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">📅 Ny arbeidsplan</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hei ${esc(employeeName)},</p>
                <p>Du har fått en ny arbeidsplan:</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Dato:</strong> ${esc(formattedDate)}</p>
                  <p style="margin: 4px 0;"><strong>Tid:</strong> ${esc(startTime)} - ${esc(endTime)}</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Automatisk varsel fra ${esc(companyName)} via Total-IK.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) {
        emailSent = true;
      } else {
        console.error('Resend error');
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in notify-work-schedule:", error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
