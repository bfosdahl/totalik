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

/**
 * Batteri kan komme som prosent (0-100) eller som spenning (volt, typisk 2.0-4.5V
 * for LoRaWAN-sensorer). Vi konverterer volt til prosent med 3.0V = 0 % og 3.6V = 100 %.
 */
function normaliseBattery(value: number | null): number | null {
  if (value === null) return null;
  if (value > 5) return Math.max(0, Math.min(100, Math.round(value)));
  const pct = ((value - 3.0) / 0.6) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** The Things Network / TTS uplink -> flat maaling. */
function parseTtnUplink(item: any): Reading | null {
  const uplink = item?.uplink_message;
  if (!uplink) return null;
  const decoded = uplink.decoded_payload ?? {};
  const externalId = pickString(
    item.end_device_ids?.device_id,
    item.end_device_ids?.dev_eui,
    item.device_id,
  );
  const temperature = pickNumber(
    decoded.temperature, decoded.temperature_1, decoded.TempC_SHT,
    decoded.tempC, decoded.temp, decoded.temperatureC,
  );
  if (!externalId || temperature === null) return null;

  const measuredAtRaw = pickString(uplink.received_at, item.received_at);
  let measuredAt = new Date().toISOString();
  if (measuredAtRaw) {
    const d = new Date(measuredAtRaw);
    if (!Number.isNaN(d.getTime())) measuredAt = d.toISOString();
  }

  const rawBattery = pickNumber(
    decoded.battery, decoded.battery_voltage, decoded.BatV, decoded.bat,
    decoded.batteryVoltage, decoded.battery_level,
  );

  return {
    externalId,
    temperature,
    measuredAt,
    battery: normaliseBattery(rawBattery),
    name: pickString(item.end_device_ids?.device_id) ?? null,
  };
}

/** Normalises payloads from common sensor providers into a flat list of readings. */
function parseReadings(payload: any): Reading[] {
  let items: any[] = [];
  if (Array.isArray(payload)) items = payload;
  else if (Array.isArray(payload?.uplinks)) items = payload.uplinks;
  else if (Array.isArray(payload?.readings)) items = payload.readings;
  else if (Array.isArray(payload?.measurements)) items = payload.measurements;
  else if (Array.isArray(payload?.data)) items = payload.data;
  else if (Array.isArray(payload?.events)) items = payload.events;
  else if (payload && typeof payload === 'object') items = [payload];


  const readings: Reading[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item: any = raw;

    const ttn = parseTtnUplink(item);
    if (ttn) {
      readings.push(ttn);
      continue;
    }

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
      item.datetime, item.received_at, nested.timestamp, nested.updateTime,
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
      battery: normaliseBattery(
        pickNumber(item.battery, item.battery_level, item.batteryLevel, item.battery_voltage, nested.battery),
      ),
      name: pickString(item.name, item.sensor_name, item.label, item.display_name),
    });
  }

  return readings;
}

const nextDeviationNumber = sharedNextDeviationNumber;

