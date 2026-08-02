// Adaptere mot sensorleverandoerer. Hver adapter henter raa data fra leverandoeren
// og returnerer payload som sendes videre til ik-mat-sensor-webhook for normalisering.

export interface ProviderDefinition {
  id: string;
  label: string;
  mode: 'webhook' | 'api';
  /** Felt som kunden maa fylle ut (lagres kryptert i credentials) */
  credentialFields: { key: string; label: string; secret: boolean }[];
  docs?: string;
  defaultBaseUrl?: string;
}

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'generic_webhook',
    label: 'Generisk webhook (leverandoer pusher data)',
    mode: 'webhook',
    credentialFields: [],
  },
  {
    id: 'generic_api',
    label: 'Generisk REST API (vi henter data)',
    mode: 'api',
    defaultBaseUrl: 'https://api.leverandor.no/v1/readings',
    credentialFields: [
      { key: 'api_key', label: 'API-noekkel', secret: true },
      { key: 'auth_header', label: 'Header-navn (standard: Authorization)', secret: false },
      { key: 'auth_prefix', label: 'Prefiks (standard: Bearer)', secret: false },
    ],
  },
  {
    id: 'sensorpush',
    label: 'SensorPush (Gateway Cloud API)',
    mode: 'api',
    defaultBaseUrl: 'https://api.sensorpush.com/api/v1',
    credentialFields: [
      { key: 'email', label: 'E-post', secret: false },
      { key: 'password', label: 'Passord', secret: true },
    ],
    docs: 'https://www.sensorpush.com/gateway-cloud-api',
  },
  {
    id: 'disruptive',
    label: 'Disruptive Technologies',
    mode: 'api',
    defaultBaseUrl: 'https://api.disruptive-technologies.com/v2',
    credentialFields: [
      { key: 'key_id', label: 'Key ID', secret: false },
      { key: 'secret', label: 'Secret', secret: true },
      { key: 'email', label: 'Service account e-post', secret: false },
      { key: 'project_id', label: 'Prosjekt-ID', secret: false },
    ],
    docs: 'https://developer.disruptive-technologies.com',
  },
  {
    id: 'tempstick',
    label: 'Temp Stick / Ideal Sciences',
    mode: 'api',
    defaultBaseUrl: 'https://tempstickapi.com/api/v1',
    credentialFields: [{ key: 'api_key', label: 'API-noekkel', secret: true }],
  },
];

