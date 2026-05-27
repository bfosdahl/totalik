import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { requestId, employeeName, startDate, endDate, type } = await req.json();
    
    console.log("Sending time off request notification:", { requestId, employeeName, startDate, endDate, type });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get employee profile and company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', requestId)
      .single();

    if (!profile?.company_id) {
      throw new Error('Could not find company for employee');
    }

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single();

    // Get company admins to notify
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, user_id')
      .eq('company_id', profile.company_id)
      .eq('is_active', true);

    const adminEmails: string[] = [];
    if (allProfiles) {
      for (const p of allProfiles) {
        if (!p.email || !p.user_id) continue;
        const { data: isAdmin } = await supabase.rpc('is_company_admin', { _user_id: p.user_id });
        if (isAdmin) {
          adminEmails.push(p.email);
        }
      }
    }

    console.log(`Found ${adminEmails.length} admins to notify`);

    const typeName = type === 'ferie' ? 'Ferie' : type === 'sykdom' ? 'Sykdom' : type === 'permisjon' ? 'Permisjon' : 'Annet';
    const companyName = company?.name || 'Din bedrift';
    let emailsSent = 0;

    if (resendApiKey && adminEmails.length > 0) {
      const formattedStart = new Date(startDate).toLocaleDateString('nb-NO');
      const formattedEnd = new Date(endDate).toLocaleDateString('nb-NO');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Total-IK <noreply@totalik.no>`,
          to: adminEmails,
          subject: `Ny fraværsforespørsel fra ${String(employeeName ?? '').slice(0, 200)} - ${typeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">Ny fraværsforespørsel</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hei,</p>
                <p><strong>${esc(employeeName)}</strong> har sendt inn en forespørsel om fravær:</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Type:</strong> ${esc(typeName)}</p>
                  <p style="margin: 4px 0;"><strong>Fra:</strong> ${formattedStart}</p>
                  <p style="margin: 4px 0;"><strong>Til:</strong> ${formattedEnd}</p>
                </div>
                <p>Logg inn i Total-IK for å godkjenne eller avslå forespørselen.</p>
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
        emailsSent = adminEmails.length;
        console.log(`Email sent to ${adminEmails.join(', ')}`);
      } else {
        const err = await res.json();
        console.error('Resend error:', err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent', emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in notify-time-off-request:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