function localDateString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Token kan komme fra stien (/.../ik-mat-sensor-webhook/<token>), query-param
    // eller en hemmelig header (TTN: "Additional headers" -> X-TotalIK-Key).
    const pathToken = url.pathname.split('/').filter(Boolean).pop();
    const token =
      (pathToken && pathToken !== 'ik-mat-sensor-webhook' ? pathToken : null) ||
      url.searchParams.get('token') ||
      req.headers.get('x-totalik-key') ||
      req.headers.get('x-sensor-token') ||
      req.headers.get('x-api-key') ||
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
    let rawBody = '';
    if (req.method === 'GET') {
      payload = Object.fromEntries(url.searchParams.entries());
    } else {
      rawBody = await req.text();
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = Object.fromEntries(new URLSearchParams(rawBody).entries());
      }
    }

    const headerSnapshot: Record<string, string> = {};
    for (const [k, v] of req.headers.entries()) {
      const lower = k.toLowerCase();
      if (['authorization', 'x-sensor-token', 'x-totalik-key', 'x-api-key', 'cookie'].includes(lower)) continue;
      headerSnapshot[lower] = v.slice(0, 300);
    }

    const logPayload = async (
      status: string,
      httpStatus: number,
      readingCount: number,
      errorText: string | null,
    ) => {
      if (endpoint.debug_logging === false) return;
      await supabase.from('ik_mat_sensor_payload_log').insert({
        company_id: endpoint.company_id,
        endpoint_id: endpoint.id,
        direction: 'inbound',
        source: headerSnapshot['x-internal-source'] || headerSnapshot['user-agent'] || 'ukjent',
        http_status: httpStatus,
        status,
        reading_count: readingCount,
        error: errorText,
        headers: headerSnapshot,
        payload,
      });
    };

    // Signaturverifisering (HMAC) naar leverandoeren stotter det
    if (endpoint.signature_secret) {
      const headerName = (endpoint.signature_header || 'x-signature').toLowerCase();
      const provided = (req.headers.get(headerName) || '').trim().replace(/^sha256=/i, '');
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(endpoint.signature_secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
      const bytes = new Uint8Array(mac);
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const b64 = btoa(String.fromCharCode(...bytes));
      if (!provided || (provided !== hex && provided !== b64)) {
        await logPayload('signature_failed', 401, 0, 'Ugyldig eller manglende signatur');
        await supabase
          .from('ik_mat_sensor_endpoints')
          .update({ last_error: 'Ugyldig signatur på innkommende data', last_received_at: new Date().toISOString() })
          .eq('id', endpoint.id);
        return json({ error: 'Ugyldig signatur' }, 401);
      }
    }

    const readings = parseReadings(payload);
    if (readings.length === 0) {
      await logPayload('parse_failed', 400, 0, 'Kunne ikke lese målinger fra mottatt data');
      await supabase
        .from('ik_mat_sensor_endpoints')
        .update({ last_error: 'Kunne ikke lese målinger fra mottatt data', last_received_at: new Date().toISOString() })
        .eq('id', endpoint.id);
      return json({ error: 'Fant ingen gyldige målinger i forespørselen' }, 400);
    }

    await logPayload('ok', 200, readings.length, null);


    const companyId = endpoint.company_id as string;
    const { data: companyRow } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle();
    const companyName: string = companyRow?.name || 'Total-IK';
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

      const sensorUpdate: Record<string, unknown> = {
        last_reading_at: reading.measuredAt,
        last_temperature: reading.temperature,
        last_battery: reading.battery,
      };
      if (sensor.is_offline) {
        sensorUpdate.is_offline = false;
        sensorUpdate.last_offline_alert_at = null;
      }

      if (!sensor.is_active) {
        await supabase.from('ik_mat_sensors').update(sensorUpdate).eq('id', sensor.id);
        results.push({ sensor: reading.externalId, status: 'inactive_skipped' });
        continue;
      }

      const sensorName = sensor.name || reading.externalId;

      // Lavt batteri -> varsel maks en gang per doegn
      const batteryThreshold = sensor.low_battery_threshold ?? 20;
      if (
        reading.battery !== null &&
        batteryThreshold > 0 &&
        reading.battery <= batteryThreshold
      ) {
        const lastBatteryAlert = sensor.last_battery_alert_at
          ? new Date(sensor.last_battery_alert_at).getTime()
          : 0;
        if (Date.now() - lastBatteryAlert > 24 * 60 * 60 * 1000) {
          await sendSensorAlert(supabase, {
            companyId,
            companyName,
            sensorId: sensor.id,
            sensorName,
            equipmentId: sensor.equipment_id,
            alertType: 'low_battery',
            severity: 'medium',
            subject: `Lavt batteri pa sensor: ${sensorName}`,
            lines: [
              `Sensor: ${sensorName}`,
              `Batterinivaa: ${reading.battery} %`,
              `Varselgrense: ${batteryThreshold} %`,
              'Bytt batteri for aa unngaa hull i temperaturloggen.',
            ],
            recipients: await resolveRecipients(supabase, companyId, sensor.alert_emails, endpoint.alert_emails),
          });
          sensorUpdate.last_battery_alert_at = new Date().toISOString();
        }
      }

      if (!sensor.equipment_id) {
        await supabase.from('ik_mat_sensors').update(sensorUpdate).eq('id', sensor.id);
        results.push({ sensor: reading.externalId, status: 'unmapped' });
        continue;
      }

      const { data: equipment } = await supabase
        .from('ik_mat_temperature_equipment')
        .select('*')
        .eq('id', sensor.equipment_id)
        .maybeSingle();

      if (!equipment) {
        await supabase.from('ik_mat_sensors').update(sensorUpdate).eq('id', sensor.id);
        results.push({ sensor: reading.externalId, status: 'equipment_missing' });
        continue;
      }

      const minTemp = sensor.min_temp_override ?? equipment.min_temp;
      const maxTemp = sensor.max_temp_override ?? equipment.max_temp;

      let isAcceptable = true;
      let breachType: 'temp_low' | 'temp_high' | null = null;
      if (minTemp !== null && minTemp !== undefined && reading.temperature < minTemp) {
        isAcceptable = false;
        breachType = 'temp_low';
      }
      if (maxTemp !== null && maxTemp !== undefined && reading.temperature > maxTemp) {
        isAcceptable = false;
        breachType = 'temp_high';
      }

      await supabase.from('ik_mat_temperature_logs').insert({
        company_id: companyId,
        department_id: sensor.department_id ?? equipment.department_id ?? null,
        equipment_id: equipment.id,
        temperature: reading.temperature,
        is_acceptable: isAcceptable,
        measured_by_id: null,
        measured_by_name: `Sensor: ${sensorName}`,
        measured_at: reading.measuredAt,
        notes: 'Automatisk måling fra sensor',
      });

      let deviationNumber: string | null = null;
      let alerted = false;

      if (!isAcceptable) {
        // Karenstid: kortvarige utslag (doeraapning, avriming) skal ikke gi alarm.
        const graceMinutes = sensor.breach_grace_minutes ?? 0;
        const breachStarted = sensor.breach_started_at
          ? new Date(sensor.breach_started_at).getTime()
          : Date.now();
        if (!sensor.breach_started_at) {
          sensorUpdate.breach_started_at = new Date().toISOString();
        }
        const breachDurationMin = (Date.now() - breachStarted) / 60000;

        if (breachDurationMin >= graceMinutes) {
          // Unngaa spam: maks ett aapent sensoravvik per utstyr per 6 timer.
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
            description += `Sensor: ${sensorName}\n`;
            description += `Målt temperatur: ${reading.temperature} °C\n`;
            if (minTemp !== null && minTemp !== undefined) description += `Min. tillatt: ${minTemp} °C\n`;
            if (maxTemp !== null && maxTemp !== undefined) description += `Maks. tillatt: ${maxTemp} °C\n`;
            description += `Varighet før varsel: ${Math.round(breachDurationMin)} min (karenstid ${graceMinutes} min)\n`;
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
              reporter_name: `Sensor: ${sensorName}`,
              due_date: localDateString(due),
              incident_location: equipment.location || null,
              department_id: sensor.department_id ?? null,
            });
          }

          // E-postvarsel maks hver 2. time per sensor
          const lastTempAlert = sensor.last_temp_alert_at
            ? new Date(sensor.last_temp_alert_at).getTime()
            : 0;
          if (Date.now() - lastTempAlert > 2 * 60 * 60 * 1000) {
            await sendSensorAlert(supabase, {
              companyId,
              companyName,
              sensorId: sensor.id,
              sensorName,
              equipmentId: equipment.id,
              equipmentName: equipment.name,
              location: equipment.location,
              alertType: breachType ?? 'temp_high',
              severity: 'high',
              subject: `Temperaturalarm: ${equipment.name} (${reading.temperature} °C)`,
              lines: [
                `Utstyr: ${equipment.name}`,
                equipment.location ? `Plassering: ${equipment.location}` : 'Plassering: ikke angitt',
                `Sensor: ${sensorName}`,
                `Malt temperatur: ${reading.temperature} °C`,
                `Tillatt omraade: ${minTemp ?? '-'} til ${maxTemp ?? '-'} °C`,
                `Varighet: ${Math.round(breachDurationMin)} minutter`,
                deviationNumber ? `Avvik opprettet: ${deviationNumber}` : 'Avvik er allerede registrert',
                'Sjekk utstyret og varene umiddelbart.',
              ],
              temperature: reading.temperature,
              deviationNumber,
              recipients: await resolveRecipients(supabase, companyId, sensor.alert_emails, endpoint.alert_emails),
            });
            sensorUpdate.last_temp_alert_at = new Date().toISOString();
            alerted = true;
          }
        }
      } else if (sensor.breach_started_at) {
        sensorUpdate.breach_started_at = null;
        sensorUpdate.last_temp_alert_at = null;
      }

      await supabase.from('ik_mat_sensors').update(sensorUpdate).eq('id', sensor.id);

      results.push({
        sensor: reading.externalId,
        status: 'logged',
        temperature: reading.temperature,
        acceptable: isAcceptable,
        deviation: deviationNumber,
        alerted,
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
