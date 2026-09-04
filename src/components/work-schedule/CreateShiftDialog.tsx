import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useWorkSchedules } from "@/hooks/useWorkSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { LOCATIONS, ROLES } from "./shiftOptions";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertTriangle, Info } from "lucide-react";
import { checkSundayConflictForEmployee, type SundayStatus } from "@/utils/sundayComplianceCheck";
import { t } from "@/i18n/t";
import { supabase } from "@/integrations/supabase/client";

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: string;
  editShift?: {
    id: string;
    employee_id: string;
    employee_name: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    schedule_type: "planned" | "actual";
    location?: string | null;
    shift_role?: string | null;
    is_responsible?: boolean;
    notes?: string | null;
    project_id?: string | null;
    project_name?: string | null;
  };
}

export interface ShiftFormData {
  employee_id: string;
  employee_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: "planned" | "actual";
  location?: string;
  shift_role?: string;
  project_id?: string | null;
  project_name?: string;
  is_responsible: boolean;
  notes: string;
}

const CUSTOM = "__custom__";
const WEEKDAYS = [
  { value: 1, label: "Man" },
  { value: 2, label: "Tir" },
  { value: 3, label: "Ons" },
  { value: 4, label: "Tor" },
  { value: 5, label: "Fre" },
  { value: 6, label: "Lør" },
  { value: 0, label: "Søn" },
];

