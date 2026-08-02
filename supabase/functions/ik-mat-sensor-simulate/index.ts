import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SCENARIOS = ['normal', 'door_open', 'low_battery', 'offline'] as const;
type Scenario = (typeof SCENARIOS)[number];

function isScenario(v: unknown): v is Scenario {
  return typeof v === 'string' && SCENARIOS.includes(v as Scenario);
}

/**
 * Genererer en HMAC-SHA256 signatur for webhook-kallet, slik at simulering
 * tester den samme verifiseringskoden som ekte leverandører.
 */
async function signBody(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const bytes = new Uint8Array(mac);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!profile?.company_id) return json({ error: 'Ingen bedrift funnet' }, 403);

    const body = await req.json();
    const sensorId = typeof body.sensor_id === 'string' ? body.sensor_id : null;
    const scenario = isScenario(body.scenario) ? body.scenario : 'normal';
    if (!sensorId) return json({ error: 'Mangler sensor_id' }, 400);

    const { data: sensor, error: sensorError } = await supabase
      .from('ik_mat_sensors')
      .select('*')
      .eq('id', sensorId)
      .eq('company_id', profile.company_id)
      .maybeSingle();

    if (sensorError || !sensor) return json({ error: 'Sensor ikke funnet' }, 404);

    // Sjekk at bruker er admin i bedriften
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.user_id)
      .eq('role', 'company_admin');
    if (!roles || roles.length === 0) return json({ error: 'Kun bedriftsadministratorer kan simulere' }, 403);

    const { data: endpoint } = await supabase
      .from('ik_mat_sensor_endpoints')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('id', sensor.endpoint_id)
      .maybeSingle();

    if (!endpoint) return json({ error: 'Sensor-endepunkt ikke funnet' }, 404);

    const baseTemp = sensor.last_temperature ?? 4.0;
    let temperature = baseTemp;
    let battery = sensor.last_battery ?? 85;

    switch (scenario) {
      case 'normal':
        temperature = baseTemp + (Math.random() - 0.5) * 0.5;
        break;
      case 'door_open':
        temperature = baseTemp + 3 + Math.random() * 2;
        break;
      case 'low_battery':
        battery = 12;
        break;
      case 'offline':
        // Simuler offline ved å ikke sende data; oppdateres av vakthunden.
        break;
    }

    const measuredAt = new Date().toISOString();
    const payload = {
      sensor_id: sensor.external_id,
      temperature: Math.round(temperature * 10) / 10,
      battery,
      timestamp: measuredAt,
    };

    if (scenario === 'offline') {
      // For offline simulering: sett last_reading_at tilbake i tid slik at vakthunden reagerer.
      const stale = new Date(Date.now() - (sensor.offline_after_minutes + 5) * 60 * 1000).toISOString();
      await supabase.from('ik_mat_sensors').update({ last_reading_at: stale, last_temperature: temperature }).eq('id', sensor.id);
      await supabase.from('ik_mat_sensor_payload_log').insert({
        company_id: profile.company_id,
        endpoint_id: endpoint.id,
        direction: 'inbound',
        source: 'simulation',
        http_status: 200,
        status: 'simulated_offline',
        reading_count: 0,
        payload: { scenario, sensor_id: sensor.external_id },
      });
      return json({ ok: true, scenario, sensor_id: sensor.external_id, status: 'simulated_offline' });
    }

    const payloadJson = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Source': 'simulation',
    };
    if (endpoint.signature_secret) {
      const headerName = (endpoint.signature_header || 'x-signature').toLowerCase();
      headers[headerName] = await signBody(endpoint.signature_secret, payloadJson);
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ik-mat-sensor-webhook/${endpoint.token}`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadJson,
    });
    const responseBody = await response.text();
    let parsed: unknown;
    try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

    await supabase.from('ik_mat_sensors').update({
      simulated_payload: payload,
      simulation_mode: true,
    }).eq('id', sensor.id);

    return json({
      ok: response.ok,
      scenario,
      sensor_id: sensor.external_id,
      webhook_status: response.status,
      webhook_response: parsed,
    }, response.ok ? 200 : 502);
  } catch (error) {
    console.error('ik-mat-sensor-simulate error:', error);
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