export function getProvider(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

async function asJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export interface FetchResult {
  ok: boolean;
  status: number;
  payload: unknown;
  error?: string;
}

/** Henter maalinger fra leverandoeren. Returnerer raa payload (normaliseres av webhooken). */
export async function fetchProviderReadings(
  provider: string,
  baseUrl: string | null,
  credentials: Record<string, string>,
  config: Record<string, unknown>,
): Promise<FetchResult> {
  try {
    switch (provider) {
      case 'sensorpush':
        return await fetchSensorPush(baseUrl || 'https://api.sensorpush.com/api/v1', credentials);
      case 'disruptive':
        return await fetchDisruptive(baseUrl || 'https://api.disruptive-technologies.com/v2', credentials);
      case 'tempstick':
        return await fetchTempStick(baseUrl || 'https://tempstickapi.com/api/v1', credentials);
      default:
        return await fetchGeneric(baseUrl, credentials, config);
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: null,
      error: error instanceof Error ? error.message : 'Ukjent feil mot leverandoer',
    };
  }
}

async function fetchGeneric(
  baseUrl: string | null,
  credentials: Record<string, string>,
  config: Record<string, unknown>,
): Promise<FetchResult> {
  if (!baseUrl) return { ok: false, status: 0, payload: null, error: 'Mangler API-URL' };
  const headerName = credentials.auth_header || 'Authorization';
  const prefix = credentials.auth_prefix ?? 'Bearer';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (credentials.api_key) {
    headers[headerName] = prefix ? `${prefix} ${credentials.api_key}` : credentials.api_key;
  }
  const extra = (config?.headers ?? {}) as Record<string, string>;
  for (const [k, v] of Object.entries(extra)) headers[k] = String(v);

  const res = await fetch(baseUrl, { method: 'GET', headers });
  const payload = await asJson(res);
  return { ok: res.ok, status: res.status, payload, error: res.ok ? undefined : JSON.stringify(payload).slice(0, 500) };
}

async function fetchSensorPush(baseUrl: string, credentials: Record<string, string>): Promise<FetchResult> {
  const authRes = await fetch(`${baseUrl}/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  const authBody: any = await asJson(authRes);
  if (!authRes.ok || !authBody?.authorization) {
    return { ok: false, status: authRes.status, payload: authBody, error: 'Innlogging mot SensorPush feilet' };
  }

  const tokenRes = await fetch(`${baseUrl}/oauth/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ authorization: authBody.authorization }),
  });
  const tokenBody: any = await asJson(tokenRes);
  if (!tokenRes.ok || !tokenBody?.accesstoken) {
    return { ok: false, status: tokenRes.status, payload: tokenBody, error: 'Kunne ikke hente access token' };
  }

  const [sensorsRes, samplesRes] = await Promise.all([
    fetch(`${baseUrl}/devices/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: tokenBody.accesstoken },
      body: JSON.stringify({}),
    }),
    fetch(`${baseUrl}/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: tokenBody.accesstoken },
      body: JSON.stringify({ limit: 1 }),
    }),
  ]);

  const sensors: any = await asJson(sensorsRes);
  const samples: any = await asJson(samplesRes);
  if (!samplesRes.ok) {
    return { ok: false, status: samplesRes.status, payload: samples, error: 'Kunne ikke hente maalinger' };
  }

  const readings: unknown[] = [];
  const bySensor = samples?.sensors ?? {};
  for (const [sensorId, list] of Object.entries<any>(bySensor)) {
    const latest = Array.isArray(list) ? list[0] : null;
    if (!latest) continue;
    // SensorPush rapporterer Fahrenheit som standard
    const f = Number(latest.temperature);
    const celsius = Number.isFinite(f) ? Math.round(((f - 32) * 5) / 9 * 10) / 10 : null;
    readings.push({
      sensor_id: sensorId,
      name: sensors?.[sensorId]?.name ?? null,
      temperature: celsius,
      humidity: latest.humidity ?? null,
      battery: sensors?.[sensorId]?.battery_voltage
        ? Math.min(100, Math.round((Number(sensors[sensorId].battery_voltage) / 3.0) * 100))
        : null,
      measured_at: latest.observed ?? null,
    });
  }
  return { ok: true, status: 200, payload: { readings } };
}

async function fetchDisruptive(baseUrl: string, credentials: Record<string, string>): Promise<FetchResult> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', kid: credentials.key_id };
  const claims = {
    iat: now,
    exp: now + 3600,
    aud: 'https://identity.disruptive-technologies.com/oauth2/token',
    iss: credentials.email,
  };
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = `${enc(header)}.${enc(claims)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(credentials.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch('https://identity.disruptive-technologies.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    }),
  });
  const tokenBody: any = await asJson(tokenRes);
  if (!tokenRes.ok || !tokenBody?.access_token) {
    return { ok: false, status: tokenRes.status, payload: tokenBody, error: 'Kunne ikke hente token' };
  }

  const res = await fetch(`${baseUrl}/projects/${credentials.project_id}/devices`, {
    headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/json' },
  });
  const body: any = await asJson(res);
  if (!res.ok) return { ok: false, status: res.status, payload: body, error: 'Kunne ikke hente enheter' };

  const readings = (body?.devices ?? []).map((d: any) => ({
    sensor_id: String(d.name || '').split('/').pop(),
    name: d.labels?.name ?? null,
    temperature: d.reported?.temperature?.value ?? null,
    measured_at: d.reported?.temperature?.updateTime ?? null,
    battery: d.reported?.batteryStatus?.percentage ?? null,
  }));
  return { ok: true, status: 200, payload: { readings } };
}

async function fetchTempStick(baseUrl: string, credentials: Record<string, string>): Promise<FetchResult> {
  const res = await fetch(`${baseUrl}/sensors/all`, {
    headers: { 'X-API-KEY': credentials.api_key, Accept: 'application/json' },
  });
  const body: any = await asJson(res);
  if (!res.ok) return { ok: false, status: res.status, payload: body, error: 'Kunne ikke hente sensorer' };

  const list = body?.data?.items ?? body?.data ?? [];
  const readings = (Array.isArray(list) ? list : []).map((s: any) => ({
    sensor_id: s.sensor_id ?? s.id,
    name: s.sensor_name ?? s.name ?? null,
    temperature: s.last_temp ?? s.temperature ?? null,
    battery: s.battery_pct ?? s.battery ?? null,
    measured_at: s.last_checkin ?? s.last_messaged ?? null,
  }));
  return { ok: true, status: 200, payload: { readings } };
}