export function CreateShiftDialog({ open, onOpenChange, onSuccess, defaultDate, editShift }: CreateShiftDialogProps) {
  const { users } = useCompanyUsers();
  const { createSchedule, createSchedulesBulk, updateSchedule } = useWorkSchedules();
  const { profile } = useAuth();
  const { hasModule } = useCompanyModules();
  const hasBygg = hasModule("IK_BYGG");
  const [projects, setProjects] = useState<{ id: string; project_name: string; project_number: string | null }[]>([]);
  const [customLocation, setCustomLocation] = useState(false);
  const [customRole, setCustomRole] = useState(false);
  const [useRange, setUseRange] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  
  const isEditMode = !!editShift;
  
  const [formData, setFormData] = useState<ShiftFormData>({
    employee_id: "",
    employee_name: "",
    schedule_date: defaultDate || "",
    start_time: "07:00",
    end_time: "15:00",

    schedule_type: "planned",
    location: undefined,
    shift_role: undefined,
    project_id: null,
    project_name: "",
    is_responsible: false,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sundayWarning, setSundayWarning] = useState<{ status: SundayStatus; message: string } | null>(null);

  // Load KS Bygg projects when the module is active
  useEffect(() => {
    let cancelled = false;
    if (!open || !hasBygg || !profile?.company_id) return;
    supabase
      .from("ks_module2_projects")
      .select("id, project_name, project_number")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setProjects(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, hasBygg, profile?.company_id]);

  // AML §10-8 check whenever date + employee changes
  useEffect(() => {
    let cancelled = false;
    if (!profile?.company_id || !formData.employee_id || !formData.schedule_date) {
      setSundayWarning(null);
      return;
    }
    checkSundayConflictForEmployee({
      companyId: profile.company_id,
      employeeId: formData.employee_id,
      scheduleDate: formData.schedule_date,
    }).then((result) => {
      if (cancelled) return;
      if (result.message && (result.status === "risk" || result.status === "breach")) {
        setSundayWarning({ status: result.status, message: result.message });
      } else {
        setSundayWarning(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [formData.employee_id, formData.schedule_date, profile?.company_id]);

  useEffect(() => {
    if (editShift) {
      setFormData({
        employee_id: editShift.employee_id,
        employee_name: editShift.employee_name,
        schedule_date: editShift.schedule_date,
        start_time: editShift.start_time.substring(0, 5),
        end_time: editShift.end_time.substring(0, 5),
        schedule_type: editShift.schedule_type,
        location: editShift.location || undefined,
        shift_role: editShift.shift_role || undefined,
        project_id: editShift.project_id || null,
        project_name: editShift.project_name || "",
        is_responsible: editShift.is_responsible || false,
        notes: editShift.notes || "",
      });
      setCustomLocation(!!editShift.location && !LOCATIONS[editShift.location]);
      setCustomRole(!!editShift.shift_role && !ROLES[editShift.shift_role]);
      setUseRange(false);
    } else if (defaultDate) {
      setFormData(prev => ({ ...prev, schedule_date: defaultDate }));
    }
  }, [defaultDate, editShift]);

  const handleEmployeeChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setFormData({
        ...formData,
        employee_id: userId,
        employee_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Ukjent",
      });
    }
  };

  const buildDates = (): string[] => {
    if (!useRange || !endDate || endDate < formData.schedule_date) return [formData.schedule_date];
    const dates: string[] = [];
    const cursor = new Date(`${formData.schedule_date}T12:00:00`);
    const stop = new Date(`${endDate}T12:00:00`);
    while (cursor <= stop) {
      if (weekdays.includes(cursor.getDay())) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const base = {
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      schedule_type: formData.schedule_type,
      location: formData.location || undefined,
      shift_role: formData.shift_role || undefined,
      project_id: formData.project_id || null,
      project_name: formData.project_name?.trim() || null,
      is_responsible: formData.is_responsible,
      notes: formData.notes,
    };

    let result: boolean | number;
    if (isEditMode) {
      result = await updateSchedule(editShift!.id, { ...base, schedule_date: formData.schedule_date });
    } else {
      const dates = buildDates();
      if (dates.length === 0) {
        toast.error("Ingen dager i perioden. Velg minst én ukedag.");
        setIsSubmitting(false);
        return;
      }
      result =
        dates.length === 1
          ? await createSchedule({ ...base, schedule_date: dates[0] })
          : await createSchedulesBulk(dates.map((d) => ({ ...base, schedule_date: d })));
    }

    if (result) {
      setFormData({
        employee_id: "",
        employee_name: "",
        schedule_date: "",
        start_time: "07:00",
        end_time: "15:00",

        schedule_type: "planned",
        location: undefined,
        shift_role: undefined,
        project_id: null,
        project_name: "",
        is_responsible: false,
        notes: "",
      });
      setUseRange(false);
      setEndDate("");
      setCustomLocation(false);
      setCustomRole(false);
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{isEditMode ? "Endre vakt" : "Ny vakt"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Rediger vaktdetaljer" : "Opprett vakt med prosjekt, sted og rolle – for én dag eller en hel periode"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-4">
              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="employee">{t("auto.ansatt_2")}</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={handleEmployeeChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_ansatt")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="schedule_type">{t("auto.type")}</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(value: "planned" | "actual") => 
                    setFormData({ ...formData, schedule_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">{t("auto.planlagt")}</SelectItem>
                    <SelectItem value="actual">{t("auto.faktisk")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="schedule_date">{t("auto.dato_2")}</Label>
                <Input
                  id="schedule_date"
                  type="date"
                  required
                  value={formData.schedule_date}
                  onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                />
              </div>

              {/* Period / repeat */}
              {!isEditMode && (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use_range"
                      checked={useRange}
                      onCheckedChange={(checked) => setUseRange(checked as boolean)}
                    />
                    <Label htmlFor="use_range" className="cursor-pointer">
                      Planlegg for en periode (flere dager)
                    </Label>
                  </div>

                  {useRange && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="end_date">Til og med dato</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={endDate}
                          min={formData.schedule_date || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ukedager</Label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => {
                            const active = weekdays.includes(day.value);
                            return (
                              <Button
                                key={day.value}
                                type="button"
                                size="sm"
                                variant={active ? "default" : "outline"}
                                onClick={() =>
                                  setWeekdays((prev) =>
                                    active ? prev.filter((d) => d !== day.value) : [...prev, day.value]
                                  )
                                }
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Samme arbeidstid brukes på alle valgte dager i perioden.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sundayWarning && (
                <div
                  className={`flex gap-2 rounded-md border p-3 text-sm ${
                    sundayWarning.status === "breach"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-amber-400/40 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                  }`}
                >
                  {sundayWarning.status === "breach" ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{sundayWarning.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">{t("auto.fra_2")}</Label>
                  <Input
                    id="start_time"
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">{t("auto.til_2")}</Label>
                  <Input
                    id="end_time"
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label>Prosjekt</Label>
                {hasBygg && projects.length > 0 ? (
                  <Tabs
                    value={projectTab}
                    onValueChange={(v) => {
                      setProjectTab(v as "project" | "free");
                      setFormData((prev) => ({
                        ...prev,
                        project_id: null,
                        project_name: "",
                      }));
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="project">Velg prosjekt</TabsTrigger>
                      <TabsTrigger value="free">Fritekst</TabsTrigger>
                    </TabsList>

                    <TabsContent value="project" className="pt-2">
                      <Select
                        value={formData.project_id || "__none__"}
                        onValueChange={(value) => {
                          if (value === "__none__") {
                            setFormData({ ...formData, project_id: null, project_name: "" });
                            return;
                          }
                          const proj = projects.find((pr) => pr.id === value);
                          setFormData({
                            ...formData,
                            project_id: value,
                            project_name: proj
                              ? `${proj.project_number ? proj.project_number + " – " : ""}${proj.project_name}`
                              : "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg prosjekt" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Ingen valgt</SelectItem>
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.project_number ? `${proj.project_number} – ` : ""}
                              {proj.project_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    <TabsContent value="free" className="pt-2">
                      <Input
                        placeholder="F.eks. Service Nordvegen 12"
                        value={formData.project_name || ""}
                        onChange={(e) => setFormData({ ...formData, project_name: e.target.value, project_id: null })}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <>
                    <Input
                      placeholder="F.eks. Service Nordvegen 12 eller Oppdrag Kari Nordmann"
                      value={formData.project_name || ""}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value, project_id: null })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Skriv inn prosjekt eller oppdrag som fritekst.
                    </p>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t("auto.sted_omraade")}</Label>
                <Select
                  value={customLocation ? CUSTOM : formData.location || "__none__"}
                  onValueChange={(value) => {
                    if (value === CUSTOM) {
                      setCustomLocation(true);
                      setFormData({ ...formData, location: "" });
                      return;
                    }
                    setCustomLocation(false);
                    setFormData({ ...formData, location: value === "__none__" ? undefined : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_sted")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("auto.ingen_valgt")}</SelectItem>
                    {Object.entries(LOCATIONS).map(([key, loc]) => (
                      <SelectItem key={key} value={key}>
                        {loc.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM}>Annet (skriv selv)</SelectItem>
                  </SelectContent>
                </Select>
                {customLocation && (
                  <Input
                    placeholder="Skriv sted/område"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">{t("auto.rolle")}</Label>
                <Select
                  value={customRole ? CUSTOM : formData.shift_role || "__none__"}
                  onValueChange={(value) => {
                    if (value === CUSTOM) {
                      setCustomRole(true);
                      setFormData({ ...formData, shift_role: "" });
                      return;
                    }
                    setCustomRole(false);
                    setFormData({ ...formData, shift_role: value === "__none__" ? undefined : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_rolle")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("auto.ingen_valgt")}</SelectItem>
                    {Object.entries(ROLES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM}>Annet (skriv selv)</SelectItem>
                  </SelectContent>
                </Select>
                {customRole && (
                  <Input
                    placeholder="Skriv rolle/funksjon"
                    value={formData.shift_role || ""}
                    onChange={(e) => setFormData({ ...formData, shift_role: e.target.value })}
                  />
                )}
              </div>

              {/* Responsible */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_responsible"
                  checked={formData.is_responsible}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_responsible: checked as boolean })
                  }
                />
                <Label htmlFor="is_responsible" className="cursor-pointer">
                  Ansvarsvakt (har ansvar for driften denne vakten)
                </Label>
              </div>


              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t("auto.notater")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("auto.skriv_eventuelle_notater")}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Lagrer..." : "Lagre vakt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
