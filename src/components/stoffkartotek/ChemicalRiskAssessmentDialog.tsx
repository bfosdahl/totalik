import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Shield,
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  BarChart3,
} from "lucide-react";
import { CompanyChemicalEntry } from "@/hooks/useGlobalChemicalRegistry";
import {
  useChemicalRiskAssessment,
  useChemicalRiskAssessmentMutations,
  calculateChemicalRiskLevel,
  WorkTask,
  ProtectiveMeasure,
} from "@/hooks/useChemicalRiskAssessment";
import { cn } from "@/lib/utils";

interface ChemicalRiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chemicalEntry: CompanyChemicalEntry;
  projectId: string;
}

const EXPOSURE_TYPES = [
  { value: "innånding", label: "Innånding", description: "Gasser, damper, støv" },
  { value: "hudkontakt", label: "Hudkontakt", description: "Direkte eller sprut" },
  { value: "svelging", label: "Svelging", description: "Forurensede hender, mat" },
  { value: "øyekontakt", label: "Øyekontakt", description: "Sprut, damp" },
];

const EXPOSURE_LEVELS = [
  { value: "lav", label: "Lav", description: "Minimal eksponering, godt ventilert" },
  { value: "middels", label: "Middels", description: "Periodisk eksponering" },
  { value: "høy", label: "Høy", description: "Hyppig/langvarig eksponering" },
];

const EXPOSURE_DURATIONS = [
  { value: "kort", label: "Kort (<15 min/dag)" },
  { value: "periodisk", label: "Periodisk (15 min - 4 timer/dag)" },
  { value: "langvarig", label: "Langvarig (>4 timer/dag)" },
];

const SEVERITY_LEVELS = [
  { value: 1, label: "1 - Ubetydelig", description: "Ingen/minimal helseeffekt" },
  { value: 2, label: "2 - Mindre", description: "Mild irritasjon, forbigående" },
  { value: 3, label: "3 - Moderat", description: "Betydelig irritasjon, behandling nødvendig" },
  { value: 4, label: "4 - Alvorlig", description: "Kroniske effekter, sykehusinnleggelse" },
  { value: 5, label: "5 - Kritisk", description: "Livsfarlig, varig skade" },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: "1 - Svært lite", description: "Sjeldnere enn hvert 10. år" },
  { value: 2, label: "2 - Lite", description: "Hvert 5-10 år" },
  { value: 3, label: "3 - Mulig", description: "Hvert 1-5 år" },
  { value: 4, label: "4 - Sannsynlig", description: "1-10 ganger årlig" },
  { value: 5, label: "5 - Svært sannsynlig", description: "Mer enn 10 ganger årlig" },
];

const PPE_OPTIONS = [
  "Vernebriller",
  "Ansiktsskjerm",
  "Kjemikalieresistente hansker",
  "Åndedrettsvern",
  "Verneforkle/drakt",
  "Vernestøvler",
];

