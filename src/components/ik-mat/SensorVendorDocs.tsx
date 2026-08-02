import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, AlertTriangle, Webhook, ShieldCheck, Code2 } from 'lucide-react';
import { toast } from 'sonner';

interface SensorVendorDocsProps {
  webhookUrl: string;
}

export function SensorVendorDocs({ webhookUrl }: SensorVendorDocsProps) {
  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} kopiert`);
  };

  const jsonExample = `POST ${webhookUrl || 'https://<din-endepunkt-URL>'}
Content-Type: application/json

{
  "sensor_id": "A1B2C3",
  "temperature": 4.2,
  "humidity": 65,
  "battery": 92,
  "timestamp": "2026-01-01T08:00:00Z"
}`;

  const arrayExample = `POST ${webhookUrl || 'https://<din-endepunkt-URL>'}
Content-Type: application/json

{
  "readings": [
    {
      "sensor_id": "A1B2C3",
      "temperature": 4.2,
      "humidity": 65,
      "battery": 92,
      "timestamp": "2026-01-01T08:00:00Z"
    },
    {
      "sensor_id": "D4E5F6",
      "temperature": -18.5,
      "battery": 88,
      "timestamp": "2026-01-01T08:00:00Z"
    }
  ]
}`;

  const hmacExample = `POST ${webhookUrl || 'https://<din-endepunkt-URL>'}
Content-Type: application/json
X-Signature: sha256=<hex_signatur>

<JSON-body>`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" /> Integrasjonsguide for leverandører
        </CardTitle>
        <CardDescription>
          Send denne guiden til sensorleverandøren eller utvikleren som skal koble seg på.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="push" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="push">Push (webhook)</TabsTrigger>
            <TabsTrigger value="pull">Pull (polling)</TabsTrigger>
            <TabsTrigger value="hmac">HMAC-signering</TabsTrigger>
          </TabsList>

          <TabsContent value="push" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Leverandøren sender målinger til URL-en under hver gang en sensor rapporterer. Dette er
              den enkleste metoden for de fleste skybaserte sensorplattformer.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Mottaks-URL</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={webhookUrl || 'Aktiver sensormottak først for å se URL'}
                  className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(webhookUrl, 'Webhook-URL')}
                  disabled={!webhookUrl}
                >
                  <Copy className="h-4 w-4 mr-2" /> Kopier
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Eksempel på én måling</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{jsonExample}</pre>
              <Button variant="outline" size="sm" onClick={() => copy(jsonExample, 'Eksempel JSON')}>
                <Copy className="h-4 w-4 mr-2" /> Kopier eksempel
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Flere målinger samlet</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{arrayExample}</pre>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Feltene <code>sensor_id</code> og <code>temperature</code> er påkrevd.</li>
              <li>
                <code>timestamp</code> kan være ISO 8601 (zulu eller med tidssone). Uten timestamp
                brukes mottakstidspunktet.
              </li>
              <li>
                <code>battery</code> er valgfritt. Vi leser både prosent (0-100) og volt.
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="pull" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hvis leverandøren ikke har webhook, kan systemet hente data med jevne mellomrom. Du
              legger da inn API-nøkkel og endepunkt-URL under fanen «Integrasjoner».
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Støtter GET/POST og API-nøkkel i header eller query.</li>
              <li>Standard poll-frekvens er 10 minutter.</li>
              <li>Responsen mappes automatisk til feltene sensor_id, temperature, battery.</li>
            </ul>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Kontaktinformasjon for integrasjon</p>
              <p className="text-muted-foreground mt-1">
                Teknisk kontakt:{' '}
                <a href="mailto:post@ambs.no" className="text-primary underline">
                  post@ambs.no
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="hmac" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              For å sikre at dataen virkelig kommer fra leverandøren, kan du aktivere HMAC-signering.
              Begge parter bruker da samme hemmelige nøkkel.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Format</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{hmacExample}</pre>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>
                Signer den rå JSON-strengen med HMAC-SHA256 og nøkkelen som er avtalt i appen.
              </li>
              <li>
                Send signaturen i headeren som er konfigurert (standard: <code>X-Signature</code>).
              </li>
              <li>
                Headerverdien kan være <code>sha256=&#123;hex&#125;</code> eller bare <code>&#123;hex&#125;</code>.
              </li>
            </ul>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Automatisk avvikshåndtering</p>
            <p className="text-muted-foreground">
              Når en sensor rapporterer utenfor temperaturgrensene, opprettes et avvik med
              IKM-nummer og ansvarlige varsles på e-post. Vedvarer avviket, oppdateres
              avvikssaken automatisk med nye målinger.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Offline-overvåking</p>
            <p className="text-muted-foreground">
              Hvis en sensor ikke har sendt data innen konfigurert tidsfrist, markeres den som
              offline og det sendes et varsel. Dette er spesielt viktig for kjøleskap og frysere
              som må være under kontinuerlig kontroll.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
