import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Clock, FolderOpen, FileText, Plus, Trash2, Building2, Zap, Save, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeInput24 } from "@/components/ui/time-input-24";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAllowanceTypes, ALLOWANCE_UNIT_LABELS } from "@/hooks/useAllowanceTypes";
import { useMaterialTypes, MATERIAL_UNITS, MATERIAL_UNIT_LABELS, MaterialUnit } from "@/hooks/useMaterialTypes";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { CreateTimeEntry, HourType, TimeEntryAllowanceInput, TimeEntryMaterialInput } from "@/hooks/useTimeEntries";
import { useTimeEntryPrefs } from "@/hooks/useTimeEntryPrefs";
import { OvertimeSegmentsEditor, SegmentSummary, OvertimeSegment, computeSegmentBreakdown } from "./OvertimeSegments";
import { t } from "@/i18n/t";

interface NewTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: CreateTimeEntry) => Promise<boolean>;
  defaultProjectId?: string;
  draftSavedAt?: number;
}

interface AllowanceRow {
  id: string;
  typeId: string;
  quantity: string;
  notes: string;
}

interface MaterialRow {
  id: string;
  typeId: string; // "" = fritekst
  name: string;
  unit: string;
  quantity: string;
}

const HOUR_TYPE_OPTIONS: { value: HourType; label: string; hint: string }[] = [
  { value: "normal", label: t("auto.normal"), hint: "Vanlige timer" },
  { value: "overtime_50", label: "50%", hint: "Overtid 50%" },
  { value: "overtime_100", label: "100%", hint: "Overtid 100%" },
];

const calcHoursBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  let diff = (th * 60 + tm) - (fh * 60 + fm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
};

