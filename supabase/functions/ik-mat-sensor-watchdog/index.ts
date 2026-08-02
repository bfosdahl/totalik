import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { nextDeviationNumber, localDateString } from '../_shared/sensorAlerts.ts';
import type { AlertInput } from '../_shared/sensorAlerts.ts';
import { recordJobRun } from "../_shared/jobRun.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function invokeNotify(supabase: ReturnType<typeof createClient>, alert: AlertInput) {
  try {
    const { error } = await supabase.functions.invoke('ik-mat-sensor-notify', {
      body: { alert },
    });
    if (error) throw error;
  } catch (e) {
    console.error('ik-mat-sensor-notify invoke failed:', e);
    throw e;
  }
}

/**
 * Vakthund for IK-Mat sensorer.
 * Kjores av pg_cron hvert 15. minutt og oppdager sensorer som har sluttet a sende data.
 * Kan ogsa kalles manuelt av en innlogget administrator (dry-run/na-sjekk).
 */
Deno.serve(async (req) => {
  const jobStart = Date.now();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const cronSecret = req.headers.get('x-cron-secret');
  const isCron = !!cronSecret && cronSecret === Deno.env.get('CRON_SECRET');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  let scopedCompanyId: string | null = null;

  if (!isCron) {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
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

  try {
    let query = supabase
      .from('ik_mat_sensors')
      .select('*')
      .eq('is_active', true);
    if (scopedCompanyId) query = query.eq('company_id', scopedCompanyId);

    const { data: sensors, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const results: any[] = [];
    const companyCache = new Map<string, string>();

    for (const sensor of sensors ?? []) {
      const offlineAfterMs = (sensor.offline_after_minutes ?? 120) * 60 * 1000;
      const last = sensor.last_reading_at ? new Date(sensor.last_reading_at).getTime() : null;
      const isOffline = last === null
        ? new Date(sensor.created_at).getTime() < now - offlineAfterMs
        : last < now - offlineAfterMs;

      if (!isOffline) {
        if (sensor.is_offline) {
          await supabase
            .from('ik_mat_sensors')
            .update({ is_offline: false, last_offline_alert_at: null })
            .eq('id', sensor.id);
          results.push({ sensor: sensor.external_id, status: 'back_online' });
        }
        continue;
      }

      // Varsle maks en gang per 12 timer per sensor
      const lastAlert = sensor.last_offline_alert_at ? new Date(sensor.last_offline_alert_at).getTime() : 0;
      if (now - lastAlert < 12 * 60 * 60 * 1000) {
        results.push({ sensor: sensor.external_id, status: 'offline_muted' });
        continue;
      }

      if (!companyCache.has(sensor.company_id)) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', sensor.company_id)
          .maybeSingle();
        companyCache.set(sensor.company_id, company?.name || 'Total-IK');
      }
      const companyName = companyCache.get(sensor.company_id)!;

      let equipmentName: string | null = null;
      if (sensor.equipment_id) {
        const { data: eq } = await supabase
          .from('ik_mat_temperature_equipment')
          .select('name')
          .eq('id', sensor.equipment_id)
          .maybeSingle();
        equipmentName = eq?.name ?? null;
      }

      const sensorName = sensor.name || sensor.external_id;
      const lastText = sensor.last_reading_at
        ? new Date(sensor.last_reading_at).toLocaleString('nb-NO')
        : 'Aldri';

      const deviationNumber = await nextDeviationNumber(supabase, sensor.company_id);
      const due = new Date();
      due.setDate(due.getDate() + 1);
      await supabase.from('deviations').insert({
        company_id: sensor.company_id,
        deviation_number: deviationNumber,
        title: `Sensor uten kontakt: ${equipmentName || sensorName}`,
        description:
          'Automatisk registrert: sensoren har ikke sendt data innenfor forventet intervall.\n\n' +
          `Sensor: ${sensorName}\n` +
          (equipmentName ? `Utstyr: ${equipmentName}\n` : '') +
          `Siste maling: ${lastText}\n` +
          `Grense for frakoblet: ${sensor.offline_after_minutes ?? 120} minutter\n\n` +
          'Kontroller temperaturen manuelt og sjekk batteri/nettverk pa sensoren.',
        category: 'temperature',
        type: 'ik_mat',
        priority: 'high',
        status: 'open',
        reporter_name: `Sensorvakt: ${sensorName}`,
        due_date: localDateString(due),
        incident_location: sensor.location || null,
        department_id: sensor.department_id ?? null,
      });

      await invokeNotify(supabase, {
        companyId: sensor.company_id,
        companyName,
        sensorId: sensor.id,
        sensorName,
        equipmentId: sensor.equipment_id,
        equipmentName,
        alertType: 'offline',
        severity: 'high',
        subject: `Sensor uten kontakt: ${equipmentName || sensorName}`,
        lines: [
          `Sensor: ${sensorName}`,
          equipmentName ? `Utstyr: ${equipmentName}` : 'Utstyr: ikke koblet',
          `Siste maling: ${lastText}`,
          `Grense: ${sensor.offline_after_minutes ?? 120} minutter uten data`,
          `Avvik opprettet: ${deviationNumber}`,
          'Kontroller temperaturen manuelt til sensoren er tilbake.',
        ],
        deviationNumber,
        recipients: sensor.alert_emails,
      });

      await supabase
        .from('ik_mat_sensors')
        .update({ is_offline: true, last_offline_alert_at: new Date().toISOString() })
        .eq('id', sensor.id);

      results.push({ sensor: sensor.external_id, status: 'offline_alert', deviation: deviationNumber });
    }

    await recordJobRun("ik-mat-sensor-watchdog", "success", jobStart, {
      itemsProcessed: sensors?.length ?? 0,
      notificationsSent: results.length,
      details: { results },
    });

    return json({ ok: true, checked: sensors?.length ?? 0, results });
  } catch (error) {
    console.error('ik-mat-sensor-watchdog error:', error);
    await recordJobRun("ik-mat-sensor-watchdog", "error", jobStart, {
      errorCount: 1,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
