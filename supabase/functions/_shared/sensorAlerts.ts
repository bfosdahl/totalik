// Delt varslingslogikk for IK-Mat sensorer (webhook + vakthund).

export interface AlertInput {
  companyId: string;
  companyName?: string | null;
  sensorId: string | null;
  sensorName: string;
  equipmentId?: string | null;
  equipmentName?: string | null;
  location?: string | null;
  alertType: 'temp_high' | 'temp_low' | 'offline' | 'low_battery';
  severity?: 'high' | 'medium';
  subject: string;
  lines: string[];
  temperature?: number | null;
  deviationNumber?: string | null;
  recipients: string[];
}

export function normalizeEmails(...lists: (string[] | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const list of lists) {
    for (const raw of list ?? []) {
      const email = String(raw || '').trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) out.add(email);
    }
  }
  return [...out];
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/å/g, '&#229;').replace(/Å/g, '&#197;')
    .replace(/ø/g, '&#248;').replace(/Ø/g, '&#216;')
    .replace(/æ/g, '&#230;').replace(/Æ/g, '&#198;');
}

function buildHtml(input: AlertInput): string {
  const color = input.severity === 'medium' ? '#b45309' : '#b91c1c';
  const rows = input.lines.map((l) => `<tr><td style="padding:4px 0;">${esc(l)}</td></tr>`).join('');
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:${color};color:#ffffff;padding:16px 20px;font-size:18px;font-weight:bold;">${esc(input.subject)}</div>
    <div style="padding:20px;color:#111827;font-size:14px;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:20px;font-size:13px;color:#4b5563;">Dette varselet er sendt automatisk fra Total-IK (IK-Mat sensorovervaking).</p>
    </div>
  </div></body></html>`;
}

/** Logger varselet i databasen og sender e-post via Resend. */
export async function sendSensorAlert(supabase: any, input: AlertInput): Promise<void> {
  const recipients = normalizeEmails(input.recipients);
  let emailStatus: string | null = recipients.length ? 'pending' : 'no_recipients';

  if (recipients.length) {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      emailStatus = 'missing_api_key';
    } else {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${input.companyName || 'Total-IK'} <noreply@totalik.no>`,
            to: recipients,
            subject: input.subject,
            html: buildHtml(input),
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`Resend feilet [${res.status}]: ${body}`);
          emailStatus = `error_${res.status}`;
        } else {
          emailStatus = 'sent';
        }
      } catch (e) {
        console.error('Resend exception:', e);
        emailStatus = 'error';
      }
    }
  }

  await supabase.from('ik_mat_sensor_alerts').insert({
    company_id: input.companyId,
    sensor_id: input.sensorId,
    equipment_id: input.equipmentId ?? null,
    alert_type: input.alertType,
    severity: input.severity ?? 'high',
    message: `${input.subject}\n${input.lines.join('\n')}`,
    temperature: input.temperature ?? null,
    deviation_number: input.deviationNumber ?? null,
    recipients,
    email_status: emailStatus,
  });
}

export async function nextDeviationNumber(supabase: any, companyId: string): Promise<string> {
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

export function localDateString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Henter varslingsmottakere: sensor -> endepunkt -> bedriftsinnstillinger -> administratorer. */
export async function resolveRecipients(
  supabase: any,
  companyId: string,
  sensorEmails: string[] | null,
  endpointEmails: string[] | null,
): Promise<string[]> {
  const direct = normalizeEmails(sensorEmails, endpointEmails);
  if (direct.length) return direct;

  const { data: settings } = await supabase
    .from('company_notification_settings')
    .select('sensor_alarm_email, sensor_alarm_email_recipients')
    .eq('company_id', companyId)
    .maybeSingle();

  if (settings?.sensor_alarm_email) {
    const configured = normalizeEmails(settings.sensor_alarm_email_recipients);
    if (configured.length) return configured;
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, user_id')
    .eq('company_id', companyId);
  if (!profiles?.length) return [];

  const userIds = profiles.map((p: any) => p.user_id).filter(Boolean);
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds)
    .eq('role', 'company_admin');
  const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
  return normalizeEmails(profiles.filter((p: any) => adminIds.has(p.user_id)).map((p: any) => p.email));
}
