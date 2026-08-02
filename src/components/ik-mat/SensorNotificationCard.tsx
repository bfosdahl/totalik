import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell } from 'lucide-react';
import { type SensorNotificationSettings } from '@/hooks/useIkMatSensors';

interface SensorNotificationCardProps {
  settings: SensorNotificationSettings | null;
  onSave: (patch: Partial<SensorNotificationSettings> & { id: string }) => void;
  isSaving: boolean;
}

export function SensorNotificationCard({ settings, onSave, isSaving }: SensorNotificationCardProps) {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailEnabled(settings.sensor_alarm_email);
      setEmailRecipients(settings.sensor_alarm_email_recipients || []);
      setSmsEnabled(settings.sensor_alarm_sms);
    }
  }, [settings]);

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Varsling ved sensoravvik</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Laster varslingsinnstillinger...</p>
        </CardContent>
      </Card>
    );
  }

  const addEmail = () => {
    const email = emailDraft.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (emailRecipients.includes(email)) return;
    setEmailRecipients([...emailRecipients, email]);
    setEmailDraft('');
  };

  const removeEmail = (email: string) => {
    setEmailRecipients(emailRecipients.filter((e) => e !== email));
  };

  const handleSave = () => {
    onSave({
      id: settings.id,
      sensor_alarm_email: emailEnabled,
      sensor_alarm_email_recipients: emailRecipients,
      sensor_alarm_sms: smsEnabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Varsling ved sensoravvik
        </CardTitle>
        <CardDescription>
          Hvem skal motta e-post når en sensor går utenfor grenser, får lavt batteri eller blir
          offline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">E-postvarsler</p>
              <p className="text-xs text-muted-foreground">Send e-post til mottakerlisten</p>
            </div>
          </div>
          <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>

        {emailEnabled && (
          <div className="space-y-3">
            <Label className="text-xs">Mottakere</Label>
            <div className="flex flex-wrap gap-2">
              {emailRecipients.length === 0 && (
                <span className="text-xs text-muted-foreground">Ingen mottakere lagt til</span>
              )}
              {emailRecipients.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    aria-label="Fjern mottaker"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="navn@bedrift.no"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              <Button type="button" variant="outline" onClick={addEmail}>
                Legg til
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">SMS-varsler</p>
            <p className="text-xs text-muted-foreground">Kommer snart. Krev integrasjon mot SMS-leverandør.</p>
          </div>
          <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} disabled />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? 'Lagrer...' : 'Lagre varslingsinnstillinger'}
        </Button>
      </CardContent>
    </Card>
  );
}
