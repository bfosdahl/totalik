import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Copy, RefreshCw, Radio, Plus, Trash2, Thermometer, BatteryMedium, Info, ShieldAlert,
  WifiOff, CheckCircle2, AlertTriangle, Bell, Download, Filter, Activity, BookOpen, PlayCircle,
} from 'lucide-react';
import { useIkMatSensors, getWebhookUrl, sensorStatus, type IkMatSensor } from '@/hooks/useIkMatSensors';
import { generateSensorMapPdf } from '@/utils/ikMatSensorMapPdf';
import { useAuth } from '@/contexts/AuthContext';
import { useIkMatTemperature } from '@/hooks/useIkMatTemperature';
import { SensorAlarmSettings } from '@/components/ik-mat/SensorAlarmSettings';
import { SensorIntegrations } from '@/components/ik-mat/SensorIntegrations';
import { SensorVendorDocs } from '@/components/ik-mat/SensorVendorDocs';
import { LoraWanSetupGuide } from '@/components/ik-mat/LoraWanSetupGuide';
import { SensorNotificationCard } from '@/components/ik-mat/SensorNotificationCard';
import { useQuery } from '@tanstack/react-query';
import { t } from "@/i18n/t";

const UNMAPPED = '__none__';

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: 'OK', className: 'bg-primary/10 text-primary border-primary/30', Icon: CheckCircle2 },
  alarm: { label: 'Alarm', className: 'bg-destructive/10 text-destructive border-destructive/30', Icon: AlertTriangle },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground border-border', Icon: WifiOff },
  unmapped: { label: 'Ikke koblet', className: 'bg-accent text-accent-foreground border-border', Icon: Info },
  inactive: { label: 'Deaktivert', className: 'bg-muted text-muted-foreground border-border', Icon: Info },
};

const SCENARIOS: { value: string; label: string }[] = [
  { value: 'normal', label: 'Normal måling' },
  { value: 'high_temp', label: 'Høy temperatur' },
  { value: 'low_temp', label: 'Lav temperatur' },
  { value: 'offline', label: 'Offline' },
  { value: 'low_battery', label: 'Lavt batteri' },
];

