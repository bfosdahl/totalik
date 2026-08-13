import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  Activity,
  Volume2,
  Vibrate,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  useErgonomicRiskAssessment,
  useUpdateErgonomicAssessment,
  calculateErgonomicRiskLevel,
  MUSKEL_SKJELETT_RISK_FACTORS,
  VIBRASJON_RISK_FACTORS,
  STOY_RISK_FACTORS,
  EXPOSURE_FREQUENCY_OPTIONS,
  EXPOSURE_DURATION_OPTIONS,
  PPE_OPTIONS,
  RiskFactor,
  ProtectiveMeasure,
  ErgonomicAssessmentType,
} from "@/hooks/useErgonomicRiskAssessment";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

interface ErgonomicAssessmentDialogProps {
  assessmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_OPTIONS = [
  { value: 1, label: t("auto.1_ubetydelig"), description: t("auto.ingen_skade_eller_mild_ubehag") },
  { value: 2, label: t("auto.2_lav"), description: t("auto.mindre_skade_forbigaaende_plager") },
  { value: 3, label: t("auto.3_moderat"), description: t("auto.skade_som_krever_behandling") },
  { value: 4, label: t("auto.4_alvorlig"), description: t("auto.alvorlig_skade_langvarig_sykefravaer") },
  { value: 5, label: t("auto.5_svaert_alvorlig"), description: t("auto.varig_skade_eller_ufoerhet") },
];

const PROBABILITY_OPTIONS = [
  { value: 1, label: t("auto.1_svaert_lav"), description: t("auto.lite_sannsynlig") },
  { value: 2, label: t("auto.2_lav"), description: t("auto.kan_skje_men_sjelden") },
  { value: 3, label: t("auto.3_moderat"), description: t("auto.kan_skje_av_og_til") },
  { value: 4, label: t("auto.4_hoey"), description: t("auto.vil_sannsynligvis_skje") },
  { value: 5, label: t("auto.5_svaert_hoey"), description: t("auto.forventes_aa_skje") },
];

export function ErgonomicAssessmentDialog({
  assessmentId,
  open,
  onOpenChange,
}: ErgonomicAssessmentDialogProps) {
  const { data: assessment, isLoading } = useErgonomicRiskAssessment(assessmentId);
  const { mutate: updateAssessment, isPending: isUpdating } = useUpdateErgonomicAssessment();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workArea, setWorkArea] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [exposedWorkersCount, setExposedWorkersCount] = useState<number | undefined>();
  const [exposureFrequency, setExposureFrequency] = useState("");
  const [exposureDuration, setExposureDuration] = useState("");
  const [consequenceSeverity, setConsequenceSeverity] = useState<number | undefined>();
  const [probability, setProbability] = useState<number | undefined>();
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [existingMeasures, setExistingMeasures] = useState<ProtectiveMeasure[]>([]);
  const [plannedMeasures, setPlannedMeasures] = useState<ProtectiveMeasure[]>([]);
  const [requiredPpe, setRequiredPpe] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [healthMonitoringRequired, setHealthMonitoringRequired] = useState(false);
  const [healthMonitoringDetails, setHealthMonitoringDetails] = useState("");
  
  // Vibration specific
  const [vibrationType, setVibrationType] = useState("");
  const [vibrationLevel, setVibrationLevel] = useState<number | undefined>();
  const [vibrationExposureTime, setVibrationExposureTime] = useState<number | undefined>();
  
  // Noise specific
  const [noiseLevel, setNoiseLevel] = useState<number | undefined>();
  const [noisePeakLevel, setNoisePeakLevel] = useState<number | undefined>();
  const [noiseExposureTime, setNoiseExposureTime] = useState<number | undefined>();

