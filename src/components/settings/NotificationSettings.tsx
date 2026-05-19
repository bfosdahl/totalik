import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Save, ArrowLeft, Loader2, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NotificationSettingsCard } from "@/components/notifications/NotificationSettingsCard";

interface NotificationSettingsProps {
  onBack: () => void;
}

interface NotificationSettings {
  deviation_assignment_enabled: boolean;
  deviation_deadline_reminder_enabled: boolean;
  deviation_deadline_days_before: number[];
  course_expiry_enabled: boolean;
  course_expiry_days_before: number[];
  hms_card_expiry_enabled: boolean;
  hms_card_expiry_days_before: number[];
  notify_company_admin: boolean;
  notify_hms_responsible: boolean;
  notify_employee: boolean;
}

const DEVIATION_DEADLINE_OPTIONS = [
  { value: 7, label: "7 dager før" },
  { value: 3, label: "3 dager før" },
  { value: 1, label: "1 dag før" },
];

const COURSE_EXPIRY_OPTIONS = [
  { value: 30, label: "30 dager før" },
  { value: 7, label: "7 dager før" },
];

const HMS_CARD_EXPIRY_OPTIONS = [
  { value: 90, label: "90 dager før" },
  { value: 60, label: "60 dager før" },
  { value: 30, label: "30 dager før" },
  { value: 7, label: "7 dager før" },
];

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { company, user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    deviation_assignment_enabled: true,
    deviation_deadline_reminder_enabled: true,
    deviation_deadline_days_before: [7, 3, 1],
    course_expiry_enabled: true,
    course_expiry_days_before: [30, 7],
    hms_card_expiry_enabled: true,
    hms_card_expiry_days_before: [90, 60, 30, 7],
    notify_company_admin: true,
    notify_hms_responsible: true,
    notify_employee: true,
  });

  useEffect(() => {
    loadSettings();
  }, [company?.id]);

  const loadSettings = async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_notification_settings")
        .select("*")
        .eq("company_id", company.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No settings found, create default
          await createDefaultSettings();
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({
          deviation_assignment_enabled: data.deviation_assignment_enabled,
          deviation_deadline_reminder_enabled: data.deviation_deadline_reminder_enabled,
          deviation_deadline_days_before: data.deviation_deadline_days_before,
          course_expiry_enabled: data.course_expiry_enabled,
          course_expiry_days_before: data.course_expiry_days_before,
          hms_card_expiry_enabled: data.hms_card_expiry_enabled,
          hms_card_expiry_days_before: data.hms_card_expiry_days_before,
          notify_company_admin: data.notify_company_admin,
          notify_hms_responsible: data.notify_hms_responsible,
          notify_employee: data.notify_employee,
        });
      }
    } catch (error: any) {
      console.error("Error loading notification settings:", error);
      toast.error("Kunne ikke laste varslingsinnstillinger");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!company?.id) return;

    try {
      const { error } = await supabase
        .from("company_notification_settings")
        .insert({
          company_id: company.id,
          ...settings,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error creating default settings:", error);
      toast.error("Kunne ikke opprette standardinnstillinger");
    }
  };

  const handleSave = async () => {
    if (!company?.id) {
      toast.error("Ingen bedrift funnet");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_notification_settings")
        .upsert({
          company_id: company.id,
          ...settings,
        });

      if (error) throw error;

      toast.success("Varslingsinnstillinger oppdatert!");
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      toast.error(error.message || "Kunne ikke oppdatere varslingsinnstillinger");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!company?.id || !profile?.email) {
      toast.error("Kunne ikke finne mottaker for test-e-post");
      return;
    }

    setSendingTest(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Ikke innlogget");
      }

      const response = await supabase.functions.invoke("send-test-notification", {
        body: {
          recipient_emails: [profile.email],
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (result.success) {
        toast.success(`Test-e-post sendt til ${profile.email}`);
      } else {
        toast.error("Kunne ikke sende test-e-post");
      }
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      toast.error(error.message || "Kunne ikke sende test-e-post");
    } finally {
      setSendingTest(false);
    }
  };

  const toggleDaysBefore = (
    type: "deviation_deadline_days_before" | "course_expiry_days_before" | "hms_card_expiry_days_before",
    day: number
  ) => {
    setSettings((prev) => {
      const current = prev[type];
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => b - a);
      return { ...prev, [type]: updated };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Varsler</h1>
            <p className="text-muted-foreground">
              Konfigurer e-postvarsler og påminnelser
            </p>
          </div>
        </div>
      </motion.div>

      {/* Push Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <NotificationSettingsCard />
      </motion.div>

      {/* Email Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        {/* Deviation Notifications */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Avviksvarsler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Varsle ved tildeling av avvik</Label>
                <p className="text-sm text-muted-foreground">
                  Send e-post når et avvik tildeles en ansatt
                </p>
              </div>
              <Switch
                checked={settings.deviation_assignment_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, deviation_assignment_enabled: checked }))
                }
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Påminnelser om frister</Label>
                  <p className="text-sm text-muted-foreground">
                    Send automatiske påminnelser når avvik nærmer seg forfallsdato
                  </p>
                </div>
                <Switch
                  checked={settings.deviation_deadline_reminder_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, deviation_deadline_reminder_enabled: checked }))
                  }
                />
              </div>

              {settings.deviation_deadline_reminder_enabled && (
                <div className="space-y-2 ml-6">
                  <Label className="text-sm">Send påminnelse:</Label>
                  <div className="space-y-2">
                    {DEVIATION_DEADLINE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`deviation-${option.value}`}
                          checked={settings.deviation_deadline_days_before.includes(option.value)}
                          onCheckedChange={() =>
                            toggleDaysBefore("deviation_deadline_days_before", option.value)
                          }
                        />
                        <label
                          htmlFor={`deviation-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Expiry Notifications */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Kursvarsler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Varsle ved kursets utløp</Label>
                <p className="text-sm text-muted-foreground">
                  Send e-post når kurs nærmer seg utløpsdato
                </p>
              </div>
              <Switch
                checked={settings.course_expiry_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, course_expiry_enabled: checked }))
                }
              />
            </div>

            {settings.course_expiry_enabled && (
              <div className="space-y-2 ml-6 pt-2">
                <Label className="text-sm">Send varsel:</Label>
                <div className="space-y-2">
                  {COURSE_EXPIRY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${option.value}`}
                        checked={settings.course_expiry_days_before.includes(option.value)}
                        onCheckedChange={() => toggleDaysBefore("course_expiry_days_before", option.value)}
                      />
                      <label
                        htmlFor={`course-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HMS Card Expiry Notifications */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">HMS-kort varsler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Varsle ved HMS-kort utløp</Label>
                <p className="text-sm text-muted-foreground">
                  Send e-post når HMS-kort nærmer seg utløpsdato
                </p>
              </div>
              <Switch
                checked={settings.hms_card_expiry_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, hms_card_expiry_enabled: checked }))
                }
              />
            </div>

            {settings.hms_card_expiry_enabled && (
              <div className="space-y-2 ml-6 pt-2">
                <Label className="text-sm">Send varsel:</Label>
                <div className="space-y-2">
                  {HMS_CARD_EXPIRY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hms-${option.value}`}
                        checked={settings.hms_card_expiry_days_before.includes(option.value)}
                        onCheckedChange={() =>
                          toggleDaysBefore("hms_card_expiry_days_before", option.value)
                        }
                      />
                      <label
                        htmlFor={`hms-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Varsle følgende personer</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bedriftsadministrator</Label>
                <p className="text-sm text-muted-foreground">
                  Send varsler til alle bedriftsadministratorer
                </p>
              </div>
              <Switch
                checked={settings.notify_company_admin}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, notify_company_admin: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>HMS-ansvarlig</Label>
                <p className="text-sm text-muted-foreground">
                  Send varsler til HMS-ansvarlig
                </p>
              </div>
              <Switch
                checked={settings.notify_hms_responsible}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, notify_hms_responsible: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Den ansatte</Label>
                <p className="text-sm text-muted-foreground">
                  Send varsler direkte til den berørte ansatte
                </p>
              </div>
              <Switch
                checked={settings.notify_employee}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, notify_employee: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Test and Save Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleSendTestNotification} 
            disabled={sendingTest || !profile?.email}
          >
            {sendingTest ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sender...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send test-e-post
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lagre innstillinger
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}