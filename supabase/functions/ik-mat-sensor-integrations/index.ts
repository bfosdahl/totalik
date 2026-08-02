import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { fetchProviderReadings, PROVIDERS } from '../_shared/sensorProviders.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Administrasjon av leverandoerintegrasjoner for IK-Mat sensorer.
 * Actions: providers | save_credentials | test | clear_credentials
 * API-noekler lagres kun via denne funksjonen (service role) og kan aldri leses av klienten.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? '';

    if (action === 'providers') {
      return json({ providers: PROVIDERS });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();
    const { data: isAdmin } = await supabase.rpc('is_company_admin', { _user_id: userId });
    const { data: isSysAdmin } = await supabase.rpc('is_system_admin', { _user_id: userId });
    if (!profile?.company_id || (!isAdmin && !isSysAdmin)) {
      return json({ error: 'Krever administratortilgang' }, 403);
    }

    const integrationId: string | undefined = body?.integration_id;
    if (!integrationId) return json({ error: 'Mangler integration_id' }, 400);

    const { data: integration } = await supabase
      .from('ik_mat_sensor_integrations')
      .select('*')
      .eq('id', integrationId)
      .maybeSingle();
    if (!integration) return json({ error: 'Fant ikke integrasjonen' }, 404);
    if (!isSysAdmin && integration.company_id !== profile.company_id) {
      return json({ error: 'Ingen tilgang til denne integrasjonen' }, 403);
    }

    if (action === 'save_credentials') {
      const credentials = body?.credentials;
      if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
        return json({ error: 'Ugyldige innloggingsdetaljer' }, 400);
      }
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(credentials as Record<string, unknown>)) {
        if (typeof k !== 'string' || k.length > 64) continue;
        if (v === null || v === undefined || v === '') continue;
        clean[k] = String(v).slice(0, 2000);
      }
      const merged = { ...(integration.credentials ?? {}), ...clean };
      const { error } = await supabase
        .from('ik_mat_sensor_integrations')
        .update({ credentials: merged })
        .eq('id', integrationId);
      if (error) throw error;
      return json({ ok: true, fields: Object.keys(merged) });
    }

    if (action === 'clear_credentials') {
      const { error } = await supabase
        .from('ik_mat_sensor_integrations')
        .update({ credentials: {} })
        .eq('id', integrationId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'test') {
      const result = await fetchProviderReadings(
        integration.provider,
        integration.base_url,
        (integration.credentials ?? {}) as Record<string, string>,
        (integration.config ?? {}) as Record<string, unknown>,
      );

      await supabase.from('ik_mat_sensor_payload_log').insert({
        company_id: integration.company_id,
        integration_id: integration.id,
        endpoint_id: integration.endpoint_id,
        direction: 'outbound',
        source: `${integration.provider} (test)`,
        http_status: result.status,
        status: result.ok ? 'ok' : 'error',
        error: result.error ?? null,
        payload: result.payload ?? null,
      });

      await supabase
        .from('ik_mat_sensor_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: result.ok ? 'test_ok' : 'test_error',
          last_error: result.error ?? null,
        })
        .eq('id', integrationId);

      const preview = JSON.stringify(result.payload ?? {}).slice(0, 1500);
      return json({ ok: result.ok, status: result.status, error: result.error ?? null, preview });
    }

    return json({ error: 'Ukjent handling' }, 400);
  } catch (error) {
    console.error('ik-mat-sensor-integrations error:', error);
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
