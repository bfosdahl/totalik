import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BellRing } from 'lucide-react';
import type { IkMatSensor } from '@/hooks/useIkMatSensors';

interface Props {
  sensor: IkMatSensor;
  onSave: (patch: Partial<IkMatSensor> & { id: string }) => void;
  isSaving?: boolean;
}

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export function SensorAlarmSettings({ sensor, onSave, isSaving }: Props) {
  const [form, setForm] = useState({
    location: sensor.location ?? '',
    min: sensor.min_temp_override?.toString() ?? '',
    max: sensor.max_temp_override?.toString() ?? '',
    grace: (sensor.breach_grace_minutes ?? 15).toString(),
    offline: (sensor.offline_after_minutes ?? 120).toString(),
    battery: (sensor.low_battery_threshold ?? 20).toString(),
    emails: (sensor.alert_emails ?? []).join(', '),
  });

  useEffect(() => {
    setForm({
      location: sensor.location ?? '',
      min: sensor.min_temp_override?.toString() ?? '',
      max: sensor.max_temp_override?.toString() ?? '',
      grace: (sensor.breach_grace_minutes ?? 15).toString(),
      offline: (sensor.offline_after_minutes ?? 120).toString(),
      battery: (sensor.low_battery_threshold ?? 20).toString(),
      emails: (sensor.alert_emails ?? []).join(', '),
    });
  }, [sensor.id, sensor.updated_at as unknown as string]);

  const save = () => {
    onSave({
      id: sensor.id,
      location: form.location.trim() || null,
      min_temp_override: numOrNull(form.min),
      max_temp_override: numOrNull(form.max),
      breach_grace_minutes: Number(form.grace) || 0,
      offline_after_minutes: Number(form.offline) || 120,
      low_battery_threshold: Number(form.battery) || 0,
      alert_emails: form.emails
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@')),
    });
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="alarm" className="border-none">
        <AccordionTrigger className="py-2 text-sm">
          <span className="flex items-center gap-2">
            <BellRing className="h-4 w-4" /> Alarm og varsling
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Plassering</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="f.eks. Kjøkken, kjølerom 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Min. °C (overstyrer utstyr)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.min}
                onChange={(e) => setForm({ ...form, min: e.target.value })}
                placeholder="tom = bruk utstyr"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Maks. °C (overstyrer utstyr)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.max}
                onChange={(e) => setForm({ ...form, max: e.target.value })}
                placeholder="tom = bruk utstyr"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Karenstid (min)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.grace}
                onChange={(e) => setForm({ ...form, grace: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Offline etter (min)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.offline}
                onChange={(e) => setForm({ ...form, offline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lavt batteri (%)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={form.battery}
                onChange={(e) => setForm({ ...form, battery: e.target.value })}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Karenstid hindrer falske alarmer ved døråpning og avriming. Alarm sendes først når
            temperaturen har vært utenfor grensene sammenhengende i angitt antall minutter.
          </p>

          <div className="space-y-1">
            <Label className="text-xs">Varsle disse e-postadressene</Label>
            <Input
              value={form.emails}
              onChange={(e) => setForm({ ...form, emails: e.target.value })}
              placeholder="kjokkensjef@bedrift.no, drift@bedrift.no"
            />
            <p className="text-xs text-muted-foreground">
              La feltet stå tomt for å varsle bedriftens administratorer.
            </p>
          </div>

          <Button size="sm" onClick={save} disabled={isSaving}>
            Lagre alarminnstillinger
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
