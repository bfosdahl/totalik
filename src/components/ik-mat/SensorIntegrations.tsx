import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plug, Plus, RefreshCw, Trash2, KeyRound, PlayCircle, ScrollText, ShieldCheck } from 'lucide-react';
import { useSensorIntegrations, type SensorIntegration } from '@/hooks/useSensorIntegrations';
import { toast } from 'sonner';
import {
  SensorReadinessChecklist,
  validateSensorSetup,
  isSensorSetupSavable,
} from '@/components/ik-mat/SensorReadinessChecklist';
import { t } from "@/i18n/t";

interface Props {
  endpointId?: string | null;
  signatureSecret?: string | null;
  signatureHeader?: string | null;
  debugLogging?: boolean;
  webhookUrl?: string;
  endpointActive?: boolean;
  hasReceivedData?: boolean;
  onUpdateEndpoint?: (patch: { signature_secret?: string | null; signature_header?: string; debug_logging?: boolean }) => void;
}

export function SensorIntegrations({
  endpointId,
  signatureSecret,
  signatureHeader,
  debugLogging = true,
  onUpdateEndpoint,
}: Props) {
  const {
    providers,
    integrations,
    payloadLog,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    saveCredentials,
    clearCredentials,
    testIntegration,
    syncNow,
  } = useSensorIntegrations();

  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, Record<string, string>>>({});
  const [testPreview, setTestPreview] = useState<Record<string, string>>({});
  const [secretDraft, setSecretDraft] = useState(signatureSecret ?? '');
  const [headerDraft, setHeaderDraft] = useState(signatureHeader ?? 'x-signature');

  const selectedProvider = providers.find((p) => p.id === providerId);

  const handleCreate = async () => {
    if (!providerId || !selectedProvider) return;
    await createIntegration.mutateAsync({
      provider: providerId,
      display_name: displayName || selectedProvider.label,
      mode: selectedProvider.mode,
      base_url: baseUrl || selectedProvider.defaultBaseUrl || null,
      endpoint_id: endpointId ?? null,
    });
    setOpen(false);
    setProviderId('');
    setDisplayName('');
    setBaseUrl('');
  };

  const draftFor = (id: string) => credentialDrafts[id] ?? {};
  const setDraft = (id: string, key: string, value: string) =>
    setCredentialDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [key]: value } }));

  const statusBadge = (integration: SensorIntegration) => {
    const s = integration.last_sync_status;
    if (!s) return <Badge variant="secondary">{t("auto.ikke_testet")}</Badge>;
    if (s.includes('error')) return <Badge variant="destructive">{t("auto.feil")}</Badge>;
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" /> {t("auto.leverandoerintegrasjoner")}
            </CardTitle>
            <CardDescription>
              {t("auto.koble_til_sensorleverandoeren_din_enten_")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => syncNow.mutate(undefined)} disabled={syncNow.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncNow.isPending ? 'animate-spin' : ''}`} />
              {t("auto.hent_naa")}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Ny
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>{t("auto.ny_leverandoerintegrasjon")}</DialogTitle>
                  <DialogDescription>{t("auto.velg_leverandoer_og_hvordan_data_skal_he")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auto.leverandoer")}</Label>
                    <Select value={providerId} onValueChange={(v) => {
                      setProviderId(v);
                      const p = providers.find((x) => x.id === v);
                      setBaseUrl(p?.defaultBaseUrl ?? '');
                    }}>
                      <SelectTrigger><SelectValue placeholder={t("auto.velg_leverandoer")} /></SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.visningsnavn")}</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("auto.f_eks_kjoelerom_nord")} />
                  </div>
                  {selectedProvider?.mode === 'api' && (
                    <div className="space-y-2">
                      <Label>{t("auto.api_url")}</Label>
                      <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!providerId || createIntegration.isPending}>
                    {t("auto.opprett")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.length === 0 && (
            <Alert>
              <AlertDescription>
                {t("auto.ingen_integrasjoner_ennaa_bruk_webhook_u")}
              </AlertDescription>
            </Alert>
          )}

          <Accordion type="multiple" className="w-full">
            {integrations.map((integration) => {
              const provider = providers.find((p) => p.id === integration.provider);
              const draft = draftFor(integration.id);
              return (
                <AccordionItem key={integration.id} value={integration.id}>
                  <AccordionTrigger>
                    <div className="flex flex-wrap items-center gap-2 text-left">
                      <span className="font-medium">{integration.display_name || provider?.label || integration.provider}</span>
                      <Badge variant="outline">{integration.mode === 'api' ? 'Vi henter data' : 'Webhook'}</Badge>
                      {statusBadge(integration)}
                      {integration.has_credentials && (
                        <Badge variant="secondary" className="gap-1">
                          <KeyRound className="h-3 w-3" /> {t("auto.noekler_lagret")}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    {integration.last_error && (
                      <Alert variant="destructive">
                        <AlertDescription className="break-words">{integration.last_error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t("auto.visningsnavn")}</Label>
                        <Input
                          defaultValue={integration.display_name ?? ''}
                          onBlur={(e) =>
                            e.target.value !== (integration.display_name ?? '') &&
                            updateIntegration.mutate({ id: integration.id, display_name: e.target.value })
                          }
                        />
                      </div>
                      {integration.mode === 'api' && (
                        <>
                          <div className="space-y-2">
                            <Label>{t("auto.api_url")}</Label>
                            <Input
                              defaultValue={integration.base_url ?? ''}
                              onBlur={(e) =>
                                e.target.value !== (integration.base_url ?? '') &&
                                updateIntegration.mutate({ id: integration.id, base_url: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hent data hvert (minutter)</Label>
                            <Input
                              type="number"
                              min={5}
                              defaultValue={integration.poll_interval_minutes}
                              onBlur={(e) =>
                                updateIntegration.mutate({
                                  id: integration.id,
                                  poll_interval_minutes: Math.max(5, Number(e.target.value) || 15),
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="text-sm font-medium">{t("auto.aktiv")}</p>
                          <p className="text-xs text-muted-foreground">{t("auto.sett_av_for_aa_pause_innhenting")}</p>
                        </div>
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={(v) => updateIntegration.mutate({ id: integration.id, is_active: v })}
                        />
                      </div>
                    </div>

                    {provider && provider.credentialFields.length > 0 && (
                      <div className="space-y-3 rounded-md border p-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <KeyRound className="h-4 w-4" /> {t("auto.innlogging_hos_leverandoeren")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("auto.noekler_lagres_kryptert_paa_serveren_og_")}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {provider.credentialFields.map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label>{field.label}</Label>
                              <Input
                                type={field.secret ? 'password' : 'text'}
                                autoComplete="off"
                                value={draft[field.key] ?? ''}
                                placeholder={integration.has_credentials ? '•••••• (lagret)' : ''}
                                onChange={(e) => setDraft(integration.id, field.key, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              saveCredentials.mutate(
                                { integration_id: integration.id, credentials: draft },
                                { onSuccess: () => setCredentialDrafts((p) => ({ ...p, [integration.id]: {} })) },
                              )
                            }
                            disabled={Object.keys(draft).length === 0 || saveCredentials.isPending}
                          >
                            {t("auto.lagre_noekler")}
                          </Button>
                          {integration.has_credentials && (
                            <Button size="sm" variant="outline" onClick={() => clearCredentials.mutate(integration.id)}>
                              {t("auto.slett_noekler")}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {integration.mode === 'api' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              testIntegration.mutate(integration.id, {
                                onSuccess: (d) =>
                                  setTestPreview((p) => ({ ...p, [integration.id]: d?.preview ?? '' })),
                              })
                            }
                            disabled={testIntegration.isPending}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" /> Test kobling
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => syncNow.mutate(integration.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" /> {t("auto.hent_naa")}
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteIntegration.mutate(integration.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> {t("auto.slett")}
                      </Button>
                    </div>

                    {testPreview[integration.id] && (
                      <Textarea readOnly rows={6} className="font-mono text-xs" value={testPreview[integration.id]} />
                    )}

                    {integration.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Sist hentet: {new Date(integration.last_sync_at).toLocaleString('nb-NO')}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {endpointId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> {t("auto.sikkerhet_paa_webhooken")}
            </CardTitle>
            <CardDescription>
              Hvis leverandøren støtter signering (HMAC-SHA256), legg inn samme hemmelige nøkkel her. Da avvises
              alle data som ikke kommer fra leverandøren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("auto.hemmelig_signaturnoekkel")}</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  value={secretDraft}
                  onChange={(e) => setSecretDraft(e.target.value)}
                  placeholder="Tom = signatur ikke påkrevd"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auto.header_navn")}</Label>
                <Input value={headerDraft} onChange={(e) => setHeaderDraft(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{t("auto.loggfoer_mottatte_datapakker")}</p>
                <p className="text-xs text-muted-foreground">{t("auto.nyttig_ved_feilsoeking_mot_leverandoeren")}</p>
              </div>
              <Switch
                checked={debugLogging}
                onCheckedChange={(v) => onUpdateEndpoint?.({ debug_logging: v })}
              />
            </div>

            <SensorReadinessChecklist items={checklist} />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                size="sm"
                disabled={!canSave}
                onClick={() => {
                  if (!canSave) {
                    toast.error('Fullfør sjekklisten før du lagrer');
                    return;
                  }
                  onUpdateEndpoint?.({
                    signature_secret: secretDraft.trim() || null,
                    signature_header: headerDraft.trim() || 'x-signature',
                  });
                }}
              >
                {t("auto.lagre_signaturinnstillinger")}
              </Button>
              {!canSave && (
                <span className="text-xs text-destructive">
                  Rett opp punktene markert med rødt før oppsettet kan lagres.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> {t("auto.datalogg_feilsoeking")}
          </CardTitle>
          <CardDescription>{t("auto.de_50_siste_datapakkene_inn_og_ut_med_st")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {payloadLog.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("auto.ingen_data_registrert_ennaa")}</p>
          )}
          <Accordion type="multiple">
            {payloadLog.map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger>
                  <div className="flex flex-wrap items-center gap-2 text-left text-sm">
                    <Badge variant={entry.status === 'ok' ? 'secondary' : 'destructive'}>{entry.status}</Badge>
                    <span>{entry.direction === 'inbound' ? 'Mottatt' : 'Hentet'}</span>
                    <span className="text-muted-foreground">{entry.source || '—'}</span>
                    <span className="text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString('nb-NO')}
                    </span>
                    <span className="text-muted-foreground">{entry.reading_count} målinger</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {entry.error && <p className="text-sm text-destructive mb-2 break-words">{entry.error}</p>}
                  <Textarea
                    readOnly
                    rows={8}
                    className="font-mono text-xs"
                    value={JSON.stringify(entry.payload ?? {}, null, 2).slice(0, 5000)}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