export const ChemicalRiskAssessmentDialog = ({
  open,
  onOpenChange,
  chemicalEntry,
  projectId,
}: ChemicalRiskAssessmentDialogProps) => {
  const chemical = chemicalEntry.global_chemical;
  const [activeTab, setActiveTab] = useState("phase1");

  const { data: assessment, isLoading } = useChemicalRiskAssessment(chemicalEntry.id);
  const { createAssessment, updatePhase1, isCreating, isUpdating } = useChemicalRiskAssessmentMutations(projectId);

  // Phase 1 form state
  const [exposureType, setExposureType] = useState<string>("");
  const [exposureLevel, setExposureLevel] = useState<string>("");
  const [exposureDuration, setExposureDuration] = useState<string>("");
  const [exposedWorkersCount, setExposedWorkersCount] = useState<number>(1);
  const [hazardSeverity, setHazardSeverity] = useState<number>(3);
  const [exposureProbability, setExposureProbability] = useState<number>(3);
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [existingMeasures, setExistingMeasures] = useState<ProtectiveMeasure[]>([]);
  const [plannedMeasures, setPlannedMeasures] = useState<ProtectiveMeasure[]>([]);
  const [requiredPpe, setRequiredPpe] = useState<string[]>([]);
  const [phase1Conclusion, setPhase1Conclusion] = useState("");
  const [needsFurtherAssessment, setNeedsFurtherAssessment] = useState(false);
  const [healthMonitoringRequired, setHealthMonitoringRequired] = useState(false);
  const [healthMonitoringDetails, setHealthMonitoringDetails] = useState("");

  // Initialize form from assessment
  useEffect(() => {
    if (assessment) {
      setExposureType(assessment.exposure_type || "");
      setExposureLevel(assessment.exposure_level || "");
      setExposureDuration(assessment.exposure_duration || "");
      setExposedWorkersCount(assessment.exposed_workers_count || 1);
      setHazardSeverity(assessment.hazard_severity || 3);
      setExposureProbability(assessment.exposure_probability || 3);
      setWorkTasks(assessment.work_tasks || []);
      setExistingMeasures(assessment.existing_measures || []);
      setPlannedMeasures(assessment.planned_measures || []);
      setRequiredPpe(assessment.required_ppe || []);
      setPhase1Conclusion(assessment.phase_1_conclusion || "");
      setNeedsFurtherAssessment(assessment.phase_1_needs_further_assessment || false);
      setHealthMonitoringRequired(assessment.health_monitoring_required || false);
      setHealthMonitoringDetails(assessment.health_monitoring_details || "");
    }
  }, [assessment]);

  // Create assessment if it doesn't exist
  useEffect(() => {
    const initAssessment = async () => {
      if (open && !assessment && !isLoading && chemicalEntry.id) {
        await createAssessment(chemicalEntry.id);
      }
    };
    initAssessment();
  }, [open, assessment, isLoading, chemicalEntry.id]);

  const riskLevel = calculateChemicalRiskLevel(hazardSeverity, exposureProbability);

  const handleSavePhase1 = (complete: boolean = false) => {
    if (!assessment) return;

    updatePhase1({
      assessmentId: assessment.id,
      data: {
        exposure_type: exposureType || null,
        exposure_level: exposureLevel || null,
        exposure_duration: exposureDuration || null,
        exposed_workers_count: exposedWorkersCount,
        hazard_severity: hazardSeverity,
        exposure_probability: exposureProbability,
        risk_level: riskLevel.level.toLowerCase().replace(" ", "_"),
        work_tasks: workTasks,
        existing_measures: existingMeasures,
        planned_measures: plannedMeasures,
        required_ppe: requiredPpe,
        phase_1_conclusion: phase1Conclusion || null,
        phase_1_needs_further_assessment: needsFurtherAssessment,
        phase_1_completed: complete,
        health_monitoring_required: healthMonitoringRequired,
        health_monitoring_details: healthMonitoringDetails || null,
      },
    });
  };

  const addWorkTask = () => {
    setWorkTasks([
      ...workTasks,
      {
        id: crypto.randomUUID(),
        description: "",
        frequency: "daglig",
        duration_minutes: 30,
      },
    ]);
  };

  const updateWorkTask = (id: string, field: keyof WorkTask, value: any) => {
    setWorkTasks(workTasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeWorkTask = (id: string) => {
    setWorkTasks(workTasks.filter((t) => t.id !== id));
  };

  const addMeasure = (type: "existing" | "planned") => {
    const newMeasure: ProtectiveMeasure = {
      id: crypto.randomUUID(),
      type: "teknisk",
      description: "",
      implemented: type === "existing",
    };
    if (type === "existing") {
      setExistingMeasures([...existingMeasures, newMeasure]);
    } else {
      setPlannedMeasures([...plannedMeasures, newMeasure]);
    }
  };

  const updateMeasure = (
    type: "existing" | "planned",
    id: string,
    field: keyof ProtectiveMeasure,
    value: any
  ) => {
    const setter = type === "existing" ? setExistingMeasures : setPlannedMeasures;
    const measures = type === "existing" ? existingMeasures : plannedMeasures;
    setter(measures.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeMeasure = (type: "existing" | "planned", id: string) => {
    if (type === "existing") {
      setExistingMeasures(existingMeasures.filter((m) => m.id !== id));
    } else {
      setPlannedMeasures(plannedMeasures.filter((m) => m.id !== id));
    }
  };

  const togglePpe = (ppe: string) => {
    setRequiredPpe(requiredPpe.includes(ppe) ? requiredPpe.filter((p) => p !== ppe) : [...requiredPpe, ppe]);
  };

  const getProgressPercent = () => {
    let filled = 0;
    const fields = [exposureType, exposureLevel, exposureDuration, hazardSeverity, exposureProbability];
    fields.forEach((f) => {
      if (f) filled++;
    });
    if (workTasks.length > 0) filled++;
    if (existingMeasures.length > 0 || plannedMeasures.length > 0) filled++;
    if (requiredPpe.length > 0) filled++;
    return Math.round((filled / 8) * 100);
  };

  if (isLoading || isCreating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risikovurdering: {chemical?.product_name}
          </DialogTitle>
          <DialogDescription>
            Systematisk vurdering av helsefare og eksponering iht. Arbeidstilsynets metodikk
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fremgang fase 1</span>
            <span className="text-sm text-muted-foreground">{getProgressPercent()}%</span>
          </div>
          <Progress value={getProgressPercent()} className="h-2" />
        </div>

        {/* Chemical info summary */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{chemical?.product_name}</span>
                </div>
                {chemical?.manufacturer && (
                  <p className="text-sm text-muted-foreground">{chemical.manufacturer}</p>
                )}
                {chemical?.danger_classes && chemical.danger_classes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chemical.danger_classes.map((dc, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {dc}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {/* Risk score display */}
              <div className={cn("px-4 py-2 rounded-lg text-center", riskLevel.bg)}>
                <div className={cn("text-2xl font-bold", riskLevel.color)}>{riskLevel.score || "-"}</div>
                <div className={cn("text-xs font-medium", riskLevel.color)}>{riskLevel.level}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phase1" className="flex items-center gap-2">
              <span className="hidden sm:inline">Fase 1:</span> Innledende
              {assessment?.phase_1_completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="phase2" disabled={!assessment?.phase_1_completed} className="flex items-center gap-2">
              <span className="hidden sm:inline">Fase 2:</span> Forenklet
              {assessment?.phase_2_completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="phase3" disabled={!assessment?.phase_2_completed} className="flex items-center gap-2">
              <span className="hidden sm:inline">Fase 3:</span> Detaljert
              {assessment?.phase_3_completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          {/* Phase 1: Initial Assessment */}
          <TabsContent value="phase1" className="space-y-6 mt-4">
            {/* Exposure Assessment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Eksponeringsvurdering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Eksponeringstype</Label>
                    <Select value={exposureType} onValueChange={setExposureType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg type eksponering" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPOSURE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label} - {t.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Eksponeringsnivå</Label>
                    <Select value={exposureLevel} onValueChange={setExposureLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg nivå" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPOSURE_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label} - {l.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Varighet</Label>
                    <Select value={exposureDuration} onValueChange={setExposureDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg varighet" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPOSURE_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Antall eksponerte arbeidere</Label>
                    <Input
                      type="number"
                      min={1}
                      value={exposedWorkersCount}
                      onChange={(e) => setExposedWorkersCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Arbeidsoppgaver</CardTitle>
                  <Button variant="outline" size="sm" onClick={addWorkTask}>
                    <Plus className="h-4 w-4 mr-1" />
                    Legg til
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen arbeidsoppgaver registrert
                  </p>
                ) : (
                  <div className="space-y-3">
                    {workTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-2 p-3 border rounded-lg">
                        <div className="flex-1 grid md:grid-cols-3 gap-2">
                          <Input
                            placeholder="Beskrivelse av oppgave"
                            value={task.description}
                            onChange={(e) => updateWorkTask(task.id, "description", e.target.value)}
                            className="md:col-span-1"
                          />
                          <Select
                            value={task.frequency}
                            onValueChange={(v) => updateWorkTask(task.id, "frequency", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daglig">Daglig</SelectItem>
                              <SelectItem value="ukentlig">Ukentlig</SelectItem>
                              <SelectItem value="månedlig">Månedlig</SelectItem>
                              <SelectItem value="sjelden">Sjelden</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={task.duration_minutes}
                              onChange={(e) =>
                                updateWorkTask(task.id, "duration_minutes", parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">min</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeWorkTask(task.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Matrix */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Risikovurdering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <TooltipProvider>
                      <Label className="flex items-center gap-1">
                        Alvorlighetsgrad (konsekvens)
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Hvor alvorlig er helseeffekten hvis eksponering skjer?
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </TooltipProvider>
                    <Select
                      value={hazardSeverity.toString()}
                      onValueChange={(v) => setHazardSeverity(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value.toString()}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <TooltipProvider>
                      <Label className="flex items-center gap-1">
                        Sannsynlighet for eksponering
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Hvor sannsynlig er det at skadelig eksponering skjer?
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </TooltipProvider>
                    <Select
                      value={exposureProbability.toString()}
                      onValueChange={(v) => setExposureProbability(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROBABILITY_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value.toString()}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Risk level display */}
                <div className={cn("p-4 rounded-lg border-2", riskLevel.bg, `border-${riskLevel.color.replace("text-", "")}`)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={cn("text-lg font-bold", riskLevel.color)}>
                        Risikoscore: {riskLevel.score}
                      </span>
                      <p className={cn("text-sm", riskLevel.color)}>{riskLevel.level}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Grønn: 1-5 (Akseptabel)</p>
                      <p>Gul: 6-10 (Bør vurderes)</p>
                      <p>Rød: 11-25 (Tiltak påkrevd)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protective Equipment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Påkrevd verneutstyr (PPE)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PPE_OPTIONS.map((ppe) => (
                    <label
                      key={ppe}
                      className={cn(
                        "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors",
                        requiredPpe.includes(ppe) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={requiredPpe.includes(ppe)}
                        onCheckedChange={() => togglePpe(ppe)}
                      />
                      <span className="text-sm">{ppe}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Existing Measures */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Eksisterende tiltak</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => addMeasure("existing")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Legg til
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {existingMeasures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen eksisterende tiltak registrert
                  </p>
                ) : (
                  <div className="space-y-2">
                    {existingMeasures.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 p-2 border rounded">
                        <Select
                          value={m.type}
                          onValueChange={(v) => updateMeasure("existing", m.id, "type", v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teknisk">Teknisk</SelectItem>
                            <SelectItem value="organisatorisk">Organisatorisk</SelectItem>
                            <SelectItem value="verneutstyr">Verneutstyr</SelectItem>
                            <SelectItem value="opplæring">Opplæring</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          placeholder="Beskriv tiltaket"
                          value={m.description}
                          onChange={(e) => updateMeasure("existing", m.id, "description", e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeMeasure("existing", m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planned Measures */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Planlagte tiltak</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => addMeasure("planned")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Legg til
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plannedMeasures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen planlagte tiltak registrert
                  </p>
                ) : (
                  <div className="space-y-2">
                    {plannedMeasures.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 p-2 border rounded">
                        <Select
                          value={m.type}
                          onValueChange={(v) => updateMeasure("planned", m.id, "type", v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teknisk">Teknisk</SelectItem>
                            <SelectItem value="organisatorisk">Organisatorisk</SelectItem>
                            <SelectItem value="verneutstyr">Verneutstyr</SelectItem>
                            <SelectItem value="opplæring">Opplæring</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          className="flex-1"
                          placeholder="Beskriv tiltaket"
                          value={m.description}
                          onChange={(e) => updateMeasure("planned", m.id, "description", e.target.value)}
                        />
                        <Input
                          type="date"
                          className="w-36"
                          value={m.deadline || ""}
                          onChange={(e) => updateMeasure("planned", m.id, "deadline", e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeMeasure("planned", m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Monitoring */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Helseovervåking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={healthMonitoringRequired}
                    onCheckedChange={(checked) => setHealthMonitoringRequired(!!checked)}
                  />
                  <span className="text-sm">Helseovervåking er påkrevd for dette stoffet</span>
                </label>
                {healthMonitoringRequired && (
                  <Textarea
                    placeholder="Beskriv krav til helseundersøkelser, hyppighet, etc."
                    value={healthMonitoringDetails}
                    onChange={(e) => setHealthMonitoringDetails(e.target.value)}
                    rows={3}
                  />
                )}
              </CardContent>
            </Card>

            {/* Conclusion */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Konklusjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Oppsummer vurderingen og konklusjonen..."
                  value={phase1Conclusion}
                  onChange={(e) => setPhase1Conclusion(e.target.value)}
                  rows={4}
                />
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={needsFurtherAssessment}
                    onCheckedChange={(checked) => setNeedsFurtherAssessment(!!checked)}
                  />
                  <span className="text-sm">Behov for videre kartlegging (gå til fase 2)</span>
                </label>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Lukk
              </Button>
              <Button variant="outline" onClick={() => handleSavePhase1(false)} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Lagre utkast
              </Button>
              <Button onClick={() => handleSavePhase1(true)} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Fullfør fase 1
              </Button>
            </div>
          </TabsContent>

          {/* Phase 2: Simplified Investigation */}
          <TabsContent value="phase2" className="mt-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Fase 2: Forenklet undersøkelse</h3>
                <p className="text-sm text-muted-foreground">
                  Inkluderer 3-5 målinger per sammenliknbar eksponert gruppe med forenklet vurdering.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fullfør fase 1 først for å aktivere denne fasen.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phase 3: Detailed Investigation */}
          <TabsContent value="phase3" className="mt-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Fase 3: Detaljert undersøkelse</h3>
                <p className="text-sm text-muted-foreground">
                  Minimum 6 målinger med statistisk vurdering.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fullfør fase 2 først for å aktivere denne fasen.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