function SensorMiniGraph({ sensor, getSensorLogs }: { sensor: IkMatSensor; getSensorLogs: (equipment_id: string) => Promise<{ temperature: number; measured_at: string; is_acceptable: boolean }[]> }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['sensor-mini-graph', sensor.id, sensor.equipment_id],
    queryFn: async () => {
      if (!sensor.equipment_id) return [];
      return getSensorLogs(sensor.equipment_id);
    },
    enabled: !!sensor.equipment_id,
    refetchInterval: 60_000,
  });

  if (!sensor.equipment_id) return null;
  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("auto.ingen_maalinger_siste_24_timer")}</p>;
  }

  const temps = logs.map((l) => l.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = Math.max(max - min, 0.5);
  const width = 200;
  const height = 48;
  const points = logs.map((l, i) => {
    const x = (i / (logs.length - 1 || 1)) * width;
    const y = height - ((l.temperature - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3 w-3" /> Siste 24 timer
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 rounded-md border bg-muted/50">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="text-primary"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toFixed(1)} °C</span>
        <span>{max.toFixed(1)} °C</span>
      </div>
    </div>
  );
}

export default function IkMatSensorer() {
  const {
    endpoint, sensors, alerts, isLoading, notificationSettings,
    createEndpoint, updateEndpoint, regenerateToken,
    addSensor, updateSensor, deleteSensor, runWatchdog, simulateSensor,
    updateNotificationSettings, getSensorLogs,
  } = useIkMatSensors();
  const { equipment } = useIkMatTemperature();
  const { company } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSensor, setNewSensor] = useState({ external_id: '', name: '', provider: '', equipment_id: UNMAPPED });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const webhookUrl = endpoint ? getWebhookUrl(endpoint.token) : '';

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} kopiert`);
  };

  const handleAdd = async () => {
    if (!newSensor.external_id.trim()) {
      toast.error('Sensor-ID er påkrevd');
      return;
    }
    await addSensor.mutateAsync({
      external_id: newSensor.external_id,
      name: newSensor.name,
      provider: newSensor.provider,
      equipment_id: newSensor.equipment_id === UNMAPPED ? null : newSensor.equipment_id,
    });
    setNewSensor({ external_id: '', name: '', provider: '', equipment_id: UNMAPPED });
    setDialogOpen(false);
  };

  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      const status = sensorStatus(s);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      const hay = `${s.name || ''} ${s.external_id} ${s.provider || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [sensors, statusFilter, search]);

  const unmappedCount = sensors.filter((s) => !s.equipment_id).length;
  const statuses = sensors.map((s) => sensorStatus(s));
  const counts = {
    ok: statuses.filter((s) => s === 'ok').length,
    alarm: statuses.filter((s) => s === 'alarm').length,
    offline: statuses.filter((s) => s === 'offline').length,
    unmapped: statuses.filter((s) => s === 'unmapped').length,
  };

  const renderStatus = (sensor: IkMatSensor) => {
    const meta = STATUS_META[sensorStatus(sensor)];
    const Icon = meta.Icon;
    return (
      <Badge variant="outline" className={`gap-1 ${meta.className}`}>
        <Icon className="h-3 w-3" /> {meta.label}
      </Badge>
    );
  };

  const exportSensorMapPdf = () => {
    if (sensors.length === 0) {
      toast.info('Ingen sensorer å eksportere');
      return;
    }
    generateSensorMapPdf({
      companyName: company?.name || '',
      webhookConfigured: !!endpoint?.is_active,
      rows: sensors.map((s) => {
        const equip = equipment.find((e) => e.id === s.equipment_id);
        return {
          externalId: s.external_id,
          name: s.name || '',
          provider: s.provider || '',
          location: s.location || '',
          equipment: equip?.name || '',
          minTemp: s.min_temp_override ?? equip?.min_temp ?? null,
          maxTemp: s.max_temp_override ?? equip?.max_temp ?? null,
          offlineAfterMinutes: s.offline_after_minutes || 120,
          status: STATUS_META[sensorStatus(s)].label,
          lastReadingAt: s.last_reading_at,
          lastTemperature: s.last_temperature,
          lastBattery: s.last_battery,
        };
      }),
    });
    toast.success('Sensorkart lastet ned');
  };

  const exportCsv = () => {
    const rows = alerts.map((a) => ({
      Tid: new Date(a.created_at).toLocaleString('nb-NO'),
      Type: a.alert_type,
      Alvorlighet: a.severity,
      Melding: a.message,
      Avvik: a.deviation_number || '',
      Mottakere: (a.recipients || []).join(', '),
      Epoststatus: a.email_status || '',
    }));
    if (rows.length === 0) {
      toast.info('Ingen varsler å eksportere');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => r[h as keyof typeof r]).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensorvarsler_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('CSV lastet ned');
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Radio className="h-7 w-7 text-primary" />
            Automatiske sensorer
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("auto.koble_traadloese_temperatursensorer_til_")}
          </p>
        </div>

        {/* Live driftsstatus */}
        {sensors.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{t("auto.driftsstatus")}</CardTitle>
                <CardDescription>{t("auto.oppdateres_automatisk_hvert_minutt")}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runWatchdog.mutate()}
                disabled={runWatchdog.isPending}
              >
                <ShieldAlert className="h-4 w-4 mr-2" /> {t("auto.kjoer_sensorsjekk")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-primary">{counts.ok}</p>
                  <p className="text-xs text-muted-foreground">{t("auto.i_orden")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-destructive">{counts.alarm}</p>
                  <p className="text-xs text-muted-foreground">{t("auto.temperaturalarm")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{counts.offline}</p>
                  <p className="text-xs text-muted-foreground">{t("auto.offline")}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{counts.unmapped}</p>
                  <p className="text-xs text-muted-foreground">{t("auto.ikke_koblet")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>{t("auto.ditt_mottaksendepunkt")}</CardTitle>
            <CardDescription>
              {t("auto.dette_er_adressen_sensorleverandoeren_sk")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">{t("auto.laster")}</p>
            ) : !endpoint ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("auto.du_har_ikke_aktivert_sensormottak_ennaa")}
                </p>
                <Button onClick={() => createEndpoint.mutate()} disabled={createEndpoint.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aktiver sensormottak
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t("auto.webhook_url")}</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                    <Button variant="outline" onClick={() => copy(webhookUrl, 'URL')}>
                      <Copy className="h-4 w-4 mr-2" /> Kopier
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={endpoint.is_active}
                      onCheckedChange={(v) => updateEndpoint.mutate({ id: endpoint.id, is_active: v })}
                    />
                    <span className="text-sm">{endpoint.is_active ? 'Aktivt' : 'Deaktivert'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => regenerateToken.mutate(endpoint.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" /> {t("auto.ny_noekkel")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Sist mottatt:{' '}
                    {endpoint.last_received_at
                      ? new Date(endpoint.last_received_at).toLocaleString('nb-NO')
                      : 'aldri'}
                  </span>
                </div>

                {endpoint.last_error && (
                  <Alert variant="destructive">
                    <AlertDescription>Siste feil: {endpoint.last_error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Company notification settings */}
        <SensorNotificationCard
          settings={notificationSettings}
          onSave={(patch) => updateNotificationSettings.mutate(patch as never)}
          isSaving={updateNotificationSettings.isPending}
        />

        {/* Sensors */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t("auto.sensorer")}</CardTitle>
              <CardDescription>
                {t("auto.koble_hver_sensor_til_riktig_kjoeleskap_")}
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> {t("auto.legg_til")}
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>{t("auto.ny_sensor")}</DialogTitle>
                  <DialogDescription>
                    {t("auto.sensor_id_maa_vaere_noeyaktig_den_id_en_")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auto.sensor_id")}</Label>
                    <Input
                      value={newSensor.external_id}
                      onChange={(e) => setNewSensor({ ...newSensor, external_id: e.target.value })}
                      placeholder={t("auto.f_eks_a1b2c3")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.navn_2")}</Label>
                    <Input
                      value={newSensor.name}
                      onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                      placeholder={t("auto.f_eks_kjoeleskap_kjoekken")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.leverandoer")}</Label>
                    <Input
                      value={newSensor.provider}
                      onChange={(e) => setNewSensor({ ...newSensor, provider: e.target.value })}
                      placeholder={t("auto.f_eks_sensorpush")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.koblet_til_utstyr")}</Label>
                    <Select
                      value={newSensor.equipment_id}
                      onValueChange={(v) => setNewSensor({ ...newSensor, equipment_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder={t("auto.velg_utstyr")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNMAPPED}>{t("auto.ikke_koblet")}</SelectItem>
                        {equipment.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("auto.avbryt")}</Button>
                  <Button onClick={handleAdd} disabled={addSensor.isPending}>{t("auto.lagre")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {unmappedCount > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {unmappedCount} sensor{unmappedCount === 1 ? '' : 'er'} er ikke koblet til utstyr. Målinger
                  fra disse blir ikke logget før du velger utstyr.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("auto.soek_etter_navn_id_eller_leverandoer")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t("auto.status_2")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("auto.alle_statuser")}</SelectItem>
                  <SelectItem value="ok">{t("auto.i_orden")}</SelectItem>
                  <SelectItem value="alarm">{t("auto.alarm")}</SelectItem>
                  <SelectItem value="offline">{t("auto.offline")}</SelectItem>
                  <SelectItem value="unmapped">{t("auto.ikke_koblet")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-2" /> Eksporter varsler
              </Button>
              <Button variant="outline" onClick={exportSensorMapPdf}>
                <FileText className="h-4 w-4 mr-2" /> Sensorkart (PDF)
              </Button>
            </div>

            {filteredSensors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("auto.ingen_sensorer_matcher_filteret_nye_sens")}
              </p>
            ) : (
              filteredSensors.map((sensor) => (
                <div key={sensor.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sensor.name || sensor.external_id}</p>
                      <p className="text-xs text-muted-foreground font-mono">ID: {sensor.external_id}</p>
                      {sensor.provider && (
                        <p className="text-xs text-muted-foreground">{sensor.provider}</p>
                      )}
                      {sensor.simulation_mode && (
                        <Badge variant="outline" className="mt-1 gap-1 text-xs">
                          <PlayCircle className="h-3 w-3" /> Simulering
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={sensor.is_active}
                        onCheckedChange={(v) => updateSensor.mutate({ id: sensor.id, is_active: v })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSensor.mutate(sensor.id)}
                        aria-label={t("auto.fjern_sensor")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {renderStatus(sensor)}
                    {sensor.last_temperature !== null && (
                      <Badge variant="secondary" className="gap-1">
                        <Thermometer className="h-3 w-3" /> {sensor.last_temperature} °C
                      </Badge>
                    )}
                    {sensor.last_battery !== null && (
                      <Badge variant="outline" className="gap-1">
                        <BatteryMedium className="h-3 w-3" /> {sensor.last_battery}%
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Sist: {sensor.last_reading_at
                        ? new Date(sensor.last_reading_at).toLocaleString('nb-NO')
                        : 'aldri'}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.koblet_til_utstyr")}</Label>
                      <Select
                        value={sensor.equipment_id ?? UNMAPPED}
                        onValueChange={(v) =>
                          updateSensor.mutate({ id: sensor.id, equipment_id: v === UNMAPPED ? null : v })
                        }
                      >
                        <SelectTrigger><SelectValue placeholder={t("auto.velg_utstyr")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNMAPPED}>{t("auto.ikke_koblet")}</SelectItem>
                          {equipment.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.simuler_scenario")}</Label>
                      <Select
                        value=""
                        onValueChange={(scenario) => {
                          if (!scenario) return;
                          simulateSensor.mutate({ sensor_id: sensor.id, scenario });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("auto.velg_scenario")} />
                        </SelectTrigger>
                        <SelectContent>
                          {SCENARIOS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sensor.equipment_id && (
                    <SensorMiniGraph sensor={sensor} getSensorLogs={getSensorLogs} />
                  )}

                  <SensorAlarmSettings
                    sensor={sensor}
                    onSave={(patch) => updateSensor.mutate(patch)}
                    isSaving={updateSensor.isPending}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Varslingslogg */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Varslingslogg
            </CardTitle>
            <CardDescription>
              {t("auto.dokumentasjon_paa_at_alarmer_er_sendt_ka")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("auto.ingen_varsler_er_sendt_ennaa")}</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        a.severity === 'high'
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : ''
                      }
                    >
                      {a.alert_type === 'offline'
                        ? 'Offline'
                        : a.alert_type === 'low_battery'
                        ? 'Lavt batteri'
                        : 'Temperatur'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString('nb-NO')}
                    </span>
                    {a.deviation_number && (
                      <Badge variant="secondary">{a.deviation_number}</Badge>
                    )}
                    {a.email_status && (
                      <Badge variant="outline" className="text-xs">
                        E-post: {a.email_status === 'sent' ? 'sendt' : a.email_status}
                      </Badge>
                    )}
                  </div>
                  <p className="whitespace-pre-line">{a.message}</p>
                  {a.recipients?.length > 0 && (
                    <p className="text-xs text-muted-foreground">Til: {a.recipients.join(', ')}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <SensorIntegrations
          endpointId={endpoint?.id ?? null}
          signatureSecret={(endpoint as unknown as { signature_secret?: string | null })?.signature_secret ?? null}
          signatureHeader={(endpoint as unknown as { signature_header?: string | null })?.signature_header ?? 'x-signature'}
          debugLogging={(endpoint as unknown as { debug_logging?: boolean })?.debug_logging ?? true}
          webhookUrl={webhookUrl}
          endpointActive={!!endpoint?.is_active}
          hasReceivedData={!!endpoint?.last_received_at}
          onUpdateEndpoint={(patch) => updateEndpoint.mutate({ id: endpoint!.id, ...patch } as never)}
        />

        <LoraWanSetupGuide webhookUrl={webhookUrl} />

        <SensorVendorDocs webhookUrl={webhookUrl} />

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Slik kommer du i gang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="1">
                <AccordionTrigger>{t("auto.1_skaff_sensorer")}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Du trenger trådløse temperatursensorer med internett-tilkobling (4G, WiFi eller
                    basestasjon). Vanlige leverandører er SensorPush, Efento, Disruptive Technologies og
                    Temperaturvakt. Har du sensorer fra før, kan de som regel brukes direkte.
                  </p>
                  <p>{t("auto.total_ik_selger_ikke_sensorer_du_kjoeper")}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger>{t("auto.2_legg_inn_webhook_url_hos_leverandoeren")}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    {t("auto.i_sensorleverandoerens_portal_finner_du_")}
                  </p>
                  <p>{t("auto.vi_leser_vanlige_feltnavn_automatisk_for")}</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "sensor_id": "A1B2C3",
  "temperature": 4.2,
  "timestamp": "2026-01-01T08:00:00Z",
  "battery": 92
}`}
                  </pre>
                  <p>{t("auto.flere_maalinger_kan_sendes_samlet_som_en")}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="3">
                <AccordionTrigger>{t("auto.3_koble_sensor_til_utstyr")}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {t("auto.foerste_gang_en_sensor_sender_data_dukke")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
