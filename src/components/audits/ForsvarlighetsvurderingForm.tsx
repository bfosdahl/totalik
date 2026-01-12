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
      toast.error("Fyll inn tittel og arbeidsgiver");
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
              <h2 className="text-lg font-semibold mb-1">Forsvarlighetsvurdering</h2>
              <p className="text-muted-foreground text-sm">
                Dokumenter vurderinger for kortere HMS-opplæring, arbeidstidsordninger eller andre forhold 
                som krever en felles vurdering mellom arbeidsgiver, verneombud og tillitsvalgte.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ny vurdering
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
            <p className="font-medium text-info mb-1">Når skal dette brukes?</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Før avtale om kortere HMS-opplæring enn 40 timer for verneombud</li>
              <li>Før nye arbeidstidsordninger/turnus iverksettes</li>
              <li>Ved endringer i systemer som påvirker helse og sikkerhet</li>
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
        <h3 className="text-lg font-semibold">Lagrede vurderinger</h3>
        
        {vurderinger.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Ingen forsvarlighetsvurderinger registrert ennå.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Opprett første vurdering
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
              Ny forsvarlighetsvurdering
            </DialogTitle>
            <DialogDescription>
              Fyll ut skjemaet for å dokumentere en forsvarlighetsvurdering
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Basic info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Grunnleggende informasjon
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Type vurdering</Label>
                    <Select
                      value={formData.assessment_type}
                      onValueChange={(v) => setFormData({ ...formData, assessment_type: v as typeof formData.assessment_type })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kortere_opplaring">Kortere HMS-opplæring for verneombud</SelectItem>
                        <SelectItem value="arbeidstid">Arbeidstidsordning</SelectItem>
                        <SelectItem value="annet">Annen forsvarlighetsvurdering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tittel *</Label>
                    <Input
                      className="mt-1"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="F.eks. Vurdering av kortere opplæring 2025"
                    />
                  </div>
                </div>

                <div>
                  <Label>Beskrivelse</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskriv bakgrunnen for vurderingen..."
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
                      placeholder="Navn på arbeidsgiver/leder"
                    />
                  </div>
                  <div>
                    <Label>Arbeidsgiver (tittel)</Label>
                    <Input
                      className="mt-1"
                      value={formData.employer_title}
                      onChange={(e) => setFormData({ ...formData, employer_title: e.target.value })}
                      placeholder="F.eks. Daglig leder"
                    />
                  </div>
                  <div>
                    <Label>Verneombud</Label>
                    <Input
                      className="mt-1"
                      value={formData.verneombud_name}
                      onChange={(e) => setFormData({ ...formData, verneombud_name: e.target.value })}
                      placeholder="Navn på verneombud"
                    />
                  </div>
                  <div>
                    <Label>Tillitsvalgt</Label>
                    <Input
                      className="mt-1"
                      value={formData.tillitsvalgt_name}
                      onChange={(e) => setFormData({ ...formData, tillitsvalgt_name: e.target.value })}
                      placeholder="Navn på tillitsvalgt"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Andre deltakere</Label>
                  <Input
                    className="mt-1"
                    value={formData.other_participants}
                    onChange={(e) => setFormData({ ...formData, other_participants: e.target.value })}
                    placeholder="F.eks. Vara-verneombud, HMS-rådgiver"
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
                  <Label>Overordnet risikonivå</Label>
                  <Select
                    value={formData.risk_level}
                    onValueChange={(v) => setFormData({ ...formData, risk_level: v as typeof formData.risk_level })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Velg risikonivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lav">Lav risiko</SelectItem>
                      <SelectItem value="moderat">Moderat risiko</SelectItem>
                      <SelectItem value="hoy">Høy risiko</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Begrunnelse for risikovurdering</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.risk_justification}
                    onChange={(e) => setFormData({ ...formData, risk_justification: e.target.value })}
                    placeholder="Beskriv hvilke risikofaktorer som er vurdert..."
                    rows={3}
                  />
                </div>

                {/* Risk factors list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Identifiserte risikofaktorer</Label>
                    <Button variant="outline" size="sm" onClick={addRiskFactor}>
                      <Plus className="w-3 h-3 mr-1" />
                      Legg til
                    </Button>
                  </div>
                  {riskFactors.map((rf, idx) => (
                    <div key={rf.id} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Kategori"
                        value={rf.category}
                        onChange={(e) => {
                          const updated = [...riskFactors];
                          updated[idx].category = e.target.value;
                          setRiskFactors(updated);
                        }}
                        className="w-32"
                      />
                      <Input
                        placeholder="Beskrivelse av risikofaktor"
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
                          <SelectItem value="lav">Lav</SelectItem>
                          <SelectItem value="moderat">Moderat</SelectItem>
                          <SelectItem value="hoy">Høy</SelectItem>
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
                    Opplæring - spesifikke felt
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Foreslått opplæringstimer</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        value={formData.proposed_training_hours}
                        onChange={(e) => setFormData({ ...formData, proposed_training_hours: e.target.value })}
                        placeholder="F.eks. 24"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Lovens minimum er 40 timer</p>
                    </div>
                  </div>

                  <div>
                    <Label>Begrunnelse for kortere opplæring</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.training_justification}
                      onChange={(e) => setFormData({ ...formData, training_justification: e.target.value })}
                      placeholder="Begrunn hvorfor kortere opplæring er forsvarlig..."
                      rows={3}
                    />
                  </div>

                  {/* Training topics */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Opplæringsemner som skal dekkes</Label>
                      <Button variant="outline" size="sm" onClick={addTrainingTopic}>
                        <Plus className="w-3 h-3 mr-1" />
                        Legg til
                      </Button>
                    </div>
                    {trainingTopics.map((tt, idx) => (
                      <div key={tt.id} className="flex gap-2 mb-2">
                        <Input
                          placeholder="Emne"
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
                          placeholder="Timer"
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
                    <Label>Beskrivelse av arbeidstidsordning</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.work_schedule_description}
                      onChange={(e) => setFormData({ ...formData, work_schedule_description: e.target.value })}
                      placeholder="Beskriv vaktordning, turnus, eller arbeidstidsordning..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Vurdering av tretthet og årvåkenhet</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.fatigue_assessment}
                      onChange={(e) => setFormData({ ...formData, fatigue_assessment: e.target.value })}
                      placeholder="Hvordan påvirker ordningen tretthet og årvåkenhet?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Vurdering av balanse mellom jobb og fritid</Label>
                    <Textarea
                      className="mt-1"
                      value={formData.work_life_balance_assessment}
                      onChange={(e) => setFormData({ ...formData, work_life_balance_assessment: e.target.value })}
                      placeholder="Hvordan påvirker ordningen arbeidstakers fritid og familieliv?"
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
                  <Label>Vurderingens konklusjon</Label>
                  <Select
                    value={formData.conclusion}
                    onValueChange={(v) => setFormData({ ...formData, conclusion: v as typeof formData.conclusion })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forsvarlig">Forsvarlig</SelectItem>
                      <SelectItem value="forsvarlig_med_tiltak">Forsvarlig med tiltak</SelectItem>
                      <SelectItem value="ikke_forsvarlig">Ikke forsvarlig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Begrunnelse for konklusjon</Label>
                  <Textarea
                    className="mt-1"
                    value={formData.conclusion_justification}
                    onChange={(e) => setFormData({ ...formData, conclusion_justification: e.target.value })}
                    placeholder="Begrunn konklusjonen..."
                    rows={3}
                  />
                </div>

                {formData.conclusion === "forsvarlig_med_tiltak" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Nødvendige tiltak</Label>
                      <Button variant="outline" size="sm" onClick={addRequiredMeasure}>
                        <Plus className="w-3 h-3 mr-1" />
                        Legg til
                      </Button>
                    </div>
                    {requiredMeasures.map((rm, idx) => (
                      <div key={rm.id} className="flex gap-2 mb-2 flex-wrap">
                        <Input
                          placeholder="Tiltak"
                          value={rm.description}
                          onChange={(e) => {
                            const updated = [...requiredMeasures];
                            updated[idx].description = e.target.value;
                            setRequiredMeasures(updated);
                          }}
                          className="flex-1 min-w-[200px]"
                        />
                        <Input
                          placeholder="Ansvarlig"
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
                  Oppfølging
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Neste gjennomgang</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={formData.next_review_date}
                      onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Gjennomgangsfrekvens</Label>
                    <Select
                      value={formData.review_frequency}
                      onValueChange={(v) => setFormData({ ...formData, review_frequency: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Velg frekvens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arlig">Årlig</SelectItem>
                        <SelectItem value="halvaarlig">Halvårlig</SelectItem>
                        <SelectItem value="kvartalsvis">Kvartalsvis</SelectItem>
                        <SelectItem value="ved_behov">Ved behov</SelectItem>
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
                  Alle parter bør signere for å bekrefte at vurderingen er gjennomført i fellesskap.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Employer signature */}
                  <div>
                    <Label>Arbeidsgiver</Label>
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
                      Tøm
                    </Button>
                  </div>

                  {/* Verneombud signature */}
                  <div>
                    <Label>Verneombud</Label>
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
                      Tøm
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
                      Tøm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewDialog(false); resetForm(); }}>
              Avbryt
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

          <ScrollArea className="flex-1 pr-4">
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
                    <Label className="text-muted-foreground">Beskrivelse</Label>
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
                      <span className="text-muted-foreground">Arbeidsgiver:</span>
                      <span>{selectedVurdering.employer_name} {selectedVurdering.employer_title && `(${selectedVurdering.employer_title})`}</span>
                    </div>
                    {selectedVurdering.verneombud_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verneombud:</span>
                        <span>{selectedVurdering.verneombud_name}</span>
                      </div>
                    )}
                    {selectedVurdering.tillitsvalgt_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tillitsvalgt:</span>
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
                      <p className="text-sm text-muted-foreground mb-1">Arbeidsgiver</p>
                      {selectedVurdering.employer_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.employer_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Ikke signert</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Verneombud</p>
                      {selectedVurdering.verneombud_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.verneombud_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Ikke signert</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tillitsvalgt</p>
                      {selectedVurdering.tillitsvalgt_signature ? (
                        <div className="border rounded p-1 bg-muted/20">
                          <img src={selectedVurdering.tillitsvalgt_signature} alt="Signatur" className="max-h-16" />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Ikke signert</p>
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
              Slett
            </Button>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
