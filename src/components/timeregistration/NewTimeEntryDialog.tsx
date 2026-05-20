import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Clock, FolderOpen, FileText, Plus, Trash2, Building2, Zap, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAllowanceTypes, ALLOWANCE_UNIT_LABELS } from "@/hooks/useAllowanceTypes";
import { CreateTimeEntry, HourType, TimeEntryAllowanceInput } from "@/hooks/useTimeEntries";

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

const HOUR_TYPE_OPTIONS: { value: HourType; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "Vanlige timer" },
  { value: "overtime_50", label: "50%", hint: "Overtid 50%" },
  { value: "overtime_100", label: "100%", hint: "Overtid 100%" },
];

export function NewTimeEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultProjectId,
  draftSavedAt,
}: NewTimeEntryDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState("");
  const [hourType, setHourType] = useState<HourType>("normal");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");
  const [customProjectName, setCustomProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomProject, setUseCustomProject] = useState(false);
  const [allowanceRows, setAllowanceRows] = useState<AllowanceRow[]>([]);

  const { projects } = useKsModule2Projects();
  const { hasModule } = useCompanyModules();
  const hasKsBygg = hasModule("IK_BYGG");
  const { types: allowanceTypes } = useAllowanceTypes({ onlyActive: true });

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== "completed" && p.status !== "handover"),
    [projects]
  );

  // Auto-fill customer when project changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none") {
      const p = projects.find((p) => p.id === selectedProjectId);
      if (p?.client_name) setCustomerName(p.client_name);
    }
  }, [selectedProjectId, projects]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setDate(new Date());
      setHours("");
      setHourType("normal");
      setSelectedProjectId(defaultProjectId || "");
      setCustomProjectName("");
      setCustomerName("");
      setDescription("");
      setUseCustomProject(false);
      setAllowanceRows([]);
    }
  }, [open, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) return;

    let projectName: string | undefined;
    let projectId: string | undefined;
    let ksProjectId: string | undefined;

    if (hasKsBygg && selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none") {
      const selectedProject = projects.find((p) => p.id === selectedProjectId);
      if (selectedProject) {
        projectName = `${selectedProject.project_number} - ${selectedProject.project_name}`;
        projectId = selectedProject.id;
        ksProjectId = selectedProject.id;
      }
    } else if (useCustomProject && customProjectName) {
      projectName = customProjectName;
    }

    // Påkrevd prosjekt: enten KS-prosjekt eller fritekst-prosjekt
    if (!projectName) {
      toast.error("Du må velge et prosjekt", {
        description: "Velg et aktivt KS-prosjekt eller skriv inn et prosjektnavn under 'Annet'.",
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

    setIsSubmitting(true);
    const success = await onSubmit({
      entry_date: format(date, "yyyy-MM-dd"),
      hours: hoursNum,
      hour_type: hourType,
      project_name: projectName,
      project_id: projectId,
      ks_project_id: ksProjectId || null,
      customer_name: customerName || null,
      description: description || undefined,
      allowances,
    });

    if (success) onOpenChange(false);
    setIsSubmitting(false);
  };

  const addAllowance = () => {
    if (allowanceTypes.length === 0) return;
    setAllowanceRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), typeId: allowanceTypes[0].id, quantity: "1", notes: "" },
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
          <DialogTitle>Registrer timer</DialogTitle>
        </DialogHeader>

        {draftSavedAt && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700">
            <Save className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Utkast lagret</span>
            <span className="text-xs text-emerald-600/80 ml-auto">
              {format(new Date(draftSavedAt), "HH:mm", { locale: nb })}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prosjekt */}
          <div className="space-y-2">
            <Label>Prosjekt</Label>
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
                  <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen prosjekt</SelectItem>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {project.project_number}
                        </span>
                        {project.project_name}
                        {project.client_name ? ` — ${project.client_name}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Annet (fritekst)</SelectItem>
                  </SelectContent>
                </Select>
                {useCustomProject && (
                  <div className="relative mt-2">
                    <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Skriv inn prosjektnavn"
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
                  placeholder="F.eks. Kundeprosjekt A"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {/* Kunde */}
          <div className="space-y-2">
            <Label>Kunde</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kundenavn"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Dato + Timer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dato</Label>
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
            <div className="space-y-2">
              <Label>Timer</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="7.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Timetype */}
          <div className="space-y-2">
            <Label>Timetype</Label>
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
          </div>

          {/* Beskrivelse */}
          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder="Hva jobbet du med?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10 min-h-[60px]"
              />
            </div>
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
                <Plus className="h-3 w-3" /> Legg til
              </Button>
            </div>

            {allowanceTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ingen tilleggssatser definert. Bedriftsadmin kan opprette satser under Innstillinger → Lønn & tilleggssatser.
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
                      {allowanceTypes.map((tt) => (
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

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Avbryt
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
