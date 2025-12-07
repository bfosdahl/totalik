import { Bell, BellOff, Clock, UserPlus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

const DAYS_OPTIONS = [
  { value: 14, label: "14 dager" },
  { value: 7, label: "7 dager" },
  { value: 3, label: "3 dager" },
  { value: 1, label: "1 dag" },
];

export function NotificationSettingsCard() {
  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    isUpdating,
  } = useNotificationSettings();

  const isLoading = pushLoading || settingsLoading;

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;
    await updateSettings({ [key]: value });
  };

  const handleDaysChange = async (day: number, checked: boolean) => {
    if (!settings) return;
    const currentDays = settings.notify_days_before || [];
    const newDays = checked
      ? [...currentDays, day].sort((a, b) => b - a)
      : currentDays.filter(d => d !== day);
    await updateSettings({ notify_days_before: newDays });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push-varsler
        </CardTitle>
        <CardDescription>
          Motta varsler om frister, tildelinger og statusendringer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push notification toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Aktiver push-varsler</Label>
            <p className="text-sm text-muted-foreground">
              {!isSupported
                ? "Push-varsler støttes ikke i denne nettleseren"
                : permission === "denied"
                ? "Varsler er blokkert i nettleseren"
                : isSubscribed
                ? "Du mottar push-varsler"
                : "Slå på for å motta varsler"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSubscribed && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Aktiv
              </Badge>
            )}
            <Button
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              onClick={handleTogglePush}
              disabled={!isSupported || permission === "denied" || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Deaktiver
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Aktiver
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notification type settings */}
        {settings && (
          <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Varseltyper</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="notify-deadlines">Fristvarsler</Label>
                </div>
                <Switch
                  id="notify-deadlines"
                  checked={settings.notify_deadlines}
                  onCheckedChange={(checked) => handleToggleSetting("notify_deadlines", checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="notify-assignments">Tildelinger</Label>
                </div>
                <Switch
                  id="notify-assignments"
                  checked={settings.notify_assignments}
                  onCheckedChange={(checked) => handleToggleSetting("notify_assignments", checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="notify-status">Statusendringer</Label>
                </div>
                <Switch
                  id="notify-status"
                  checked={settings.notify_status_changes}
                  onCheckedChange={(checked) => handleToggleSetting("notify_status_changes", checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>

            {/* Deadline reminder timing */}
            {settings.notify_deadlines && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Påminnelse før frist</h4>
                <div className="flex flex-wrap gap-3">
                  {DAYS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`days-${option.value}`}
                        checked={settings.notify_days_before?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleDaysChange(option.value, !!checked)}
                        disabled={isUpdating}
                      />
                      <Label htmlFor={`days-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
