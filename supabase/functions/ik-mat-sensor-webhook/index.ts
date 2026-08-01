import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import {
  sendSensorAlert,
  resolveRecipients,
  nextDeviationNumber as sharedNextDeviationNumber,
} from '../_shared/sensorAlerts.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

interface Reading {
  externalId: string;
  temperature: number;
  measuredAt: string;
  battery: number | null;
  name: string | null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

/** Normalises payloads from common sensor providers into a flat list of readings. */
function parseReadings(payload: any): Reading[] {
  let items: any[] = [];
  if (Array.isArray(payload)) items = payload;
  else if (Array.isArray(payload?.readings)) items = payload.readings;
  else if (Array.isArray(payload?.measurements)) items = payload.measurements;
  else if (Array.isArray(payload?.data)) items = payload.data;
  else if (Array.isArray(payload?.events)) items = payload.events;
  else if (payload && typeof payload === 'object') items = [payload];

  const readings: Reading[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item: any = raw;
    const nested = item.data ?? item.temperature_event ?? item.event ?? {};

    const externalId = pickString(
      item.sensor_id, item.sensorId, item.external_id, item.externalId,
      item.device_id, item.deviceId, item.device, item.serial, item.serial_number,
      item.id, item.name, nested.sensor_id, nested.device_id,
    );

    const temperature = pickNumber(
      item.temperature, item.temp, item.value, item.celsius, item.temperature_c,
      nested.temperature, nested.value, item.temperature?.value,
    );

    if (!externalId || temperature === null) continue;

    const measuredAtRaw = pickString(
      item.measured_at, item.measuredAt, item.timestamp, item.time, item.recorded_at,
      item.datetime, nested.timestamp, nested.updateTime,
    );
    let measuredAt = new Date().toISOString();
    if (measuredAtRaw) {
      const numeric = Number(measuredAtRaw);
      const d = Number.isFinite(numeric) && measuredAtRaw.length >= 10
        ? new Date(numeric > 1e11 ? numeric : numeric * 1000)
        : new Date(measuredAtRaw);
      if (!Number.isNaN(d.getTime())) measuredAt = d.toISOString();
    }

    readings.push({
      externalId,
      temperature,
      measuredAt,
      battery: pickNumber(item.battery, item.battery_level, item.batteryLevel, nested.battery),
      name: pickString(item.name, item.sensor_name, item.label, item.display_name),
    });
  }
  return readings;
}

async function nextDeviationNumber(supabase: any, companyId: string): Promise<string> {
  const { data } = await supabase
    .from('deviations')
    .select('deviation_number')
    .eq('company_id', companyId)
    .like('deviation_number', 'IKM-%');
  let max = 0;
  for (const row of data ?? []) {
    const m = String(row.deviation_number).match(/IKM-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `IKM-${String(max + 1).padStart(3, '0')}`;
}

function localDateString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Token may come from the path (/.../ik-mat-sensor-webhook/<token>),
    // a query param, or an Authorization/X-Sensor-Token header.
    const pathToken = url.pathname.split('/').filter(Boolean).pop();
    const token =
      (pathToken && pathToken !== 'ik-mat-sensor-webhook' ? pathToken : null) ||
      url.searchParams.get('token') ||
      req.headers.get('x-sensor-token') ||
      (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
      null;

    if (!token) return json({ error: 'Mangler token' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data: endpoint } = await supabase
      .from('ik_mat_sensor_endpoints')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (!endpoint) return json({ error: 'Ugyldig token' }, 401);
    if (!endpoint.is_active) return json({ error: 'Endepunkt er deaktivert' }, 403);

    let payload: any = null;
    if (req.method === 'GET') {
      payload = Object.fromEntries(url.searchParams.entries());
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = Object.fromEntries(new URLSearchParams(text).entries());
      }
    }

    const readings = parseReadings(payload);
    if (readings.length === 0) {
      await supabase
        .from('ik_mat_sensor_endpoints')
        .update({ last_error: 'Kunne ikke lese målinger fra mottatt data', last_received_at: new Date().toISOString() })
        .eq('id', endpoint.id);
      return json({ error: 'Fant ingen gyldige målinger i forespørselen' }, 400);
    }

    const companyId = endpoint.company_id as string;
    const results: any[] = [];

    for (const reading of readings) {
      // Find or register the sensor
      let { data: sensor } = await supabase
        .from('ik_mat_sensors')
        .select('*')
        .eq('company_id', companyId)
        .eq('external_id', reading.externalId)
        .maybeSingle();

      if (!sensor) {
        const { data: created } = await supabase
          .from('ik_mat_sensors')
          .insert({
            company_id: companyId,
            department_id: endpoint.department_id,
            endpoint_id: endpoint.id,
            external_id: reading.externalId,
            name: reading.name || `Sensor ${reading.externalId}`,
          })
          .select()
          .single();
        sensor = created;
        results.push({ sensor: reading.externalId, status: 'registered_unmapped' });
      }

      await supabase
        .from('ik_mat_sensors')
        .update({
          last_reading_at: reading.measuredAt,
          last_temperature: reading.temperature,
          last_battery: reading.battery,
        })
        .eq('id', sensor.id);

      if (!sensor.is_active) {
        results.push({ sensor: reading.externalId, status: 'inactive_skipped' });
        continue;
      }
      if (!sensor.equipment_id) {
        results.push({ sensor: reading.externalId, status: 'unmapped' });
        continue;
      }

      const { data: equipment } = await supabase
        .from('ik_mat_temperature_equipment')
        .select('*')
        .eq('id', sensor.equipment_id)
        .maybeSingle();

      if (!equipment) {
        results.push({ sensor: reading.externalId, status: 'equipment_missing' });
        continue;
      }

      let isAcceptable = true;
      if (equipment.min_temp !== null && reading.temperature < equipment.min_temp) isAcceptable = false;
      if (equipment.max_temp !== null && reading.temperature > equipment.max_temp) isAcceptable = false;

      await supabase.from('ik_mat_temperature_logs').insert({
        company_id: companyId,
        department_id: sensor.department_id ?? equipment.department_id ?? null,
        equipment_id: equipment.id,
        temperature: reading.temperature,
        is_acceptable: isAcceptable,
        measured_by_id: null,
        measured_by_name: `Sensor: ${sensor.name || reading.externalId}`,
        measured_at: reading.measuredAt,
        notes: 'Automatisk måling fra sensor',
      });

      let deviationNumber: string | null = null;
      if (!isAcceptable) {
        // Avoid spamming: only one open sensor deviation per equipment per 6 hours.
        const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabase
          .from('deviations')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'ik_mat')
          .eq('category', 'temperature')
          .eq('status', 'open')
          .gte('created_at', since)
          .ilike('title', `%${equipment.name}%`)
          .limit(1);

        if (!recent || recent.length === 0) {
          deviationNumber = await nextDeviationNumber(supabase, companyId);
          const due = new Date();
          due.setDate(due.getDate() + 1);
          let description = 'Automatisk registrert temperaturavvik fra sensor.\n\n';
          description += `Utstyr: ${equipment.name}\n`;
          description += `Sensor: ${sensor.name || reading.externalId}\n`;
          description += `Målt temperatur: ${reading.temperature} °C\n`;
          if (equipment.min_temp !== null) description += `Min. tillatt: ${equipment.min_temp} °C\n`;
          if (equipment.max_temp !== null) description += `Maks. tillatt: ${equipment.max_temp} °C\n`;
          description += `Måletidspunkt: ${new Date(reading.measuredAt).toLocaleString('nb-NO')}\n`;

          await supabase.from('deviations').insert({
            company_id: companyId,
            deviation_number: deviationNumber,
            title: `Temperaturavvik (sensor): ${equipment.name} (${reading.temperature} °C)`,
            description,
            category: 'temperature',
            type: 'ik_mat',
            priority: 'high',
            status: 'open',
            reporter_name: `Sensor: ${sensor.name || reading.externalId}`,
            due_date: localDateString(due),
            incident_location: equipment.location || null,
            department_id: sensor.department_id ?? null,
          });
        }
      }

      results.push({
        sensor: reading.externalId,
        status: 'logged',
        temperature: reading.temperature,
        acceptable: isAcceptable,
        deviation: deviationNumber,
      });
    }

    await supabase
      .from('ik_mat_sensor_endpoints')
      .update({ last_received_at: new Date().toISOString(), last_error: null })
      .eq('id', endpoint.id);

    return json({ ok: true, received: readings.length, results });
  } catch (error) {
    console.error('ik-mat-sensor-webhook error:', error);
    return json({ error: error instanceof Error ? error.message : 'Ukjent feil' }, 500);
  }
});
