import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface LoraWanSetupGuideProps {
  webhookUrl: string;
}

interface Field {
  label: string;
  value: string;
  hint?: string;
}

export function LoraWanSetupGuide({ webhookUrl }: LoraWanSetupGuideProps) {
  const url = webhookUrl || 'https://<aktiver sensormottak for å se URL>';

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} kopiert`);
  };

  const steps: { title: string; body: string; fields?: Field[] }[] = [
    {
      title: '1. Koble til gateway',
      body: 'Sett opp LoRaWAN-gatewayen (f.eks. Milesight UG65) med strøm og internett. I gateway-web-UI: velg Packet Forwarder / Semtech UDP eller "The Things Stack" og pek den mot riktig region-server.',
      fields: [
        { label: 'Frequency plan', value: 'Europe 863-870 MHz (SF9 for RX2 - recommended)' },
        { label: 'Server address', value: 'eu1.cloud.thethings.network' },
        { label: 'Port (up/down)', value: '1700' },
      ],
    },
    {
      title: '2. Registrer gatewayen i TTN',
      body: 'The Things Stack > Gateways > Register gateway. Gateway EUI finner du på klistremerket under gatewayen.',
      fields: [
        { label: 'Gateway EUI', value: '<16 hex-tegn fra etiketten>' },
        { label: 'Gateway ID', value: 'f.eks. kjokken-gateway-01' },
        { label: 'Frequency plan', value: 'Europe 863-870 MHz (SF9 for RX2)' },
        { label: 'Require authenticated connection', value: 'Av (for Semtech UDP)' },
      ],
    },
    {
      title: '3. Opprett en application',
      body: 'The Things Stack > Applications > Create application. Alle sensorene i bedriften kan ligge i samme application.',
      fields: [
        { label: 'Application ID', value: 'f.eks. totalik-ikmat-<bedriftsnavn>' },
        { label: 'Application name', value: 'IK MAT temperatursensorer' },
      ],
    },
    {
      title: '4. Legg til hver sensor (end device)',
      body: 'Applications > End devices > Register end device. Bruk "Select the end device in the LoRaWAN Device Repository" og velg Milesight > EM300-TH / EM500-PT100 hvis den finnes, ellers manuelt. DevEUI, AppEUI/JoinEUI og AppKey står på etiketten eller i QR-koden på sensoren.',
      fields: [
        { label: 'Frequency plan', value: 'Europe 863-870 MHz (SF9 for RX2)' },
        { label: 'LoRaWAN version', value: 'LoRaWAN Specification 1.0.3' },
        { label: 'Regional Parameters', value: 'RP001 Regional Parameters 1.0.3 revision A' },
        { label: 'Activation mode', value: 'Over the air activation (OTAA)' },
        { label: 'DevEUI', value: '<fra sensoretiketten>' },
        { label: 'AppEUI / JoinEUI', value: '<fra sensoretiketten, ofte 0000000000000000>' },
        { label: 'AppKey', value: '<fra sensoretiketten / QR>' },
        { label: 'End device ID', value: 'f.eks. kjolerom-1 (brukes som sensor_id hos oss)' },
      ],
    },
    {
      title: '5. Sett opp payload formatter',
      body: 'Velger du sensoren fra Device Repository er dekoderen ferdig utfylt. Ellers: End device > Payload formatters > Uplink > Custom Javascript formatter, og lim inn dekoderen fra leverandøren. Resultatet må inneholde temperatur (og gjerne humidity/battery).',
      fields: [
        { label: 'Formatter type', value: 'Javascript / Device Repository' },
        { label: 'Forventede felter ut', value: 'temperature, humidity, battery' },
      ],
    },
    {
      title: '6. Koble TTN til Total-IK (webhook)',
      body: 'Applications > Integrations > Webhooks > Add webhook > Custom webhook. Aktiver kun "Uplink message" – da slipper vi støy fra join/status-meldinger.',
      fields: [
        { label: 'Webhook ID', value: 'totalik-ikmat' },
        { label: 'Webhook format', value: 'JSON' },
        { label: 'Base URL', value: url },
        { label: 'Enabled event types', value: 'Uplink message (kun denne)' },
        {
          label: 'Additional headers (valgfritt)',
          value: 'X-Signature: <HMAC hvis du har aktivert signering>',
        },
      ],
    },
    {
      title: '7. Koble sensoren i Total-IK',
      body: 'Gå til fanen Sensorer over: legg inn sensoren med samme ID som "End device ID" i TTN, velg hvilket kjøl/frys den tilhører og sett temperaturgrenser. Første uplink dukker opp i loggen innen noen minutter (EM300 sender som standard hvert 10. minutt).',
      fields: [
        { label: 'Sensor-ID i Total-IK', value: 'Må matche end device ID / DevEUI i TTN' },
        { label: 'Temperaturgrense kjøl', value: '0 til 4 °C' },
        { label: 'Temperaturgrense frys', value: '-25 til -18 °C' },
      ],
    },
  ];

  const fullGuide = steps
    .map(
      (s) =>
        `${s.title}\n${s.body}\n` +
        (s.fields ?? []).map((f) => `  - ${f.label}: ${f.value}`).join('\n'),
    )
    .join('\n\n');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" /> Oppkobling av LoRaWAN-sensorer (TTN)
            </CardTitle>
            <CardDescription>
              Steg-for-steg med nøyaktig hvilke felter du fyller ut i The Things Stack.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => copy(fullGuide, 'Veiledningen')}>
            <Copy className="h-4 w-4 mr-2" /> Kopier hele guiden
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.title} className="rounded-md border p-3 space-y-2">
            <p className="font-medium">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.body}</p>
            {step.fields && (
              <div className="space-y-1">
                {step.fields.map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2 text-xs"
                  >
                    <span className="font-medium sm:w-56 shrink-0">{f.label}</span>
                    <code className="font-mono break-all text-muted-foreground">{f.value}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-md border p-3 text-sm space-y-1">
          <p className="font-medium">Feilsøking</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Ingen join: sjekk at DevEUI/AppKey er riktig og at gatewayen står "Connected" i TTN.</li>
            <li>Join OK, men ingen data hos oss: sjekk at webhooken har riktig Base URL og at kun "Uplink message" er huket av.</li>
            <li>
              Data kommer, men ingen temperatur: payload formatter mangler – uplinken må gi
              <code className="mx-1">temperature</code> i decoded payload.
            </li>
            <li>Sensor-ID må være identisk i TTN og i Total-IK, ellers havner målingen i loggen som ukjent sensor.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Gateway: Milesight UG65/UG67</Badge>
          <Badge variant="secondary">Kjøl: EM300-TH</Badge>
          <Badge variant="secondary">Frys: EM500-PT100</Badge>
          <Badge variant="secondary">Nettverksserver: TTN (gratis)</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
