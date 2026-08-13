import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, AlertTriangle, Webhook, ShieldCheck, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { t } from "@/i18n/t";

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
          <Code2 className="h-5 w-5" /> {t("auto.integrasjonsguide_for_leverandoerer")}
        </CardTitle>
        <CardDescription>
          {t("auto.send_denne_guiden_til_sensorleverandoere")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="push" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="push">Push (webhook)</TabsTrigger>
            <TabsTrigger value="pull">Pull (polling)</TabsTrigger>
            <TabsTrigger value="hmac">{t("auto.hmac_signering")}</TabsTrigger>
          </TabsList>

          <TabsContent value="push" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("auto.leverandoeren_sender_maalinger_til_url_e")}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("auto.mottaks_url")}</p>
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
              <p className="text-sm font-medium">{t("auto.eksempel_paa_n_maaling")}</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{jsonExample}</pre>
              <Button variant="outline" size="sm" onClick={() => copy(jsonExample, 'Eksempel JSON')}>
                <Copy className="h-4 w-4 mr-2" /> Kopier eksempel
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("auto.flere_maalinger_samlet")}</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{arrayExample}</pre>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{t("auto.feltene")} <code>sensor_id</code> og <code>temperature</code> {t("auto.er_paakrevd")}</li>
              <li>
                <code>timestamp</code> kan være ISO 8601 (zulu eller med tidssone). Uten timestamp
                brukes mottakstidspunktet.
              </li>
              <li>
                <code>battery</code> {t("auto.er_valgfritt_vi_leser_baade_prosent_0_10")}
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="pull" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("auto.hvis_leverandoeren_ikke_har_webhook_kan_")}
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{t("auto.stoetter_get_post_og_api_noekkel_i_heade")}</li>
              <li>{t("auto.standard_poll_frekvens_er_10_minutter")}</li>
              <li>{t("auto.responsen_mappes_automatisk_til_feltene_")}</li>
            </ul>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{t("auto.kontaktinformasjon_for_integrasjon")}</p>
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
              {t("auto.for_aa_sikre_at_dataen_virkelig_kommer_f")}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("auto.format")}</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">{hmacExample}</pre>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>
                {t("auto.signer_den_raa_json_strengen_med_hmac_sh")}
              </li>
              <li>
                {t("auto.send_signaturen_i_headeren_som_er_konfig")} <code>{t("auto.x_signature")}</code>).
              </li>
              <li>
                {t("auto.headerverdien_kan_vaere")} <code>sha256=&#123;hex&#125;</code> {t("auto.eller_bare")} <code>&#123;hex&#125;</code>.
              </li>
            </ul>
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="font-medium">{t("auto.automatisk_avvikshaandtering")}</p>
            <p className="text-muted-foreground">
              {t("auto.naar_en_sensor_rapporterer_utenfor_tempe")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="font-medium">{t("auto.offline_overvaaking")}</p>
            <p className="text-muted-foreground">
              {t("auto.hvis_en_sensor_ikke_har_sendt_data_innen")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
