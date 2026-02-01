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

interface ErgonomicAssessmentDialogProps {
  assessmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_OPTIONS = [
  { value: 1, label: "1 - Ubetydelig", description: "Ingen skade eller mild ubehag" },
  { value: 2, label: "2 - Lav", description: "Mindre skade, forbigående plager" },
  { value: 3, label: "3 - Moderat", description: "Skade som krever behandling" },
  { value: 4, label: "4 - Alvorlig", description: "Alvorlig skade, langvarig sykefravær" },
  { value: 5, label: "5 - Svært alvorlig", description: "Varig skade eller uførhet" },
];

const PROBABILITY_OPTIONS = [
  { value: 1, label: "1 - Svært lav", description: "Lite sannsynlig" },
  { value: 2, label: "2 - Lav", description: "Kan skje, men sjelden" },
  { value: 3, label: "3 - Moderat", description: "Kan skje av og til" },
  { value: 4, label: "4 - Høy", description: "Vil sannsynligvis skje" },
  { value: 5, label: "5 - Svært høy", description: "Forventes å skje" },
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
      setRiskFactors((assessment.risk_factors as RiskFactor[]) || []);
      setExistingMeasures((assessment.existing_measures as ProtectiveMeasure[]) || []);
      setPlannedMeasures((assessment.planned_measures as ProtectiveMeasure[]) || []);
      setRequiredPpe((assessment.required_ppe as string[]) || []);
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
    switch (assessment.assessment_type) {
      case "muskel_skjelett":
        return MUSKEL_SKJELETT_RISK_FACTORS;
      case "vibrasjon":
        return VIBRASJON_RISK_FACTORS;
      case "stoy":
        return STOY_RISK_FACTORS;
      default:
        return [];
    }
  };

  const getPpeOptions = () => {
    if (!assessment) return [];
    return PPE_OPTIONS[assessment.assessment_type] || [];
  };

  const getTypeIcon = () => {
    if (!assessment) return Activity;
    switch (assessment.assessment_type) {
      case "vibrasjon":
        return Vibrate;
      case "stoy":
        return Volume2;
      default:
        return Activity;
    }
  };

  const getTypeLabel = () => {
    if (!assessment) return "";
    switch (assessment.assessment_type) {
      case "muskel_skjelett":
        return "Muskel- og skjelett";
      case "vibrasjon":
        return "Vibrasjoner";
      case "stoy":
        return "Støy";
      default:
        return "";
    }
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
                <TabsTrigger value="info">Informasjon</TabsTrigger>
                <TabsTrigger value="risk">Risikofaktorer</TabsTrigger>
                <TabsTrigger value="measures">Tiltak</TabsTrigger>
                <TabsTrigger value="conclusion">Konklusjon</TabsTrigger>
              </TabsList>

              {/* Tab: Information */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tittel</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tittel på vurderingen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Arbeidsområde</Label>
                    <Input
                      value={workArea}
                      onChange={(e) => setWorkArea(e.target.value)}
                      placeholder="F.eks. Lager, Verksted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yrkesgruppe / Stilling</Label>
                    <Input
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="F.eks. Lagermedarbeider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Antall eksponerte arbeidstakere</Label>
                    <Input
                      type="number"
                      value={exposedWorkersCount || ""}
                      onChange={(e) => setExposedWorkersCount(parseInt(e.target.value) || undefined)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eksponeringsfrekvens</Label>
                    <Select value={exposureFrequency} onValueChange={setExposureFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg frekvens" />
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
                    <Label>Eksponeringsvarighet</Label>
                    <Select value={exposureDuration} onValueChange={setExposureDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg varighet" />
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
                  <Label>Beskrivelse av arbeidsoppgaver</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beskriv arbeidsoppgavene som vurderes..."
                    rows={4}
                  />
                </div>

                {/* Type-specific fields */}
                {assessment.assessment_type === "vibrasjon" && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      Vibrasjonsdetaljer
                    </h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Type vibrasjon</Label>
                        <Select value={vibrationType} onValueChange={setVibrationType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hand_arm">Hånd-arm</SelectItem>
                            <SelectItem value="whole_body">Helkropp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vibrasjonsnivå (m/s²)</Label>
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

                {assessment.assessment_type === "stoy" && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Støydetaljer
                    </h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Støynivå (dB)</Label>
                        <Input
                          type="number"
                          value={noiseLevel || ""}
                          onChange={(e) => setNoiseLevel(parseFloat(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Toppnivå / impulsstøy (dB)</Label>
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
                    <Label>Identifiserte risikofaktorer</Label>
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
                              <Label className="text-xs">Hyppighet</Label>
                              <Select
                                value={rf.frequency}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "frequency", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Velg" />
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
                              <Label className="text-xs">Varighet</Label>
                              <Select
                                value={rf.duration}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "duration", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Velg" />
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
                              <Label className="text-xs">Intensitet</Label>
                              <Select
                                value={rf.intensity}
                                onValueChange={(v) => updateRiskFactor(rf.factor, "intensity", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Velg" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lav">Lav</SelectItem>
                                  <SelectItem value="middels">Middels</SelectItem>
                                  <SelectItem value="hoy">Høy</SelectItem>
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
                    <h4 className="font-medium">Risikovurdering</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Konsekvensgrad (alvorlighet)</Label>
                        <Select
                          value={consequenceSeverity?.toString()}
                          onValueChange={(v) => setConsequenceSeverity(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg alvorlighetsgrad" />
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
                        <Label>Sannsynlighet</Label>
                        <Select
                          value={probability?.toString()}
                          onValueChange={(v) => setProbability(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg sannsynlighet" />
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
                    <Label>Eksisterende tiltak</Label>
                    <Button variant="outline" size="sm" onClick={() => addMeasure("existing")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Legg til
                    </Button>
                  </div>
                  {existingMeasures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ingen eksisterende tiltak registrert</p>
                  ) : (
                    <div className="space-y-2">
                      {existingMeasures.map((measure, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={measure.measure}
                            onChange={(e) => updateMeasure("existing", idx, "measure", e.target.value)}
                            placeholder="Beskriv tiltak..."
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
                    <Label>Planlagte tiltak</Label>
                    <Button variant="outline" size="sm" onClick={() => addMeasure("planned")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Legg til
                    </Button>
                  </div>
                  {plannedMeasures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ingen planlagte tiltak registrert</p>
                  ) : (
                    <div className="space-y-2">
                      {plannedMeasures.map((measure, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={measure.measure}
                            onChange={(e) => updateMeasure("planned", idx, "measure", e.target.value)}
                            placeholder="Beskriv tiltak..."
                            className="flex-1"
                          />
                          <Input
                            value={measure.responsible || ""}
                            onChange={(e) => updateMeasure("planned", idx, "responsible", e.target.value)}
                            placeholder="Ansvarlig"
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
                  <Label>Nødvendig verneutstyr (PVU)</Label>
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
                    <Label htmlFor="healthMonitoring">Helseundersøkelse påkrevd</Label>
                  </div>
                  {healthMonitoringRequired && (
                    <Textarea
                      value={healthMonitoringDetails}
                      onChange={(e) => setHealthMonitoringDetails(e.target.value)}
                      placeholder="Beskriv type helseundersøkelse og hyppighet..."
                      rows={2}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Tab: Conclusion */}
              <TabsContent value="conclusion" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Konklusjon</Label>
                  <Textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Oppsummer vurderingen og risikobildet..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anbefalinger</Label>
                  <Textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Beskriv anbefalte tiltak og oppfølging..."
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
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
