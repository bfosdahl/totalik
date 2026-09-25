import { useState, useEffect } from "react";
import { JevCheckPanel } from "@/components/shared/JevCheckPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftRestoreBanner } from "@/components/shared/DraftRestoreBanner";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

export interface AiRiskSuggestion {
  exposure_types: string[];
  exposure_level: string;
  exposure_duration: string;
  hazard_severity: number;
  exposure_probability: number;
  required_ppe: string[];
  work_tasks: { description: string; frequency: string }[];
  conclusion: string;
}

interface IkHmsChemicalRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chemical: {
    id: string;
    product_name: string;
    manufacturer: string | null;
    danger_classes: string[];
  };
  aiRiskSuggestion?: AiRiskSuggestion | null;
}

const EXPOSURE_TYPES = [
  { value: "innånding", label: t("auto.innaanding"), description: t("auto.gasser_damper_stoev") },
  { value: "hudkontakt", label: t("auto.hudkontakt"), description: t("auto.direkte_eller_sprut") },
  { value: "svelging", label: t("auto.svelging"), description: t("auto.forurensede_hender_mat") },
  { value: "øyekontakt", label: t("auto.oeyekontakt"), description: t("auto.sprut_damp") },
];

const EXPOSURE_LEVELS = [
  { value: "lav", label: t("auto.lav"), description: t("auto.minimal_eksponering") },
  { value: "middels", label: t("auto.middels"), description: t("auto.periodisk_eksponering") },
  { value: "høy", label: t("auto.hoey"), description: t("auto.hyppig_eksponering") },
];

const EXPOSURE_DURATIONS = [
  { value: "kort", label: "Kort (<15 min/dag)" },
  { value: "periodisk", label: "Periodisk (15 min - 4 timer/dag)" },
  { value: "langvarig", label: "Langvarig (>4 timer/dag)" },
];

