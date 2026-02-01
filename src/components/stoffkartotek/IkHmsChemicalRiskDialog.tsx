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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Shield,
  FlaskConical,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import {
  useChemicalRiskAssessment,
  useChemicalRiskAssessmentMutations,
  calculateChemicalRiskLevel,
  WorkTask,
  ProtectiveMeasure,
} from "@/hooks/useChemicalRiskAssessment";
import { cn } from "@/lib/utils";

interface IkHmsChemicalRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chemical: {
    id: string;
    product_name: string;
    manufacturer: string | null;
    danger_classes: string[];
  };
}

const EXPOSURE_TYPES = [
  { value: "innånding", label: "Innånding", description: "Gasser, damper, støv" },
  { value: "hudkontakt", label: "Hudkontakt", description: "Direkte eller sprut" },
  { value: "svelging", label: "Svelging", description: "Forurensede hender, mat" },
  { value: "øyekontakt", label: "Øyekontakt", description: "Sprut, damp" },
];

const EXPOSURE_LEVELS = [
  { value: "lav", label: "Lav", description: "Minimal eksponering" },
  { value: "middels", label: "Middels", description: "Periodisk eksponering" },
  { value: "høy", label: "Høy", description: "Hyppig eksponering" },
];

const EXPOSURE_DURATIONS = [
  { value: "kort", label: "Kort (<15 min/dag)" },
  { value: "periodisk", label: "Periodisk (15 min - 4 timer/dag)" },
  { value: "langvarig", label: "Langvarig (>4 timer/dag)" },
];

const SEVERITY_LEVELS = [
  { value: 1, label: "1 - Ubetydelig" },
  { value: 2, label: "2 - Mindre" },
  { value: 3, label: "3 - Moderat" },
  { value: 4, label: "4 - Alvorlig" },
  { value: 5, label: "5 - Kritisk" },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: "1 - Svært lite" },
  { value: 2, label: "2 - Lite" },
  { value: 3, label: "3 - Mulig" },
  { value: 4, label: "4 - Sannsynlig" },
  { value: 5, label: "5 - Svært sannsynlig" },
];

const PPE_OPTIONS = [
  "Vernebriller",
  "Ansiktsskjerm",
  "Kjemikalieresistente hansker",
  "Åndedrettsvern",
  "Verneforkle/drakt",
  "Vernestøvler",
];

export function IkHmsChemicalRiskDialog({
  open,
  onOpenChange,
  chemical,
}: IkHmsChemicalRiskDialogProps) {
  const { data: assessment, isLoading } = useChemicalRiskAssessment(chemical.id, 'ik_hms');
  const { createAssessment, updatePhase1, isCreating, isUpdating } = useChemicalRiskAssessmentMutations(null, 'ik_hms');

  // Form state
  const [exposureType, setExposureType] = useState<string>("");
  const [exposureLevel, setExposureLevel] = useState<string>("");
  const [exposureDuration, setExposureDuration] = useState<string>("");
  const [exposedWorkersCount, setExposedWorkersCount] = useState<number>(1);
  const [hazardSeverity, setHazardSeverity] = useState<number>(3);
  const [exposureProbability, setExposureProbability] = useState<number>(3);
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [existingMeasures, setExistingMeasures] = useState<ProtectiveMeasure[]>([]);
  const [requiredPpe, setRequiredPpe] = useState<string[]>([]);
  const [phase1Conclusion, setPhase1Conclusion] = useState("");

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
      setRequiredPpe(assessment.required_ppe || []);
      setPhase1Conclusion(assessment.phase_1_conclusion || "");
    }
  }, [assessment]);

  // Create assessment if it doesn't exist
  useEffect(() => {
    const initAssessment = async () => {
      if (open && !assessment && !isLoading && chemical.id) {
        await createAssessment(chemical.id);
      }
    };
    initAssessment();
  }, [open, assessment, isLoading, chemical.id]);

  const riskLevel = calculateChemicalRiskLevel(hazardSeverity, exposureProbability);

  const handleSave = (complete: boolean = false) => {
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
        required_ppe: requiredPpe,
        phase_1_conclusion: phase1Conclusion || null,
        phase_1_needs_further_assessment: false,
        phase_1_completed: complete,
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
    if (existingMeasures.length > 0) filled++;
    if (requiredPpe.length > 0) filled++;
    return Math.round((filled / 8) * 100);
  };

  if (isLoading || isCreating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risikovurdering: {chemical.product_name}
          </DialogTitle>
          <DialogDescription>
            Vurdering av helsefare og eksponering
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fremgang</span>
            <span className="text-sm text-muted-foreground">{getProgressPercent()}%</span>
          </div>
          <Progress value={getProgressPercent()} className="h-2" />
        </div>

        {/* Chemical info + Risk score */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{chemical.product_name}</span>
                </div>
                {chemical.manufacturer && (
                  <p className="text-sm text-muted-foreground">{chemical.manufacturer}</p>
                )}
                {chemical.danger_classes?.length > 0 && (
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
              <div className={cn("px-4 py-2 rounded-lg text-center", riskLevel.bg)}>
                <div className={cn("text-2xl font-bold", riskLevel.color)}>{riskLevel.score || "-"}</div>
                <div className={cn("text-xs font-medium", riskLevel.color)}>{riskLevel.level}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Exposure Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Eksponeringsvurdering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Eksponeringstype</Label>
                  <Select value={exposureType} onValueChange={setExposureType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPOSURE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                  <Label>Antall eksponerte</Label>
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

          {/* Risk Matrix */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Risikovurdering (Alvorlighet × Sannsynlighet)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Alvorlighet</Label>
                  <Select value={hazardSeverity.toString()} onValueChange={(v) => setHazardSeverity(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((s) => (
                        <SelectItem key={s.value} value={s.value.toString()}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sannsynlighet</Label>
                  <Select value={exposureProbability.toString()} onValueChange={(v) => setExposureProbability(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROBABILITY_LEVELS.map((p) => (
                        <SelectItem key={p.value} value={p.value.toString()}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="space-y-2">
                  {workTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        placeholder="Beskrivelse"
                        value={task.description}
                        onChange={(e) => updateWorkTask(task.id, "description", e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeWorkTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PPE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Påkrevd verneutstyr (PPE)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PPE_OPTIONS.map((ppe) => (
                  <Badge
                    key={ppe}
                    variant={requiredPpe.includes(ppe) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePpe(ppe)}
                  >
                    {ppe}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conclusion */}
          <div>
            <Label>Konklusjon</Label>
            <Textarea
              value={phase1Conclusion}
              onChange={(e) => setPhase1Conclusion(e.target.value)}
              placeholder="Oppsummer vurderingen og eventuelle tiltak som må iverksettes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button onClick={() => handleSave(false)} disabled={isUpdating} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? "Lagrer..." : "Lagre utkast"}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isUpdating}>
              {isUpdating ? "Lagrer..." : "Fullfør vurdering"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