  // Initialize form from assessment
  useEffect(() => {
    if (assessment) {
      setTitle(assessment.title || "");
      setDescription(assessment.description || "");
      setWorkArea(assessment.work_area || "");
      setJobRole(assessment.job_role || "");
      setExposedWorkersCount(assessment.exposed_workers_count);
      setExposureFrequency(assessment.exposure_frequency || "");
      setExposureDuration(assessment.exposure_duration || "");
      setConsequenceSeverity(assessment.consequence_severity);
      setProbability(assessment.probability);
      setRiskFactors(Array.isArray(assessment.risk_factors) ? assessment.risk_factors : []);
      setExistingMeasures(Array.isArray(assessment.existing_measures) ? assessment.existing_measures : []);
      setPlannedMeasures(Array.isArray(assessment.planned_measures) ? assessment.planned_measures : []);
      setRequiredPpe(Array.isArray(assessment.required_ppe) ? assessment.required_ppe : []);
      setConclusion(assessment.conclusion || "");
      setRecommendations(assessment.recommendations || "");
      setHealthMonitoringRequired(assessment.health_monitoring_required || false);
      setHealthMonitoringDetails(assessment.health_monitoring_details || "");
      setVibrationType(assessment.vibration_type || "");
      setVibrationLevel(assessment.vibration_level);
      setVibrationExposureTime(assessment.vibration_exposure_time);
      setNoiseLevel(assessment.noise_level);
      setNoisePeakLevel(assessment.noise_peak_level);
      setNoiseExposureTime(assessment.noise_exposure_time);
    }
  }, [assessment]);

  const riskLevel = calculateErgonomicRiskLevel(consequenceSeverity || 0, probability || 0);

  const handleSave = (complete: boolean = false) => {
    if (!assessment) return;

    updateAssessment({
      id: assessment.id,
      title,
      description,
      work_area: workArea,
      job_role: jobRole,
      exposed_workers_count: exposedWorkersCount,
      exposure_frequency: exposureFrequency,
      exposure_duration: exposureDuration,
      consequence_severity: consequenceSeverity,
      probability: probability,
      risk_factors: riskFactors,
      existing_measures: existingMeasures,
      planned_measures: plannedMeasures,
      required_ppe: requiredPpe,
      conclusion,
      recommendations,
      health_monitoring_required: healthMonitoringRequired,
      health_monitoring_details: healthMonitoringDetails,
      vibration_type: vibrationType,
      vibration_level: vibrationLevel,
      vibration_exposure_time: vibrationExposureTime,
      noise_level: noiseLevel,
      noise_peak_level: noisePeakLevel,
      noise_exposure_time: noiseExposureTime,
      status: complete ? "completed" : "in_progress",
      assessed_at: complete ? new Date().toISOString() : undefined,
    });
  };

  const addRiskFactor = (factor: string) => {
    if (riskFactors.some((rf) => rf.factor === factor)) return;
    setRiskFactors([...riskFactors, { factor, frequency: "", duration: "", intensity: "" }]);
  };

  const removeRiskFactor = (factor: string) => {
    setRiskFactors(riskFactors.filter((rf) => rf.factor !== factor));
  };

  const updateRiskFactor = (factor: string, field: keyof RiskFactor, value: string) => {
    setRiskFactors(
      riskFactors.map((rf) =>
        rf.factor === factor ? { ...rf, [field]: value } : rf
      )
    );
  };

  const addMeasure = (type: "existing" | "planned") => {
    const newMeasure: ProtectiveMeasure = { measure: "", implemented: false };
    if (type === "existing") {
      setExistingMeasures([...existingMeasures, newMeasure]);
    } else {
      setPlannedMeasures([...plannedMeasures, newMeasure]);
    }
  };

  const removeMeasure = (type: "existing" | "planned", index: number) => {
    if (type === "existing") {
      setExistingMeasures(existingMeasures.filter((_, i) => i !== index));
    } else {
      setPlannedMeasures(plannedMeasures.filter((_, i) => i !== index));
    }
  };