const SEVERITY_LEVELS = [
  { value: 1, label: t("auto.1_ubetydelig") },
  { value: 2, label: t("auto.2_mindre") },
  { value: 3, label: t("auto.3_moderat") },
  { value: 4, label: t("auto.4_alvorlig") },
  { value: 5, label: t("auto.5_kritisk") },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: t("auto.1_svaert_lite") },
  { value: 2, label: t("auto.2_lite") },
  { value: 3, label: t("auto.3_mulig") },
  { value: 4, label: t("auto.4_sannsynlig") },
  { value: 5, label: t("auto.5_svaert_sannsynlig") },
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
  aiRiskSuggestion,
}: IkHmsChemicalRiskDialogProps) {
  const { data: assessment, isLoading } = useChemicalRiskAssessment(chemical.id, 'ik_hms');
  const { createAssessment, updatePhase1, isCreating, isUpdating } = useChemicalRiskAssessmentMutations(null, 'ik_hms');
  const [aiApplied, setAiApplied] = useState(false);

  // Form state
  const [exposureTypes, setExposureTypes] = useState<string[]>([]);
  const [exposureLevel, setExposureLevel] = useState<string>("");
  const [exposureDuration, setExposureDuration] = useState<string>("");
  const [exposedWorkersCount, setExposedWorkersCount] = useState<number>(1);
  const [hazardSeverity, setHazardSeverity] = useState<number>(3);
  const [exposureProbability, setExposureProbability] = useState<number>(3);
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [existingMeasures, setExistingMeasures] = useState<ProtectiveMeasure[]>([]);
  const [requiredPpe, setRequiredPpe] = useState<string[]>([]);
  const [phase1Conclusion, setPhase1Conclusion] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize form from assessment
  useEffect(() => {
    if (assessment) {
      setExposureTypes(assessment.exposure_type ? assessment.exposure_type.split(",") : []);
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

  // Apply AI risk suggestion when available and no existing assessment data
  useEffect(() => {
    if (aiRiskSuggestion && assessment && !aiApplied && !assessment.phase_1_completed) {
      // Only apply if the assessment is fresh (no existing data)
      const hasExistingData = assessment.exposure_type || assessment.hazard_severity || assessment.phase_1_conclusion;
      if (!hasExistingData) {
        setExposureTypes(aiRiskSuggestion.exposure_types || []);
        setExposureLevel(aiRiskSuggestion.exposure_level || "");
        setExposureDuration(aiRiskSuggestion.exposure_duration || "");
        setHazardSeverity(aiRiskSuggestion.hazard_severity || 3);
        setExposureProbability(aiRiskSuggestion.exposure_probability || 3);
        setRequiredPpe(aiRiskSuggestion.required_ppe || []);
        setPhase1Conclusion(aiRiskSuggestion.conclusion || "");
        if (aiRiskSuggestion.work_tasks?.length > 0) {
          setWorkTasks(aiRiskSuggestion.work_tasks.map((t: any) => ({
            id: crypto.randomUUID(),
            description: t.description,
            frequency: t.frequency || "daglig",
            duration_minutes: 30,
          })));
        }
        setAiApplied(true);
      }
    }
  }, [aiRiskSuggestion, assessment, aiApplied]);

  // Create assessment if it doesn't exist
  useEffect(() => {
    const initAssessment = async () => {
      if (open && !assessment && !isLoading && !isInitializing && !isCreating && chemical.id) {
        setIsInitializing(true);
        try {
          await createAssessment(chemical.id);
        } catch (error) {
          console.error("Failed to create assessment:", error);
        } finally {
          setIsInitializing(false);
        }
      }
    };
    initAssessment();
  }, [open, assessment, isLoading, chemical.id, isCreating]);

  const riskLevel = calculateChemicalRiskLevel(hazardSeverity, exposureProbability);

  // Lokalt utkast: tar vare på påbegynt risikovurdering ved utilsiktet lukking.
  const draftData = {
    exposureTypes, exposureLevel, exposureDuration, exposedWorkersCount,
    hazardSeverity, exposureProbability, workTasks, existingMeasures,
    requiredPpe, phase1Conclusion,
  };
  const isDirty = open && !assessment?.phase_1_completed &&
    (exposureTypes.length > 0 || exposureLevel !== "" || workTasks.length > 0 ||
     requiredPpe.length > 0 || phase1Conclusion.trim() !== "");
  const { draft, clear: clearDraft, dismiss: dismissDraft, refresh: refreshDraft } = useFormDraft(
    `stoffkartotek-risiko:${chemical.id}`,
    draftData,
    { enabled: isDirty },
  );
  // Les utkast på nytt hver gang dialogen åpnes (hooken forblir montert).
  useEffect(() => { if (open) refreshDraft(); }, [open, refreshDraft]);
  const restoreDraft = () => {
    if (!draft) return;
    const d = draft.data;
    setExposureTypes(d.exposureTypes || []);
    setExposureLevel(d.exposureLevel || "");
    setExposureDuration(d.exposureDuration || "");
    setExposedWorkersCount(d.exposedWorkersCount ?? 1);
    setHazardSeverity(d.hazardSeverity ?? 3);
    setExposureProbability(d.exposureProbability ?? 3);
    setWorkTasks(d.workTasks || []);
    setExistingMeasures(d.existingMeasures || []);
    setRequiredPpe(d.requiredPpe || []);
    setPhase1Conclusion(d.phase1Conclusion || "");
    dismissDraft();
  };

  const handleSave = (complete: boolean = false) => {
    if (!assessment) {
      console.error("Cannot save: assessment not initialized");
      return;
    }

    updatePhase1({
      assessmentId: assessment.id,
      data: {
        exposure_type: exposureTypes.length > 0 ? exposureTypes.join(",") : null,
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
    clearDraft();
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
    const fields = [exposureTypes.length > 0, exposureLevel, exposureDuration, hazardSeverity, exposureProbability];
    fields.forEach((f) => {
      if (f) filled++;
    });
    if (workTasks.length > 0) filled++;
    if (existingMeasures.length > 0) filled++;
    if (requiredPpe.length > 0) filled++;
    return Math.round((filled / 8) * 100);
  };

  if (isLoading || isCreating || isInitializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              {isInitializing ? "Oppretter vurdering..." : "Laster..."}
            </span>
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
            {t("auto.vurdering_av_helsefare_og_eksponering")}
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <DraftRestoreBanner savedAt={draft.savedAt} onRestore={restoreDraft} onDiscard={clearDraft} />
        )}

        <JevCheckPanel
          label="Kontroller vurderingen"
          disabled={exposureTypes.length === 0}
          hint="Velg eksponeringsvei først."
          run={async (call) => {
            const r = await call<{ ppeOk: number | null; severityOk: number | null; measuresOk: number | null }>({
              mode: "chemical_check", productName: chemical.product_name, dangerClasses: chemical.danger_classes || [],
              exposureTypes, exposureLevel, exposureDuration, hazardSeverity, exposureProbability,
              workTasks, measures: existingMeasures, ppe: requiredPpe,
            });
            if (!r) return null;
            const bad = (v: number | null) => v !== null && v < 0.5;
            return [
              bad(r.ppeOk) ? { ok: false, text: "Verneutstyret dekker trolig ikke alle eksponeringsveier." } : { ok: true, text: "Verneutstyret ser tilstrekkelig ut." },
              bad(r.severityOk) ? { ok: false, text: "Alvorlighet/sannsynlighet virker satt for lavt eller høyt ut fra fareklassene." } : { ok: true, text: "Risikotallene virker rimelige." },
              bad(r.measuresOk) ? { ok: false, text: "Mangler tiltak utover verneutstyr (bytte produkt, avtrekk, rutiner)." } : { ok: true, text: "Tiltakene ser tilstrekkelige ut." },
            ];
          }}
        />

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("auto.fremgang")}</span>
            <span className="text-sm text-muted-foreground">{getProgressPercent()}%</span>
          </div>
          <Progress value={getProgressPercent()} className="h-2" />
        </div>

        {/* AI suggestion banner */}
        {aiApplied && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              {t("auto.ai_har_foreslaatt_en_risikovurdering_bas")}
            </AlertDescription>
          </Alert>
        )}

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
                  <Label className="mb-2 block">{t("auto.eksponeringstype")}</Label>
                  <div className="space-y-2">
                    {EXPOSURE_TYPES.map((t) => (
                      <div key={t.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ik-exposure-${t.value}`}
                          checked={exposureTypes.includes(t.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setExposureTypes([...exposureTypes, t.value]);
                            } else {
                              setExposureTypes(exposureTypes.filter(v => v !== t.value));
                            }
                          }}
                        />
                        <label htmlFor={`ik-exposure-${t.value}`} className="text-sm cursor-pointer">
                          {t.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t("auto.eksponeringsnivaa")}</Label>
                  <Select value={exposureLevel} onValueChange={setExposureLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_nivaa")} />
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
                  <Label>{t("auto.varighet")}</Label>
                  <Select value={exposureDuration} onValueChange={setExposureDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_varighet")} />
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
                  <Label>{t("auto.antall_eksponerte")}</Label>
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
                  <Label>{t("auto.alvorlighet")}</Label>
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
                  <Label>{t("auto.sannsynlighet_4")}</Label>
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
                <CardTitle className="text-base">{t("auto.arbeidsoppgaver")}</CardTitle>
                <Button variant="outline" size="sm" onClick={addWorkTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("auto.legg_til")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("auto.ingen_arbeidsoppgaver_registrert")}
                </p>
              ) : (
                <div className="space-y-2">
                  {workTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        placeholder={t("auto.beskrivelse")}
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
              <CardTitle className="text-base">{t("auto.paakrevd_verneutstyr_ppe")}</CardTitle>
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
            <Label>{t("auto.konklusjon")}</Label>
            <Textarea
              value={phase1Conclusion}
              onChange={(e) => setPhase1Conclusion(e.target.value)}
              placeholder={t("auto.oppsummer_vurderingen_og_eventuelle_tilt")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              onClick={() => handleSave(false)} 
              disabled={isUpdating || !assessment} 
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? "Lagrer..." : "Lagre utkast"}
            </Button>
            <Button 
              onClick={() => handleSave(true)} 
              disabled={isUpdating || !assessment}
            >
              {isUpdating ? "Lagrer..." : "Fullfør vurdering"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("auto.lukk")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