export function NewTimeEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultProjectId,
  draftSavedAt,
}: NewTimeEntryDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hours, setHours] = useState("");
  const [hourType, setHourType] = useState<HourType>("normal");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");
  const [customProjectName, setCustomProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [subproject, setSubproject] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomProject, setUseCustomProject] = useState(false);
  const [allowanceRows, setAllowanceRows] = useState<AllowanceRow[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [overtimeSegments, setOvertimeSegments] = useState<OvertimeSegment[]>([]);
  const [onBehalfUserId, setOnBehalfUserId] = useState<string>("__self__");

  const { user, profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const canRegisterForOthers = isCompanyAdmin || isSystemAdmin;
  const { users: companyUsers, getUserDisplayName } = useCompanyUsers();

  const { projects } = useKsModule2Projects();
  const { hasModule } = useCompanyModules();
  const hasKsBygg = hasModule("IK_BYGG");
  const { types: allowanceTypes } = useAllowanceTypes({ onlyActive: true });
  const { types: materialTypes } = useMaterialTypes({ onlyActive: true });

  const {
    prefs,
    remember,
    sortByUsage,
    usageCount,
    suggestionsFor,
    sortMaterialsByUsage,
    sortAllowancesByUsage,
  } = useTimeEntryPrefs();
  const sortedAllowanceTypes = useMemo(
    () => sortAllowancesByUsage(allowanceTypes),
    [allowanceTypes, sortAllowancesByUsage]
  );
  const sortedMaterialTypes = useMemo(
    () => sortMaterialsByUsage(materialTypes),
    [materialTypes, sortMaterialsByUsage]
  );

  const activeProjects = useMemo(
    () => sortByUsage(projects.filter((p) => p.status !== "completed" && p.status !== "handover")),
    [projects, sortByUsage]
  );

  const descriptionSuggestions = useMemo(
    () =>
      suggestionsFor(
        selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none"
          ? selectedProjectId
          : customProjectName
      ),
    [suggestionsFor, selectedProjectId, customProjectName]
  );

  const applyTimes = (from: string, to: string) => {
    setStartTime(from);
    setEndTime(to);
    const diff = calcHoursBetween(from, to);
    if (diff > 0) setHours(diff.toFixed(2));
  };

  // Auto-fill customer when project changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none") {
      const p = projects.find((p) => p.id === selectedProjectId);
      if (p?.client_name) setCustomerName(p.client_name);
    }
  }, [selectedProjectId, projects]);

  // Reset kun når dialogen ÅPNES (transisjon false→true).
  // Tidligere lå `defaultProjectId` i deps, som førte til at datoen ble
  // resatt til i dag hvis parent-komponenten re-rendret mens dialogen var
  // åpen — det er hovedårsaken til at "føring tilbake i tid" havnet på i dag.
  useEffect(() => {
    if (!open) return;
    setDate(new Date());
    // Forhåndsfyll med brukerens vanlige valg (lagret lokalt)
    setStartTime(prefs.lastStartTime || "");
    setEndTime(prefs.lastEndTime || "");
    setHours(
      prefs.lastStartTime && prefs.lastEndTime
        ? (calcHoursBetween(prefs.lastStartTime, prefs.lastEndTime) || 0).toFixed(2)
        : String(standardHours)
    );
    setHourType(((prefs.lastHourType as HourType) || "normal") as HourType);
    const remembered =
      prefs.lastProjectId && projects.some((p) => p.id === prefs.lastProjectId)
        ? prefs.lastProjectId
        : "";
    setSelectedProjectId(defaultProjectId || remembered || "");
    setCustomProjectName(defaultProjectId || remembered ? "" : prefs.lastCustomProjectName || "");
    setCustomerName(prefs.lastCustomerName || "");
    setDescription("");
    setUseCustomProject(false);
    setAllowanceRows([]);
    setMaterialRows([]);
    setOvertimeSegments([]);
    setProjectNumber("");
    setSubproject("");
    setTagsInput("");
    setOnBehalfUserId("__self__");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      toast.error("Fyll inn antall timer (mellom 0 og 24) før du registrerer.");
      return;
    }

    let projectName: string | undefined;
    let projectId: string | undefined;
    let ksProjectId: string | undefined;
    let resolvedProjectNumber = projectNumber.trim();
    const tagList = tagsInput
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (hasKsBygg && selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none") {
      const selectedProject = projects.find((p) => p.id === selectedProjectId);
      if (selectedProject) {
        projectName = `${selectedProject.project_number} - ${selectedProject.project_name}`;
        projectId = selectedProject.id;
        ksProjectId = selectedProject.id;
        if (!projectNumber) resolvedProjectNumber = selectedProject.project_number || "";
      }
    } else if (useCustomProject && customProjectName) {
      projectName = customProjectName;
    }

    // Påkrevd prosjekt: enten KS-prosjekt eller fritekst-prosjekt
    if (!projectName) {
      toast.error(t("auto.du_maa_velge_et_prosjekt"), {
        description: t("auto.velg_et_aktivt_ks_prosjekt_eller_skriv_i"),
      });
      return;
    }

    // Build allowances
    const allowances: TimeEntryAllowanceInput[] = allowanceRows
      .map<TimeEntryAllowanceInput | null>((r) => {
        const t = allowanceTypes.find((x) => x.id === r.typeId);
        const qty = parseFloat(r.quantity);
        if (!t || isNaN(qty) || qty <= 0) return null;
        return {
          allowance_type_id: t.id,
          type_name: t.name,
          unit: t.unit,
          quantity: qty,
          rate_snapshot: Number(t.rate),
          amount: Number((qty * Number(t.rate)).toFixed(2)),
          notes: r.notes || null,
        };
      })
      .filter((x): x is TimeEntryAllowanceInput => x !== null);

    // Build materialforbruk
    const materials: TimeEntryMaterialInput[] = materialRows
      .map<TimeEntryMaterialInput | null>((r) => {
        const mt = materialTypes.find((x) => x.id === r.typeId);
        const name = (mt?.name ?? r.name).trim();
        const qty = parseFloat(r.quantity);
        if (!name || isNaN(qty) || qty <= 0) return null;
        return {
          material_type_id: mt?.id ?? null,
          name,
          unit: r.unit || mt?.unit || "stk",
          quantity: qty,
          unit_price: Number(mt?.unit_price ?? 0),
        };
      })
      .filter((x): x is TimeEntryMaterialInput => x !== null);

    setIsSubmitting(true);

    // Admin: on behalf of another user?
    let onBehalfId: string | null = null;
    let onBehalfName: string | null = null;
    if (canRegisterForOthers && onBehalfUserId && onBehalfUserId !== "__self__") {
      const u = companyUsers.find((x) => x.user_id === onBehalfUserId);
      if (u) {
        onBehalfId = u.user_id;
        onBehalfName = getUserDisplayName(u);
      }
    }

    // Hvis brukeren har lagt inn overtid-segmenter: lagre som ÉN føring med
    // totale timer + segmenter i jsonb. Da beholdes fra-til, og aggregeringer
    // (lønn/oversikt/eksport) splitter automatisk via getHourBreakdown().
    if (overtimeSegments.length > 0) {
      const breakdown = computeSegmentBreakdown(hoursNum, overtimeSegments);
      const ot50 = Math.round(breakdown.overtime_50 * 100) / 100;
      const ot100 = Math.round(breakdown.overtime_100 * 100) / 100;
      const normal = Math.round(breakdown.normal * 100) / 100;

      if (ot50 + ot100 > hoursNum + 0.001) {
        toast.error(t("auto.overtid_overstiger_totalt_antall_timer"));
        setIsSubmitting(false);
        return;
      }

      const persistSegments = overtimeSegments.map((s) => ({
        start: s.start,
        end: s.end,
        rate: s.rate,
        hours: Math.max(0, calcHoursBetween(s.start, s.end)),
      }));

      // Setter hoved-hour_type slik at "er dette en overtidsføring"-flagg
      // fortsatt fungerer. Selve fordelingen leses fra overtime_segments.
      const primaryHourType: HourType =
        normal > 0 ? "normal" : ot100 > 0 ? "overtime_100" : "overtime_50";

      const ok = await onSubmit({
        entry_date: format(date, "yyyy-MM-dd"),
        hours: hoursNum,
        start_time: startTime || null,
        end_time: endTime || null,
        hour_type: primaryHourType,
        project_name: projectName,
        project_id: projectId,
        ks_project_id: ksProjectId || null,
        customer_name: customerName || null,
        project_number: resolvedProjectNumber || null,
        subproject: subproject.trim() || null,
        tags: tagList.length > 0 ? tagList : null,
        description: description || undefined,
        allowances,
        materials,
        overtime_segments: persistSegments,
        on_behalf_user_id: onBehalfId,
        on_behalf_user_name: onBehalfName,
      });

      if (ok) {
        rememberChoices();
        onOpenChange(false);
      }
      setIsSubmitting(false);
      return;
    }

    const success = await onSubmit({
      entry_date: format(date, "yyyy-MM-dd"),
      hours: hoursNum,
      start_time: startTime || null,
      end_time: endTime || null,
      hour_type: hourType,
      project_name: projectName,
      project_id: projectId,
      ks_project_id: ksProjectId || null,
      customer_name: customerName || null,
      description: description || undefined,
      allowances,
      materials,
      on_behalf_user_id: onBehalfId,
      on_behalf_user_name: onBehalfName,
    });

    if (success) {
      rememberChoices();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const rememberChoices = () => {
    const isKsProject =
      !!selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none";
    remember({
      projectId: isKsProject ? selectedProjectId : undefined,
      customProjectName: isKsProject ? undefined : customProjectName.trim() || undefined,
      customerName: customerName.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      hours: hours || undefined,
      hourType,
      description: description.trim() || undefined,
      materialTypeIds: materialRows.map((r) => r.typeId).filter(Boolean),
      allowanceTypeIds: allowanceRows.map((r) => r.typeId).filter(Boolean),
    });
  };

  const addMaterial = () => {
    const first = sortedMaterialTypes[0];
    setMaterialRows((rows) => [
      ...rows,
      {
        id: crypto.randomUUID(),
        typeId: first?.id ?? "",
        name: "",
        unit: first?.unit ?? "stk",
        quantity: "1",
      },
    ]);
  };

  const addAllowance = () => {
    if (allowanceTypes.length === 0) return;
    setAllowanceRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), typeId: sortedAllowanceTypes[0].id, quantity: "1", notes: "" },
    ]);
  };

  const totalAllowanceAmount = useMemo(() => {
    return allowanceRows.reduce((sum, r) => {
      const t = allowanceTypes.find((x) => x.id === r.typeId);
      const qty = parseFloat(r.quantity);
      if (!t || isNaN(qty)) return sum;
      return sum + qty * Number(t.rate);
    }, 0);
  }, [allowanceRows, allowanceTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("auto.registrer_timer")}</DialogTitle>
        </DialogHeader>

        {draftSavedAt && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700">
            <Save className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{t("auto.utkast_lagret")}</span>
            <span className="text-xs text-emerald-600/80 ml-auto">
              {format(new Date(draftSavedAt), "HH:mm", { locale: nb })}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin: Registrer for annen ansatt */}
          {canRegisterForOthers && companyUsers.length > 0 && (
            <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
              <Label className="text-xs uppercase tracking-wide text-primary">{t("auto.ansatt")}</Label>
              <Select value={onBehalfUserId} onValueChange={setOnBehalfUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg_ansatt")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__self__">{t("auto.meg_selv")}</SelectItem>
                  {companyUsers
                    .filter((u) => u.user_id !== user?.id)
                    .sort((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)))
                    .map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {getUserDisplayName(u)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {onBehalfUserId !== "__self__" && (
                <p className="text-[11px] text-muted-foreground">
                  {t("auto.timene_registreres_paa_valgt_ansatt_hand")}
                </p>
              )}
            </div>
          )}

          {/* Prosjekt */}
          <div className="space-y-2">
            <Label>{t("auto.prosjekt")} <span className="text-destructive">*</span></Label>
            {hasKsBygg && activeProjects.length > 0 ? (
              <>
                <Select
                  value={selectedProjectId}
                  onValueChange={(v) => {
                    setSelectedProjectId(v);
                    setUseCustomProject(v === "custom");
                    if (v === "custom") setCustomProjectName("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={t("auto.velg_prosjekt_paakrevd")} /></SelectTrigger>
                  <SelectContent>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {project.project_number}
                        </span>
                        {project.project_name}
                        {project.client_name ? ` — ${project.client_name}` : ""}
                        {usageCount(project.id) > 0 && (
                          <span className="ml-2 text-[10px] text-muted-foreground">★ ofte brukt</span>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t("auto.annet_fritekst")}</SelectItem>
                  </SelectContent>
                </Select>

                {useCustomProject && (
                  <div className="relative mt-2">
                    <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t("auto.skriv_inn_prosjektnavn")}
                      value={customProjectName}
                      onChange={(e) => setCustomProjectName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("auto.f_eks_kundeprosjekt_a")}
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {/* Kunde */}
          <div className="space-y-2">
            <Label>{t("auto.kunde")}</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("auto.kundenavn")}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10"
              />
            </div>
            {prefs.customers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prefs.customers.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomerName(c)}
                    className="text-xs rounded-full border px-2 py-1 hover:bg-muted"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prosjektnummer, underprosjekt og tagger */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Prosjektnummer</Label>
              <Input
                placeholder="Hentes fra prosjektet"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Underprosjekt</Label>
              <Input
                placeholder="Valgfritt"
                value={subproject}
                onChange={(e) => setSubproject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagger</Label>
              <Input
                placeholder="Skill med komma"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>



          {/* Dato */}
          <div className="space-y-2">
            <Label>{t("auto.dato")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: nb }) : "Velg dato"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} locale={nb} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hurtigvalg */}
          <div className="flex flex-wrap gap-2">
            {prefs.lastStartTime && prefs.lastEndTime && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyTimes(prefs.lastStartTime!, prefs.lastEndTime!)}
              >
                Vanlig dag {prefs.lastStartTime}–{prefs.lastEndTime}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => applyTimes("07:00", "15:00")}>
              07:00–15:00
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setHours(String(standardHours));
                setStartTime("");
                setEndTime("");
              }}
            >
              {String(standardHours).replace(".", ",")} timer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                applyTimes("07:00", "15:00");
                setHourType("normal");
                if (!description.trim()) setDescription("Reisedag");
              }}
            >
              Reisedag
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                applyTimes("16:00", "20:00");
                setHourType("overtime_50" as HourType);
              }}
            >
              Overtid kveld
            </Button>
          </div>

          {/* Tid fra-til + total timer */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t("auto.fra")}</Label>
              <TimeInput24
                value={startTime}
                onChange={(v) => {
                  setStartTime(v);
                  if (v && endTime) {
                    const diff = calcHoursBetween(v, endTime);
                    if (diff > 0) setHours(diff.toFixed(2));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.til")}</Label>
              <TimeInput24
                value={endTime}
                onChange={(v) => {
                  setEndTime(v);
                  if (startTime && v) {
                    const diff = calcHoursBetween(startTime, v);
                    if (diff > 0) setHours(diff.toFixed(2));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.timer")}</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder={String(standardHours)}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Timetype – kun aktiv når ingen overtid-segmenter er definert */}
          {overtimeSegments.length === 0 && (
            <div className="space-y-2">
              <Label>{t("auto.timetype")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {HOUR_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setHourType(opt.value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition-colors",
                      hourType === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-muted"
                    )}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className={cn("text-[10px]", hourType === opt.value ? "opacity-90" : "text-muted-foreground")}>
                      {opt.hint}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("auto.eller_spesifiser_overtid_som_intervaller")}
              </p>
            </div>
          )}

          {/* Overtid-segmenter i samme føring */}
          <OvertimeSegmentsEditor
            segments={overtimeSegments}
            onChange={setOvertimeSegments}
            mainStart={startTime}
            mainEnd={endTime}
          />
          {overtimeSegments.length > 0 && parseFloat(hours) > 0 && (
            <SegmentSummary totalHours={parseFloat(hours) || 0} segments={overtimeSegments} />
          )}

          {/* Beskrivelse */}
          <div className="space-y-2">
            <Label>{t("auto.beskrivelse")}</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder={t("auto.hva_jobbet_du_med")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10 min-h-[60px]"
              />
            </div>
            {descriptionSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {descriptionSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDescription(s)}
                    className="rounded-full border border-input px-3 py-1 text-xs hover:bg-muted"
                  >
                    {s.length > 40 ? `${s.slice(0, 40)}…` : s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tillegg */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Tillegg
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllowance}
                disabled={allowanceTypes.length === 0}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> {t("auto.legg_til")}
              </Button>
            </div>

            {allowanceTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("auto.ingen_tilleggssatser_definert_bedriftsad")}
              </p>
            )}

            {allowanceRows.map((row) => {
              const t = allowanceTypes.find((x) => x.id === row.typeId);
              const qty = parseFloat(row.quantity);
              const amount = t && !isNaN(qty) ? qty * Number(t.rate) : 0;
              return (
                <div key={row.id} className="grid grid-cols-[1fr_80px_auto] gap-2 items-start bg-muted/30 p-2 rounded-md">
                  <Select
                    value={row.typeId}
                    onValueChange={(v) =>
                      setAllowanceRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, typeId: v } : r)))
                    }
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sortedAllowanceTypes.map((tt) => (
                        <SelectItem key={tt.id} value={tt.id}>
                          {tt.name} ({Number(tt.rate).toLocaleString("nb-NO")} kr/{ALLOWANCE_UNIT_LABELS[tt.unit]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.quantity}
                    onChange={(e) =>
                      setAllowanceRows((rows) =>
                        rows.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r))
                      )
                    }
                    className="h-9"
                    placeholder={t ? ALLOWANCE_UNIT_LABELS[t.unit] : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setAllowanceRows((rows) => rows.filter((r) => r.id !== row.id))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <div className="col-span-3 text-xs text-muted-foreground text-right">
                    = {amount.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr
                  </div>
                </div>
              );
            })}

            {allowanceRows.length > 0 && (
              <div className="flex justify-end">
                <Badge variant="secondary">
                  Sum tillegg: {totalAllowanceAmount.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr
                </Badge>
              </div>
            )}
          </div>

          {/* Materialforbruk */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Materialforbruk
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="gap-1">
                <Plus className="h-3 w-3" /> Legg til
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Valgfritt. Registrer materialer brukt denne dagen, f.eks. sveisetråd, kappeskiver, skruer eller gass.
            </p>

            {materialRows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_90px_auto] gap-2 items-start bg-muted/30 p-2 rounded-md">
                {materialTypes.length > 0 ? (
                  <Select
                    value={row.typeId || "__custom__"}
                    onValueChange={(v) =>
                      setMaterialRows((rows) =>
                        rows.map((r) => {
                          if (r.id !== row.id) return r;
                          if (v === "__custom__") return { ...r, typeId: "", name: "" };
                          const mt = materialTypes.find((x) => x.id === v);
                          return { ...r, typeId: v, name: mt?.name ?? "", unit: mt?.unit ?? r.unit };
                        })
                      )
                    }
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="Velg material" /></SelectTrigger>
                    <SelectContent>
                      {sortedMaterialTypes.map((mt) => (
                        <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Annet (skriv selv)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-9"
                    placeholder="F.eks. sveisetråd"
                    value={row.name}
                    onChange={(e) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
                    }
                  />
                )}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-9"
                  value={row.quantity}
                  onChange={(e) =>
                    setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setMaterialRows((rows) => rows.filter((r) => r.id !== row.id))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>

                {materialTypes.length > 0 && !row.typeId && (
                  <Input
                    className="h-9 col-span-3"
                    placeholder="Navn på material"
                    value={row.name}
                    onChange={(e) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
                    }
                  />
                )}

                <div className="col-span-3">
                  <Select
                    value={row.unit}
                    onValueChange={(v) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, unit: v } : r)))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u as MaterialUnit]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Lagrer..." : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
