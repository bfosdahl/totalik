import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useForsvarlighetsvurderinger, type Forsvarlighetsvurdering, type RiskFactor, type RequiredMeasure, type TrainingTopic } from "@/hooks/useForsvarlighetsvurderinger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SignatureCanvas from "react-signature-canvas";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { t } from "@/i18n/t";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  PenLine,
  Users,
  Calendar,
  Shield,
  ClipboardCheck,
  Loader2,
  ChevronRight,
  GraduationCap,
  Timer,
  AlertCircle,
  Eye
} from "lucide-react";

const assessmentTypeLabels = {
  kortere_opplaring: "Kortere HMS-opplæring for verneombud",
  arbeidstid: "Arbeidstidsordning",
  annet: "Annen forsvarlighetsvurdering",
};

const conclusionLabels = {
  forsvarlig: "Forsvarlig",
  ikke_forsvarlig: "Ikke forsvarlig",
  forsvarlig_med_tiltak: "Forsvarlig med tiltak",
};

const conclusionColors = {
  forsvarlig: "bg-success/10 text-success",
  ikke_forsvarlig: "bg-destructive/10 text-destructive",
  forsvarlig_med_tiltak: "bg-warning/10 text-warning",
};

const statusLabels = {
  draft: "Utkast",
  pending_signatures: "Venter på signaturer",
  completed: "Fullført",
  archived: "Arkivert",
};

