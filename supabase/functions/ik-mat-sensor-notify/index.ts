import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendSensorAlert, resolveRecipients, type AlertInput } from '../_shared/sensorAlerts.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization') || '';
  const isCron = req.headers.get('x-cron-secret') === Deno.env.get('CRON_SECRET');

  if (!isCron && !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    let scopedCompanyId: string | null = null;
    if (!isCron) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
      );
      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      if (!profile?.company_id) return json({ error: 'Ingen bedrift funnet' }, 403);
      scopedCompanyId = profile.company_id;
    }

    const body = await req.json();
    const { alert } = body as { alert: AlertInput };
    if (!alert || !alert.companyId) return json({ error: 'Mangler alert-payload' }, 400);
    if (scopedCompanyId && scopedCompanyId !== alert.companyId) {
      return json({ error: 'Du kan bare sende varsler for egen bedrift' }, 403);
    }

    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', alert.companyId)
      .maybeSingle();

    const { data: endpoint } = await supabase
      .from('ik_mat_sensor_endpoints')
      .select('alert_emails')
      .eq('company_id', alert.companyId)
      .limit(1)
      .maybeSingle();

    const recipients = await resolveRecipients(
      supabase,
      alert.companyId,
      alert.recipients,
      endpoint?.alert_emails,
    );

    await sendSensorAlert(supabase, {
      ...alert,
      companyName: alert.companyName || company?.name || 'Total-IK',
      recipients,
    });

    return json({ ok: true });
  } catch (error) {
    console.error('ik-mat-sensor-notify error:', error);
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
