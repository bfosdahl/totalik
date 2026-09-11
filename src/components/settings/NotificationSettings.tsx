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
import { t } from "@/i18n/t";

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
  shift_reminder_enabled: boolean;
  shift_reminder_time: string;
  shift_reminder_evening_enabled: boolean;
  shift_reminder_evening_time: string;
}

const DEVIATION_DEADLINE_OPTIONS = [
  { value: 7, label: t("auto.7_dager_foer") },
  { value: 3, label: t("auto.3_dager_foer") },
  { value: 1, label: t("auto.1_dag_foer") },
];

const COURSE_EXPIRY_OPTIONS = [
  { value: 30, label: t("auto.30_dager_foer") },
  { value: 7, label: t("auto.7_dager_foer") },
];

const HMS_CARD_EXPIRY_OPTIONS = [
  { value: 90, label: t("auto.90_dager_foer") },
  { value: 60, label: t("auto.60_dager_foer") },
  { value: 30, label: t("auto.30_dager_foer") },
  { value: 7, label: t("auto.7_dager_foer") },
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
    shift_reminder_enabled: true,
    shift_reminder_time: "06:00",
    shift_reminder_evening_enabled: false,
    shift_reminder_evening_time: "19:00",
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
          shift_reminder_enabled: data.shift_reminder_enabled ?? true,
          shift_reminder_time: String(data.shift_reminder_time ?? "06:00").slice(0, 5),
          shift_reminder_evening_enabled: data.shift_reminder_evening_enabled ?? false,
          shift_reminder_evening_time: String(data.shift_reminder_evening_time ?? "19:00").slice(0, 5),
        });
      }
    } catch (error: any) {
      console.error("Error loading notification settings:", error);
      toast.error(t("auto.kunne_ikke_laste_varslingsinnstillinger"));
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
      toast.error(t("auto.kunne_ikke_opprette_standardinnstillinge"));
    }
  };

  const handleSave = async () => {
    if (!company?.id) {
      toast.error(t("auto.ingen_bedrift_funnet"));
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

      toast.success(t("auto.varslingsinnstillinger_oppdatert"));
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      toast.error(error.message || "Kunne ikke oppdatere varslingsinnstillinger");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!company?.id || !profile?.email) {
      toast.error(t("auto.kunne_ikke_finne_mottaker_for_test_e_pos"));
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
        toast.error(t("auto.kunne_ikke_sende_test_e_post"));
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auto.varsler")}</h1>
            <p className="text-muted-foreground">
              {t("auto.konfigurer_e_postvarsler_og_paaminnelser")}
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

      {/* Shift reminders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Påminnelser om arbeidsplan</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Påminnelse samme morgen</Label>
                <p className="text-sm text-muted-foreground">
                  Ansatte med vakt får varsel på telefonen og e-post med tid, sted og prosjekt.
                </p>
              </div>
              <Switch
                checked={settings.shift_reminder_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, shift_reminder_enabled: checked }))
                }
              />
            </div>

            {settings.shift_reminder_enabled && (
              <div className="ml-0 sm:ml-6 space-y-2">
                <Label className="text-sm">Sendes klokken</Label>
                <select
                  className="w-full sm:w-40 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settings.shift_reminder_time}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, shift_reminder_time: e.target.value }))
                  }
                >
                  {["04:00", "05:00", "06:00", "07:00", "08:00"].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="space-y-0.5">
                <Label>Påminnelse kvelden før</Label>
                <p className="text-sm text-muted-foreground">
                  Ekstra varsel dagen før, slik at ansatte kan planlegge morgendagen.
                </p>
              </div>
              <Switch
                checked={settings.shift_reminder_evening_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, shift_reminder_evening_enabled: checked }))
                }
              />
            </div>

            {settings.shift_reminder_evening_enabled && (
              <div className="ml-0 sm:ml-6 space-y-2">
                <Label className="text-sm">Sendes klokken</Label>
                <select
                  className="w-full sm:w-40 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settings.shift_reminder_evening_time}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, shift_reminder_evening_time: e.target.value }))
                  }
                >
                  {["17:00", "18:00", "19:00", "20:00", "21:00"].map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
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
          <h3 className="text-lg font-semibold mb-4">{t("auto.avviksvarsler")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("auto.varsle_ved_tildeling_av_avvik")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_e_post_naar_et_avvik_tildeles_en_an")}
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
                  <Label>{t("auto.paaminnelser_om_frister")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("auto.send_automatiske_paaminnelser_naar_avvik")}
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
                  <Label className="text-sm">{t("auto.send_paaminnelse")}</Label>
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
          <h3 className="text-lg font-semibold mb-4">{t("auto.kursvarsler")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("auto.varsle_ved_kursets_utloep")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_e_post_naar_kurs_naermer_seg_utloep")}
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
                <Label className="text-sm">{t("auto.send_varsel")}</Label>
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
          <h3 className="text-lg font-semibold mb-4">{t("auto.hms_kort_varsler")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("auto.varsle_ved_hms_kort_utloep")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_e_post_naar_hms_kort_naermer_seg_ut")}
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
                <Label className="text-sm">{t("auto.send_varsel")}</Label>
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
          <h3 className="text-lg font-semibold mb-4">{t("auto.varsle_foelgende_personer")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("auto.bedriftsadministrator")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_varsler_til_alle_bedriftsadministra")}
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
                <Label>{t("auto.hms_ansvarlig")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_varsler_til_hms_ansvarlig")}
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
                <Label>{t("auto.den_ansatte")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("auto.send_varsler_direkte_til_den_beroerte_an")}
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
                {t("auto.send_test_e_post")}
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
                {t("auto.lagre_innstillinger")}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}