export default function ForsvarlighetsvurderingForm() {
  const { profile } = useAuth();
  const { vurderinger, isLoading, create, update, delete: deleteVurdering, isCreating } = useForsvarlighetsvurderinger();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedVurdering, setSelectedVurdering] = useState<Forsvarlighetsvurdering | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form state for new/edit
  const [formData, setFormData] = useState({
    assessment_type: "kortere_opplaring" as "kortere_opplaring" | "arbeidstid" | "annet",
    title: "",
    description: "",
    employer_name: "",
    employer_title: "",
    verneombud_name: "",
    tillitsvalgt_name: "",
    other_participants: "",
    risk_level: "" as "lav" | "moderat" | "hoy" | "",
    risk_justification: "",
    proposed_training_hours: "",
    training_justification: "",
    work_schedule_description: "",
    fatigue_assessment: "",
    work_life_balance_assessment: "",
    conclusion: "forsvarlig" as "forsvarlig" | "ikke_forsvarlig" | "forsvarlig_med_tiltak",
    conclusion_justification: "",
    next_review_date: "",
    review_frequency: "",
  });

  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [requiredMeasures, setRequiredMeasures] = useState<RequiredMeasure[]>([]);
  const [trainingTopics, setTrainingTopics] = useState<TrainingTopic[]>([]);

  // Signature refs
  const employerSigRef = useRef<SignatureCanvas | null>(null);
  const verneombudSigRef = useRef<SignatureCanvas | null>(null);
  const tillitsvalgtSigRef = useRef<SignatureCanvas | null>(null);

  const resetForm = () => {
    setFormData({
      assessment_type: "kortere_opplaring",
      title: "",
      description: "",
      employer_name: "",
      employer_title: "",
      verneombud_name: "",
      tillitsvalgt_name: "",
      other_participants: "",
      risk_level: "",
      risk_justification: "",
      proposed_training_hours: "",
      training_justification: "",
      work_schedule_description: "",
      fatigue_assessment: "",
      work_life_balance_assessment: "",
      conclusion: "forsvarlig",
      conclusion_justification: "",
      next_review_date: "",
      review_frequency: "",
    });
    setRiskFactors([]);
    setRequiredMeasures([]);
    setTrainingTopics([]);
    employerSigRef.current?.clear();
    verneombudSigRef.current?.clear();
    tillitsvalgtSigRef.current?.clear();
  };

  const handleCreateNew = async () => {
    if (!formData.title.trim() || !formData.employer_name.trim()) {
      toast.error(t("auto.fyll_inn_tittel_og_arbeidsgiver"));
      return;
    }

    const employerSig = employerSigRef.current?.isEmpty() ? null : employerSigRef.current?.toDataURL();
    const verneombudSig = verneombudSigRef.current?.isEmpty() ? null : verneombudSigRef.current?.toDataURL();
    const tillitsvalgtSig = tillitsvalgtSigRef.current?.isEmpty() ? null : tillitsvalgtSigRef.current?.toDataURL();

    const hasAllSignatures = employerSig && verneombudSig;
    
    await create({
      ...formData,
      risk_level: formData.risk_level || null,
      proposed_training_hours: formData.proposed_training_hours ? parseInt(formData.proposed_training_hours) : null,
      risk_factors: riskFactors,
      required_measures: requiredMeasures,
      training_topics: trainingTopics,
      employer_signature: employerSig,
      employer_signed_at: employerSig ? new Date().toISOString() : null,
      verneombud_signature: verneombudSig,
      verneombud_signed_at: verneombudSig ? new Date().toISOString() : null,
      tillitsvalgt_signature: tillitsvalgtSig,
      tillitsvalgt_signed_at: tillitsvalgtSig ? new Date().toISOString() : null,
      status: hasAllSignatures ? "completed" : "draft",
    });

    setShowNewDialog(false);
    resetForm();
  };

  const handleView = (vurdering: Forsvarlighetsvurdering) => {
    setSelectedVurdering(vurdering);
    setShowViewDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne vurderingen?")) {
      await deleteVurdering(id);
    }
  };

  const addRiskFactor = () => {
    setRiskFactors([...riskFactors, {
      id: crypto.randomUUID(),
      category: "",
      description: "",
      severity: "moderat",
    }]);
  };

  const addRequiredMeasure = () => {
    setRequiredMeasures([...requiredMeasures, {
      id: crypto.randomUUID(),
      description: "",
      responsible: "",
      deadline: "",
      completed: false,
    }]);
  };

  const addTrainingTopic = () => {
    setTrainingTopics([...trainingTopics, {
      id: crypto.randomUUID(),
      topic: "",
      hours: 0,
    }]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 shadow-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">{t("auto.forsvarlighetsvurdering")}</h2>
              <p className="text-muted-foreground text-sm">
                {t("auto.dokumenter_vurderinger_for_kortere_hms_o")}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("auto.ny_vurdering")}
          </Button>
        </div>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-info/5 border border-info/20 rounded-xl p-4"
      >
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">{t("auto.naar_skal_dette_brukes")}</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("auto.foer_avtale_om_kortere_hms_opplaering_en")}</li>
              <li>{t("auto.foer_nye_arbeidstidsordninger_turnus_ive")}</li>
              <li>{t("auto.ved_endringer_i_systemer_som_paavirker_h")}</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* List of existing assessments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold">{t("auto.lagrede_vurderinger")}</h3>
        
        {vurderinger.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t("auto.ingen_forsvarlighetsvurderinger_registre")}</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("auto.opprett_foerste_vurdering")}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vurderinger.map((v) => (
              <Card key={v.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(v)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${v.status === "completed" ? "bg-success/10" : "bg-muted"}`}>
                        {v.assessment_type === "kortere_opplaring" ? (
                          <GraduationCap className={`w-5 h-5 ${v.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                        ) : v.assessment_type === "arbeidstid" ? (
                          <Timer className={`w-5 h-5 ${v.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                        ) : (
                          <FileText className={`w-5 h-5 ${v.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{v.assessment_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {assessmentTypeLabels[v.assessment_type]}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{v.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(v.assessment_date), "d. MMM yyyy", { locale: nb })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {v.employer_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={conclusionColors[v.conclusion]}>
                        {conclusionLabels[v.conclusion]}
                      </Badge>
                      <Badge variant={v.status === "completed" ? "default" : "secondary"}>
                        {statusLabels[v.status]}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* New Assessment Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t("auto.ny_forsvarlighetsvurdering")}
            </DialogTitle>
            <DialogDescription>
              {t("auto.fyll_ut_skjemaet_for_aa_dokumentere_en_f")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-6 py-4">
              {/* Basic info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Grunnleggende informasjon
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t("auto.type_vurdering")}</Label>
                    <Select
                      value={formData.assessment_type}
                      onValueChange={(v) => setFormData({ ...formData, assessment_type: v as typeof formData.assessment_type })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kortere_opplaring">{t("auto.kortere_hms_opplaering_for_verneombud")}</SelectItem>
                        <SelectItem value="arbeidstid">{t("auto.arbeidstidsordning")}</SelectItem>
                        <SelectItem value="annet">{t("auto.annen_forsvarlighetsvurdering")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("auto.tittel_2")}</Label>
                    <Input
                      className="mt-1"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t("auto.f_eks_vurdering_av_kortere_opplaering_20")}
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("auto.beskrivelse")}</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("auto.beskriv_bakgrunnen_for_vurderingen")}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Participants */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Deltakere
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Arbeidsgiver (navn) *</Label>
                    <Input
                      className="mt-1"
                      value={formData.employer_name}
                      onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                      placeholder={t("auto.navn_paa_arbeidsgiver_leder")}
                    />
                  </div>
                  <div>
                    <Label>Arbeidsgiver (tittel)</Label>
                    <Input
                      className="mt-1"
                      value={formData.employer_title}
                      onChange={(e) => setFormData({ ...formData, employer_title: e.target.value })}
                      placeholder={t("auto.f_eks_daglig_leder")}
                    />
                  </div>
                  <div>
                    <Label>{t("auto.verneombud")}</Label>
                    <Input
                      className="mt-1"
                      value={formData.verneombud_name}
                      onChange={(e) => setFormData({ ...formData, verneombud_name: e.target.value })}
                      placeholder={t("auto.navn_paa_verneombud")}
                    />
                  </div>
                  <div>
                    <Label>{t("auto.tillitsvalgt")}</Label>
                    <Input
                      className="mt-1"
                      value={formData.tillitsvalgt_name}
                      onChange={(e) => setFormData({ ...formData, tillitsvalgt_name: e.target.value })}
                      placeholder={t("auto.navn_paa_tillitsvalgt")}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{t("auto.andre_deltakere")}</Label>
                  <Input
                    className="mt-1"
                    value={formData.other_participants}
                    onChange={(e) => setFormData({ ...formData, other_participants: e.target.value })}
                    placeholder={t("auto.f_eks_vara_verneombud_hms_raadgiver")}
                  />
                </div>
              </div>

              <Separator />

              {/* Risk Assessment */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risikovurdering
                </h3>

                <div>
                  <Label>{t("auto.overordnet_risikonivaa")}</Label>
                  <Select
                    value={formData.risk_level}
                    onValueChange={(v) => setFormData({ ...formData, risk_level: v as typeof formData.risk_level })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("auto.velg_risikonivaa")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lav">{t("auto.lav_risiko")}</SelectItem>
                      <SelectItem value="moderat">{t("auto.moderat_risiko")}</SelectItem>
                      <SelectItem value="hoy">{t("auto.hoey_risiko")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("auto.begrunnelse_for_risikovurdering")}</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.risk_justification}
                    onChange={(e) => setFormData({ ...formData, risk_justification: e.target.value })}
                    placeholder={t("auto.beskriv_hvilke_risikofaktorer_som_er_vur")}
                    rows={3}
                  />
                </div>

                {/* Risk factors list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t("auto.identifiserte_risikofaktorer")}</Label>
                    <Button variant="outline" size="sm" onClick={addRiskFactor}>
                      <Plus className="w-3 h-3 mr-1" />
                      {t("auto.legg_til")}
                    </Button>
                  </div>
                  {riskFactors.map((rf, idx) => (
                    <div key={rf.id} className="flex gap-2 mb-2">
                      <Input
                        placeholder={t("auto.kategori")}
                        value={rf.category}
                        onChange={(e) => {
                          const updated = [...riskFactors];
                          updated[idx].category = e.target.value;
                          setRiskFactors(updated);
                        }}
                        className="w-32"
                      />
                      <Input
                        placeholder={t("auto.beskrivelse_av_risikofaktor")}
                        value={rf.description}
                        onChange={(e) => {
                          const updated = [...riskFactors];
                          updated[idx].description = e.target.value;
                          setRiskFactors(updated);
                        }}
                        className="flex-1"
                      />
                      <Select
                        value={rf.severity}
                        onValueChange={(v) => {
                          const updated = [...riskFactors];
                          updated[idx].severity = v as "lav" | "moderat" | "hoy";
                          setRiskFactors(updated);
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lav">{t("auto.lav")}</SelectItem>
                          <SelectItem value="moderat">{t("auto.moderat")}</SelectItem>
                          <SelectItem value="hoy">{t("auto.hoey")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRiskFactors(riskFactors.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Type-specific fields */}
              {formData.assessment_type === "kortere_opplaring" && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {t("auto.opplaering_spesifikke_felt")}
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>{t("auto.foreslaatt_opplaeringstimer")}</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={formData.proposed_training_hours}
                        onChange={(e) => setFormData({ ...formData, proposed_training_hours: e.target.value })}
                        placeholder={t("auto.f_eks_24")}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t("auto.lovens_minimum_er_40_timer")}</p>
                    </div>
                  </div>

                  <div>
                    <Label>{t("auto.begrunnelse_for_kortere_opplaering")}</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.training_justification}
                      onChange={(e) => setFormData({ ...formData, training_justification: e.target.value })}
                      placeholder={t("auto.begrunn_hvorfor_kortere_opplaering_er_fo")}
                      rows={3}
                    />
                  </div>

                  {/* Training topics */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{t("auto.opplaeringsemner_som_skal_dekkes")}</Label>
                      <Button variant="outline" size="sm" onClick={addTrainingTopic}>
                        <Plus className="w-3 h-3 mr-1" />
                        {t("auto.legg_til")}
                      </Button>
                    </div>
                    {trainingTopics.map((tt, idx) => (
                      <div key={tt.id} className="flex gap-2 mb-2">
                        <Input
                          placeholder={t("auto.emne_2")}
                          value={tt.topic}
                          onChange={(e) => {
                            const updated = [...trainingTopics];
                            updated[idx].topic = e.target.value;
                            setTrainingTopics(updated);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder={t("auto.timer")}
                          value={tt.hours || ""}
                          onChange={(e) => {
                            const updated = [...trainingTopics];
                            updated[idx].hours = parseInt(e.target.value) || 0;
                            setTrainingTopics(updated);
                          }}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTrainingTopics(trainingTopics.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.assessment_type === "arbeidstid" && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Arbeidstid - spesifikke felt
                  </h3>
                  
                  <div>
                    <Label>{t("auto.beskrivelse_av_arbeidstidsordning")}</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.work_schedule_description}
                      onChange={(e) => setFormData({ ...formData, work_schedule_description: e.target.value })}
                      placeholder={t("auto.beskriv_vaktordning_turnus_eller_arbeids")}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>{t("auto.vurdering_av_tretthet_og_aarvaakenhet")}</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.fatigue_assessment}
                      onChange={(e) => setFormData({ ...formData, fatigue_assessment: e.target.value })}
                      placeholder={t("auto.hvordan_paavirker_ordningen_tretthet_og_")}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>{t("auto.vurdering_av_balanse_mellom_jobb_og_frit")}</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.work_life_balance_assessment}
                      onChange={(e) => setFormData({ ...formData, work_life_balance_assessment: e.target.value })}
                      placeholder={t("auto.hvordan_paavirker_ordningen_arbeidstaker")}
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Conclusion */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Konklusjon
                </h3>
                
                <div>
                  <Label>{t("auto.vurderingens_konklusjon")}</Label>
                  <Select
                    value={formData.conclusion}
                    onValueChange={(v) => setFormData({ ...formData, conclusion: v as typeof formData.conclusion })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forsvarlig">{t("auto.forsvarlig")}</SelectItem>
                      <SelectItem value="forsvarlig_med_tiltak">{t("auto.forsvarlig_med_tiltak")}</SelectItem>
                      <SelectItem value="ikke_forsvarlig">{t("auto.ikke_forsvarlig")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("auto.begrunnelse_for_konklusjon")}</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.conclusion_justification}
                    onChange={(e) => setFormData({ ...formData, conclusion_justification: e.target.value })}
                    placeholder={t("auto.begrunn_konklusjonen")}
                    rows={3}
                  />
                </div>

                {formData.conclusion === "forsvarlig_med_tiltak" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{t("auto.noedvendige_tiltak")}</Label>
                      <Button variant="outline" size="sm" onClick={addRequiredMeasure}>
                        <Plus className="w-3 h-3 mr-1" />
                        {t("auto.legg_til")}
                      </Button>
                    </div>
                    {requiredMeasures.map((rm, idx) => (
                      <div key={rm.id} className="flex gap-2 mb-2 flex-wrap">
                        <Input
                          placeholder={t("auto.tiltak")}
                          value={rm.description}
                          onChange={(e) => {
                            const updated = [...requiredMeasures];
                            updated[idx].description = e.target.value;
                            setRequiredMeasures(updated);
                          }}
                          className="flex-1 min-w-[200px]"
                        />
                        <Input
                          placeholder={t("auto.ansvarlig_2")}
                          value={rm.responsible}
                          onChange={(e) => {
                            const updated = [...requiredMeasures];
                            updated[idx].responsible = e.target.value;
                            setRequiredMeasures(updated);
                          }}
                          className="w-32"
                        />
                        <Input
                          type="date"
                          value={rm.deadline}
                          onChange={(e) => {
                            const updated = [...requiredMeasures];
                            updated[idx].deadline = e.target.value;
                            setRequiredMeasures(updated);
                          }}
                          className="w-36"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRequiredMeasures(requiredMeasures.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Follow-up */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("auto.oppfoelging")}
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t("auto.neste_gjennomgang")}</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={formData.next_review_date}
                      onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("auto.gjennomgangsfrekvens")}</Label>
                    <Select
                      value={formData.review_frequency}
                      onValueChange={(v) => setFormData({ ...formData, review_frequency: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={t("auto.velg_frekvens")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arlig">{t("auto.aarlig")}</SelectItem>
                        <SelectItem value="halvaarlig">{t("auto.halvaarlig")}</SelectItem>
                        <SelectItem value="kvartalsvis">{t("auto.kvartalsvis")}</SelectItem>
                        <SelectItem value="ved_behov">{t("auto.ved_behov")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signatures */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <PenLine className="w-4 h-4" />
                  Signaturer
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auto.alle_parter_boer_signere_for_aa_bekrefte")}
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Employer signature */}
                  <div>
                    <Label>{t("auto.arbeidsgiver")}</Label>
                    <div className="mt-1 border rounded-lg bg-white">
                      <SignatureCanvas
                        ref={employerSigRef}
                        canvasProps={{ className: "w-full h-24 touch-none" }}
                        backgroundColor="white"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => employerSigRef.current?.clear()}
                    >
                      {t("auto.toem")}
                    </Button>
                  </div>

                  {/* Verneombud signature */}
                  <div>
                    <Label>{t("auto.verneombud")}</Label>
                    <div className="mt-1 border rounded-lg bg-white">
                      <SignatureCanvas
                        ref={verneombudSigRef}
                        canvasProps={{ className: "w-full h-24 touch-none" }}
                        backgroundColor="white"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => verneombudSigRef.current?.clear()}
                    >
                      {t("auto.toem")}
                    </Button>
                  </div>

                  {/* Tillitsvalgt signature */}
                  <div>
                    <Label>Tillitsvalgt (valgfri)</Label>
                    <div className="mt-1 border rounded-lg bg-white">
                      <SignatureCanvas
                        ref={tillitsvalgtSigRef}
                        canvasProps={{ className: "w-full h-24 touch-none" }}
                        backgroundColor="white"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => tillitsvalgtSigRef.current?.clear()}
                    >
                      {t("auto.toem")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); resetForm(); }}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleCreateNew} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lagre vurdering
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {selectedVurdering?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedVurdering?.assessment_number} • {assessmentTypeLabels[selectedVurdering?.assessment_type || "annet"]}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            {selectedVurdering && (
              <div className="space-y-6 py-4">
                {/* Status badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge className={conclusionColors[selectedVurdering.conclusion]}>
                    {conclusionLabels[selectedVurdering.conclusion]}
                  </Badge>
                  <Badge variant={selectedVurdering.status === "completed" ? "default" : "secondary"}>
                    {statusLabels[selectedVurdering.status]}
                  </Badge>
                </div>

                {/* Description */}
                {selectedVurdering.description && (
                  <div>
                    <Label className="text-muted-foreground">{t("auto.beskrivelse")}</Label>
                    <p className="mt-1">{selectedVurdering.description}</p>
                  </div>
                )}

                {/* Participants */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Deltakere
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("auto.arbeidsgiver_2")}</span>
                      <span>{selectedVurdering.employer_name} {selectedVurdering.employer_title && `(${selectedVurdering.employer_title})`}</span>
                    </div>
                    {selectedVurdering.verneombud_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("auto.verneombud_2")}</span>
                        <span>{selectedVurdering.verneombud_name}</span>
                      </div>
                    )}
                    {selectedVurdering.tillitsvalgt_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("auto.tillitsvalgt_2")}</span>
                        <span>{selectedVurdering.tillitsvalgt_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Risk assessment */}
                {(selectedVurdering.risk_level || selectedVurdering.risk_justification) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Risikovurdering
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {selectedVurdering.risk_level && (
                        <Badge variant="outline" className="capitalize">
                          {selectedVurdering.risk_level} risiko
                        </Badge>
                      )}
                      {selectedVurdering.risk_justification && (
                        <p className="text-muted-foreground">{selectedVurdering.risk_justification}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Conclusion */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Konklusjon
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Badge className={conclusionColors[selectedVurdering.conclusion]}>
                      {conclusionLabels[selectedVurdering.conclusion]}
                    </Badge>
                    {selectedVurdering.conclusion_justification && (
                      <p className="text-muted-foreground">{selectedVurdering.conclusion_justification}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Signatures */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenLine className="w-4 h-4" />
                      Signaturer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("auto.arbeidsgiver")}</p>
                      {selectedVurdering.employer_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.employer_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t("auto.ikke_signert")}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("auto.verneombud")}</p>
                      {selectedVurdering.verneombud_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.verneombud_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t("auto.ikke_signert")}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("auto.tillitsvalgt")}</p>
                      {selectedVurdering.tillitsvalgt_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.tillitsvalgt_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t("auto.ikke_signert")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>

          <Separator className="my-4" />

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedVurdering) {
                  handleDelete(selectedVurdering.id);
                  setShowViewDialog(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("auto.slett")}
            </Button>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              {t("auto.lukk")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
