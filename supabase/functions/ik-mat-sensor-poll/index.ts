import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { fetchProviderReadings } from '../_shared/sensorProviders.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Henter maalinger fra sensorleverandoerer som ikke pusher data selv (API-modus).
 * Kjores av pg_cron, eller manuelt av en administrator for egen bedrift.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const cronSecret = req.headers.get('x-cron-secret');
  const isCron = !!cronSecret && cronSecret === Deno.env.get('CRON_SECRET');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  let scopedCompanyId: string | null = null;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

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

    const { data: isAdmin } = await supabase.rpc('is_company_admin', { _user_id: userData.user.id });
    const { data: isSysAdmin } = await supabase.rpc('is_system_admin', { _user_id: userData.user.id });
    if (!isAdmin && !isSysAdmin) return json({ error: 'Krever administratortilgang' }, 403);

    scopedCompanyId = profile.company_id;
  }

  try {
    let query = supabase
      .from('ik_mat_sensor_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('mode', 'api');
    if (scopedCompanyId) query = query.eq('company_id', scopedCompanyId);
    if (body?.integration_id) query = query.eq('id', body.integration_id);

    const { data: integrations, error } = await query;
    if (error) throw error;

    const results: any[] = [];
    const force = !isCron || body?.force === true;

    for (const integration of integrations ?? []) {
      // Respekter intervall naar det kjores av cron
      if (!force && integration.last_sync_at) {
        const minutes = (Date.now() - new Date(integration.last_sync_at).getTime()) / 60000;
        if (minutes < (integration.poll_interval_minutes ?? 15)) {
          results.push({ integration: integration.id, status: 'skipped_interval' });
          continue;
        }
      }

      const credentials = (integration.credentials ?? {}) as Record<string, string>;
      const fetched = await fetchProviderReadings(
        integration.provider,
        integration.base_url,
        credentials,
        (integration.config ?? {}) as Record<string, unknown>,
      );

      let status = fetched.ok ? 'ok' : 'error';
      let errorText = fetched.error ?? null;
      let readingCount = 0;

      if (fetched.ok) {
        // Send videre til webhooken slik at all normalisering, logging og varsling
        // haandteres av eksisterende logikk.
        const { data: endpoint } = await supabase
          .from('ik_mat_sensor_endpoints')
          .select('id, token')
          .eq('company_id', integration.company_id)
          .eq(integration.endpoint_id ? 'id' : 'company_id', integration.endpoint_id ?? integration.company_id)
          .maybeSingle();

        if (!endpoint?.token) {
          status = 'error';
          errorText = 'Fant ingen aktiv sensor-endepunktnoekkel for bedriften';
        } else {
          const hookRes = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/ik-mat-sensor-webhook/${endpoint.token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-internal-source': integration.provider },
              body: JSON.stringify(fetched.payload),
            },
          );
          const hookBody: any = await hookRes.json().catch(() => ({}));
          readingCount = hookBody?.received ?? 0;
          if (!hookRes.ok) {
            status = 'error';
            errorText = hookBody?.error || `Webhook svarte ${hookRes.status}`;
          }
        }
      }

      await supabase.from('ik_mat_sensor_payload_log').insert({
        company_id: integration.company_id,
        integration_id: integration.id,
        endpoint_id: integration.endpoint_id,
        direction: 'outbound',
        source: integration.provider,
        http_status: fetched.status,
        status,
        reading_count: readingCount,
        error: errorText,
        payload: fetched.payload ?? null,
      });

      await supabase
        .from('ik_mat_sensor_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: status,
          last_error: errorText,
        })
        .eq('id', integration.id);

      results.push({ integration: integration.id, provider: integration.provider, status, readings: readingCount, error: errorText });
    }

    return json({ ok: true, polled: results.length, results });
  } catch (error) {
    console.error('ik-mat-sensor-poll error:', error);
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
