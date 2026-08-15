import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface SensorSetupInput {
  endpointExists: boolean;
  endpointActive: boolean;
  webhookUrl: string;
  signatureSecret: string;
  signatureHeader: string;
  hasReceivedData: boolean;
}

export interface ChecklistItem {
  key: string;
  label: string;
  detail: string;
  status: 'ok' | 'error' | 'warning';
  /** Blokkerer lagring når status er error */
  blocking: boolean;
}

const HEADER_PATTERN = /^[a-zA-Z0-9-]+$/;

export function validateSensorSetup(input: SensorSetupInput): ChecklistItem[] {
  const { endpointExists, endpointActive, webhookUrl, signatureSecret, signatureHeader, hasReceivedData } = input;

  const items: ChecklistItem[] = [];

  items.push({
    key: 'endpoint',
    label: 'Sensormottak er aktivert',
    detail: endpointExists
      ? endpointActive
        ? 'Endepunktet er opprettet og aktivt.'
        : 'Endepunktet er opprettet, men slått av. Skru på bryteren "Aktivt" over.'
      : 'Du må trykke "Aktiver sensormottak" før oppsettet kan lagres.',
    status: endpointExists ? (endpointActive ? 'ok' : 'error') : 'error',
    blocking: true,
  });

  let urlStatus: ChecklistItem['status'] = 'error';
  let urlDetail = 'Ingen webhook-URL generert ennå.';
  if (webhookUrl) {
    try {
      const parsed = new URL(webhookUrl);
      if (parsed.protocol !== 'https:') {
        urlDetail = 'URL-en må bruke https.';
      } else if (!parsed.pathname.includes('ik-mat-sensor-webhook')) {
        urlDetail = 'URL-en peker ikke til sensormottaket.';
      } else {
        urlStatus = 'ok';
        urlDetail = 'Gyldig https-adresse klar til å limes inn hos leverandøren/TTN.';
      }
    } catch {
      urlDetail = 'URL-en er ikke gyldig.';
    }
  }
  items.push({
    key: 'webhook_url',
    label: 'Webhook-URL er gyldig',
    detail: urlDetail,
    status: urlStatus,
    blocking: true,
  });

  const secret = signatureSecret.trim();
  if (!signatureSecret) {
    items.push({
      key: 'hmac_secret',
      label: 'HMAC-nøkkel',
      detail: 'Ingen nøkkel satt – mottaket godtar usignerte data. Anbefalt å sette nøkkel i produksjon.',
      status: 'warning',
      blocking: false,
    });
  } else if (secret !== signatureSecret) {
    items.push({
      key: 'hmac_secret',
      label: 'HMAC-nøkkel',
      detail: 'Nøkkelen har mellomrom i start/slutt. Fjern disse – de gir feil signatur.',
      status: 'error',
      blocking: true,
    });
  } else if (secret.length < 16) {
    items.push({
      key: 'hmac_secret',
      label: 'HMAC-nøkkel',
      detail: 'Nøkkelen må være minst 16 tegn (anbefalt 32+, f.eks. openssl rand -hex 32).',
      status: 'error',
      blocking: true,
    });
  } else {
    items.push({
      key: 'hmac_secret',
      label: 'HMAC-nøkkel',
      detail: `Nøkkel på ${secret.length} tegn – samme verdi må limes inn hos leverandøren/TTN.`,
      status: 'ok',
      blocking: true,
    });
  }

  const header = signatureHeader.trim();
  items.push({
    key: 'hmac_header',
    label: 'Header-navn for signatur',
    detail: !header
      ? 'Header-navn kan ikke være tomt (standard: x-signature).'
      : !HEADER_PATTERN.test(header)
        ? 'Bruk kun bokstaver, tall og bindestrek (f.eks. x-signature).'
        : `Leverandøren må sende signaturen i headeren "${header}".`,
    status: !header || !HEADER_PATTERN.test(header) ? 'error' : 'ok',
    blocking: true,
  });

  items.push({
    key: 'traffic',
    label: 'Data mottatt fra sensor',
    detail: hasReceivedData
      ? 'Vi har mottatt minst én datapakke på endepunktet.'
      : 'Ingen data mottatt ennå. Dette blokkerer ikke lagring, men test uplink etter lagring.',
    status: hasReceivedData ? 'ok' : 'warning',
    blocking: false,
  });

  return items;
}

export function isSensorSetupSavable(items: ChecklistItem[]) {
  return !items.some((i) => i.blocking && i.status === 'error');
}

export function SensorReadinessChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-sm font-medium">Sjekkliste før lagring</p>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.status === 'ok' ? CheckCircle2 : item.status === 'warning' ? AlertTriangle : XCircle;
          const color =
            item.status === 'ok'
              ? 'text-primary'
              : item.status === 'warning'
                ? 'text-muted-foreground'
                : 'text-destructive';
          return (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