  const updateMeasure = (
    type: "existing" | "planned",
    index: number,
    field: keyof ProtectiveMeasure,
    value: string | boolean
  ) => {
    const setter = type === "existing" ? setExistingMeasures : setPlannedMeasures;
    const measures = type === "existing" ? existingMeasures : plannedMeasures;
    setter(
      measures.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const togglePpe = (ppe: string) => {
    if (requiredPpe.includes(ppe)) {
      setRequiredPpe(requiredPpe.filter((p) => p !== ppe));
    } else {
      setRequiredPpe([...requiredPpe, ppe]);
    }
  };

  const getRiskFactorOptions = () => {
    if (!assessment) return [];
    const factors: string[] = [];
    if (assessment.assessment_type.includes("muskel_skjelett")) factors.push(...MUSKEL_SKJELETT_RISK_FACTORS);
    if (assessment.assessment_type.includes("vibrasjon")) factors.push(...VIBRASJON_RISK_FACTORS);
    if (assessment.assessment_type.includes("stoy")) factors.push(...STOY_RISK_FACTORS);
    return factors.length > 0 ? factors : MUSKEL_SKJELETT_RISK_FACTORS;
  };

  const getPpeOptions = () => {
    if (!assessment) return [];
    const options: string[] = [];
    for (const t of assessment.assessment_type) {
      if (PPE_OPTIONS[t]) options.push(...PPE_OPTIONS[t]);
    }
    return options.length > 0 ? options : [];
  };

  const getTypeIcon = () => {
    if (!assessment) return Activity;
    if (assessment.assessment_type.includes("vibrasjon")) return Vibrate;
    if (assessment.assessment_type.includes("stoy")) return Volume2;
    return Activity;
  };

  const getTypeLabel = () => {
    if (!assessment) return "";
    const labels: string[] = [];
    if (assessment.assessment_type.includes("muskel_skjelett")) labels.push("Muskel- og skjelett");
    if (assessment.assessment_type.includes("vibrasjon")) labels.push("Vibrasjoner");
    if (assessment.assessment_type.includes("stoy")) labels.push("Støy");
    return labels.join(", ");
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!assessment) return null;

  const TypeIcon = getTypeIcon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>{title || "Risikovurdering"}</DialogTitle>
              <p className="text-sm text-muted-foreground">{getTypeLabel()}</p>
            </div>
            {riskLevel.score > 0 && (
              <Badge className={cn("ml-auto", riskLevel.bg, riskLevel.color)}>
                R{riskLevel.score} - {riskLevel.level}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">{t("auto.informasjon")}</TabsTrigger>
                <TabsTrigger value="risk">{t("auto.risikofaktorer")}</TabsTrigger>
                <TabsTrigger value="measures">{t("auto.tiltak")}</TabsTrigger>
                <TabsTrigger value="conclusion">{t("auto.konklusjon")}</TabsTrigger>
              </TabsList>

              {/* Tab: Information */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("auto.tittel")}</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t("auto.tittel_paa_vurderingen")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.arbeidsomraade")}</Label>
                    <Input
                      value={workArea}
                      onChange={(e) => setWorkArea(e.target.value)}
                      placeholder={t("auto.f_eks_lager_verksted")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.yrkesgruppe_stilling")}</Label>
                    <Input
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder={t("auto.f_eks_lagermedarbeider")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.antall_eksponerte_arbeidstakere")}</Label>
                    <Input
                      type="number"
                      value={exposedWorkersCount || ""}
                      onChange={(e) => setExposedWorkersCount(parseInt(e.target.value) || undefined)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.eksponeringsfrekvens")}</Label>
                    <Select value={exposureFrequency} onValueChange={setExposureFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_frekvens")} />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPOSURE_FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.eksponeringsvarighet")}</Label>
                    <Select value={exposureDuration} onValueChange={setExposureDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_varighet")} />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPOSURE_DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("auto.beskrivelse_av_arbeidsoppgaver")}</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("auto.beskriv_arbeidsoppgavene_som_vurderes")}
                    rows={4}
                  />
                </div>

                {/* Type-specific fields */}
                {assessment.assessment_type.includes("vibrasjon") && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      Vibrasjonsdetaljer
                    </h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>{t("auto.type_vibrasjon")}</Label>
                        <Select value={vibrationType} onValueChange={setVibrationType}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("auto.velg_type")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hand_arm">{t("auto.haand_arm")}</SelectItem>
                            <SelectItem value="whole_body">{t("auto.helkropp")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("auto.vibrasjonsnivaa_m_s")}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={vibrationLevel || ""}
                          onChange={(e) => setVibrationLevel(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Eksponeringstid (min/dag)</Label>
                        <Input
                          type="number"
                          value={vibrationExposureTime || ""}
                          onChange={(e) => setVibrationExposureTime(parseInt(e.target.value) || undefined)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {assessment.assessment_type.includes("stoy") && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      {t("auto.stoeydetaljer")}
                    </h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>{t("auto.stoeynivaa_db")}</Label>
                        <Input
                          type="number"
                          value={noiseLevel || ""}
                          onChange={(e) => setNoiseLevel(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("auto.toppnivaa_impulsstoey_db")}</Label>
                        <Input
                          type="number"
                          value={noisePeakLevel || ""}
                          onChange={(e) => setNoisePeakLevel(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Eksponeringstid (min/dag)</Label>
                        <Input
                          type="number"
                          value={noiseExposureTime || ""}
                          onChange={(e) => setNoiseExposureTime(parseInt(e.target.value) || undefined)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Risk Factors */}
              <TabsContent value="risk" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("auto.identifiserte_risikofaktorer")}</Label>
                  </div>

                  {/* Quick add buttons */}
                  <div className="flex flex-wrap gap-2">
                    {getRiskFactorOptions().map((factor) => {
                      const isAdded = riskFactors.some((rf) => rf.factor === factor);
                      return (
                        <Button
                          key={factor}
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => (isAdded ? removeRiskFactor(factor) : addRiskFactor(factor))}
                        >
                          {isAdded ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                          {factor}
                        </Button>
                      );
                    })
                    }
                  </div>

                  {/* Added risk factors with details */}
                  {riskFactors.length > 0 && (
                    <div className="space-y-3">
                      {riskFactors.map((rf) => (
                        <div key={rf.factor} className="p-3 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{rf.factor}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRiskFactor(rf.factor)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs">{t("auto.hyppighet")}</Label>
                              <Select
                                value={rf.frequency}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "frequency", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder={t("auto.velg_2")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXPOSURE_FREQUENCY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t("auto.varighet")}</Label>
                              <Select
                                value={rf.duration}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "duration", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder={t("auto.velg_2")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXPOSURE_DURATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t("auto.intensitet")}</Label>
                              <Select
                                value={rf.intensity}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "intensity", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder={t("auto.velg_2")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lav">{t("auto.lav")}</SelectItem>
                                  <SelectItem value="middels">{t("auto.middels")}</SelectItem>
                                  <SelectItem value="hoy">{t("auto.hoey")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))
                      }
                    </div>
                  )}

                  {/* Risk calculation */}
                  <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                    <h4 className="font-medium">{t("auto.risikovurdering")}</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Konsekvensgrad (alvorlighet)</Label>
                        <Select
                          value={consequenceSeverity?.toString()}
                          onValueChange={(v) => setConsequenceSeverity(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("auto.velg_alvorlighetsgrad")} />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                <div>
                                  <span className="font-medium">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {opt.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("auto.sannsynlighet_4")}</Label>
                        <Select
                          value={probability?.toString()}
                          onValueChange={(v) => setProbability(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("auto.velg_sannsynlighet")} />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBABILITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                <div>
                                  <span className="font-medium">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {opt.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {riskLevel.score > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold", riskLevel.bg, riskLevel.color)}>
                          {riskLevel.score}
                        </div>
                        <div>
                          <p className={cn("font-medium", riskLevel.color)}>{riskLevel.level} risiko</p>
                          <p className="text-sm text-muted-foreground">
                            {consequenceSeverity} × {probability} = {riskLevel.score}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Measures */}
              <TabsContent value="measures" className="space-y-6 mt-4">
                {/* Existing measures */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("auto.eksisterende_tiltak")}</Label>
                    <Button variant="outline" size="sm" onClick={() => addMeasure("existing")}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t("auto.legg_til")}
                    </Button>
                  </div>
                  {existingMeasures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("auto.ingen_eksisterende_tiltak_registrert")}</p>
                  ) : (
                    <div className="space-y-2">
                      {existingMeasures.map((measure, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={measure.measure}
                            onChange={(e) => updateMeasure("existing", idx, "measure", e.target.value)}
                            placeholder={t("auto.beskriv_tiltak")}
                            className="flex-1"
                          />
                          <Checkbox
                            checked={measure.implemented}
                            onCheckedChange={(checked) => updateMeasure("existing", idx, "implemented", !!checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMeasure("existing", idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                      }
                    </div>
                  )}
                </div>

                {/* Planned measures */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("auto.planlagte_tiltak")}</Label>
                    <Button variant="outline" size="sm" onClick={() => addMeasure("planned")}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t("auto.legg_til")}
                    </Button>
                  </div>
                  {plannedMeasures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("auto.ingen_planlagte_tiltak_registrert")}</p>
                  ) : (
                    <div className="space-y-2">
                      {plannedMeasures.map((measure, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={measure.measure}
                            onChange={(e) => updateMeasure("planned", idx, "measure", e.target.value)}
                            placeholder={t("auto.beskriv_tiltak")}
                            className="flex-1"
                          />
                          <Input
                            value={measure.responsible || ""}
                            onChange={(e) => updateMeasure("planned", idx, "responsible", e.target.value)}
                            placeholder={t("auto.ansvarlig_2")}
                            className="w-32"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMeasure("planned", idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                      }
                    </div>
                  )}
                </div>

                {/* Required PPE */}
                <div className="space-y-3">
                  <Label>{t("auto.noedvendig_verneutstyr_pvu")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {getPpeOptions().map((ppe) => (
                      <Button
                        key={ppe}
                        variant={requiredPpe.includes(ppe) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => togglePpe(ppe)}
                      >
                        {requiredPpe.includes(ppe) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {ppe}
                      </Button>
                    ))
                    }
                  </div>
                </div>

                {/* Health monitoring */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="healthMonitoring"
                      checked={healthMonitoringRequired}
                      onCheckedChange={(checked) => setHealthMonitoringRequired(!!checked)}
                    />
                    <Label htmlFor="healthMonitoring">{t("auto.helseundersoekelse_paakrevd")}</Label>
                  </div>
                  {healthMonitoringRequired && (
                    <Textarea
                      value={healthMonitoringDetails}
                      onChange={(e) => setHealthMonitoringDetails(e.target.value)}
                      placeholder={t("auto.beskriv_type_helseundersoekelse_og_hyppi")}
                      rows={2}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Tab: Conclusion */}
              <TabsContent value="conclusion" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t("auto.konklusjon")}</Label>
                  <Textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder={t("auto.oppsummer_vurderingen_og_risikobildet")}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.anbefalinger")}</Label>
                  <Textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder={t("auto.beskriv_anbefalte_tiltak_og_oppfoelging")}
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-2 p-6 pt-4 border-t">
          <Button onClick={() => handleSave(false)} disabled={isUpdating} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? "Lagrer..." : "Lagre utkast"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isUpdating}>
            {isUpdating ? "Lagrer..." : "Fullfør vurdering"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("auto.lukk")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
