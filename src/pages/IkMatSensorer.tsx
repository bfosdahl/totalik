import { useState } from 'react';
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
import { Copy, RefreshCw, Radio, Plus, Trash2, Thermometer, BatteryMedium, Info, ShieldAlert, WifiOff, CheckCircle2, AlertTriangle, Bell } from 'lucide-react';
import { useIkMatSensors, getWebhookUrl, sensorStatus, type IkMatSensor } from '@/hooks/useIkMatSensors';
import { useIkMatTemperature } from '@/hooks/useIkMatTemperature';
import { SensorAlarmSettings } from '@/components/ik-mat/SensorAlarmSettings';

const UNMAPPED = '__none__';

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: 'OK', className: 'bg-primary/10 text-primary border-primary/30', Icon: CheckCircle2 },
  alarm: { label: 'Alarm', className: 'bg-destructive/10 text-destructive border-destructive/30', Icon: AlertTriangle },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground border-border', Icon: WifiOff },
  unmapped: { label: 'Ikke koblet', className: 'bg-accent text-accent-foreground border-border', Icon: Info },
  inactive: { label: 'Deaktivert', className: 'bg-muted text-muted-foreground border-border', Icon: Info },
};

export default function IkMatSensorer() {
  const {
    endpoint, sensors, alerts, isLoading,
    createEndpoint, updateEndpoint, regenerateToken,
    addSensor, updateSensor, deleteSensor, runWatchdog,
  } = useIkMatSensors();
  const { equipment } = useIkMatTemperature();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSensor, setNewSensor] = useState({ external_id: '', name: '', provider: '', equipment_id: UNMAPPED });

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

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Radio className="h-7 w-7 text-primary" />
            Automatiske sensorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Koble trådløse temperatursensorer til IK-Mat. Målinger logges automatisk, avvik opprettes
            og ansvarlige varsles på e-post når noe er galt — også når en sensor slutter å svare.
          </p>
        </div>

        {/* Live driftsstatus */}
        {sensors.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Driftsstatus</CardTitle>
                <CardDescription>Oppdateres automatisk hvert minutt.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runWatchdog.mutate()}
                disabled={runWatchdog.isPending}
              >
                <ShieldAlert className="h-4 w-4 mr-2" /> Kjør sensorsjekk
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-primary">{counts.ok}</p>
                  <p className="text-xs text-muted-foreground">I orden</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-destructive">{counts.alarm}</p>
                  <p className="text-xs text-muted-foreground">Temperaturalarm</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{counts.offline}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{counts.unmapped}</p>
                  <p className="text-xs text-muted-foreground">Ikke koblet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Ditt mottaksendepunkt</CardTitle>
            <CardDescription>
              Dette er adressen sensorleverandøren skal sende målinger til. Del den kun med leverandøren din.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Laster...</p>
            ) : !endpoint ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Du har ikke aktivert sensormottak ennå.
                </p>
                <Button onClick={() => createEndpoint.mutate()} disabled={createEndpoint.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aktiver sensormottak
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Webhook-URL</Label>
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
                    <RefreshCw className="h-4 w-4 mr-2" /> Ny nøkkel
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

        {/* Sensors */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Sensorer</CardTitle>
              <CardDescription>
                Koble hver sensor til riktig kjøleskap, fryser eller varmeskap.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Legg til
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Ny sensor</DialogTitle>
                  <DialogDescription>
                    Sensor-ID må være nøyaktig den ID-en leverandøren sender med målingene.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sensor-ID *</Label>
                    <Input
                      value={newSensor.external_id}
                      onChange={(e) => setNewSensor({ ...newSensor, external_id: e.target.value })}
                      placeholder="f.eks. A1B2C3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Navn</Label>
                    <Input
                      value={newSensor.name}
                      onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                      placeholder="f.eks. Kjøleskap kjøkken"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leverandør</Label>
                    <Input
                      value={newSensor.provider}
                      onChange={(e) => setNewSensor({ ...newSensor, provider: e.target.value })}
                      placeholder="f.eks. SensorPush"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Koblet til utstyr</Label>
                    <Select
                      value={newSensor.equipment_id}
                      onValueChange={(v) => setNewSensor({ ...newSensor, equipment_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Velg utstyr" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNMAPPED}>Ikke koblet</SelectItem>
                        {equipment.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
                  <Button onClick={handleAdd} disabled={addSensor.isPending}>Lagre</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {unmappedCount > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {unmappedCount} sensor{unmappedCount === 1 ? '' : 'er'} er ikke koblet til utstyr. Målinger
                  fra disse blir ikke logget før du velger utstyr.
                </AlertDescription>
              </Alert>
            )}

            {sensors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen sensorer ennå. Nye sensorer dukker opp automatisk her første gang de sender data.
              </p>
            ) : (
              sensors.map((sensor) => (
                <div key={sensor.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sensor.name || sensor.external_id}</p>
                      <p className="text-xs text-muted-foreground font-mono">ID: {sensor.external_id}</p>
                      {sensor.provider && (
                        <p className="text-xs text-muted-foreground">{sensor.provider}</p>
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
                        aria-label="Fjern sensor"
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

                  <div className="space-y-1">
                    <Label className="text-xs">Koblet til utstyr</Label>
                    <Select
                      value={sensor.equipment_id ?? UNMAPPED}
                      onValueChange={(v) =>
                        updateSensor.mutate({ id: sensor.id, equipment_id: v === UNMAPPED ? null : v })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Velg utstyr" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNMAPPED}>Ikke koblet</SelectItem>
                        {equipment.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
              Dokumentasjon på at alarmer er sendt — kan vises fram ved tilsyn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen varsler er sendt ennå.</p>
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



        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Slik kommer du i gang</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="1">
                <AccordionTrigger>1. Skaff sensorer</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Du trenger trådløse temperatursensorer med internett-tilkobling (4G, WiFi eller
                    basestasjon). Vanlige leverandører er SensorPush, Efento, Disruptive Technologies og
                    Temperaturvakt. Har du sensorer fra før, kan de som regel brukes direkte.
                  </p>
                  <p>Total-IK selger ikke sensorer - du kjøper eller leier utstyret av leverandøren.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger>2. Legg inn webhook-URL hos leverandøren</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    I sensorleverandørens portal finner du gjerne «Webhook», «Integrasjon» eller «Push
                    API». Lim inn URL-en over, og velg metode POST med JSON.
                  </p>
                  <p>Vi leser vanlige feltnavn automatisk, for eksempel:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "sensor_id": "A1B2C3",
  "temperature": 4.2,
  "timestamp": "2026-01-01T08:00:00Z",
  "battery": 92
}`}
                  </pre>
                  <p>Flere målinger kan sendes samlet som en liste under «readings».</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="3">
                <AccordionTrigger>3. Koble sensor til utstyr</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Første gang en sensor sender data dukker den opp i listen over. Velg hvilket kjøleskap,
                  fryser eller varmeskap den tilhører. Da logges målingene i temperaturloggen, og avvik
                  opprettes automatisk hvis grensene brytes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
