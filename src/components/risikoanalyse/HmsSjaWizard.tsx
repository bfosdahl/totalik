import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileCheck,
  User,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { HmsSja, HmsSjaRisk, HmsSjaMeasure, useHmsSja } from "@/hooks/useHmsSja";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

interface HmsSjaWizardProps {
  sja: HmsSja;
  onClose: () => void;
}

const CONSEQUENCE_LEVELS = [
  { value: 1, label: "1 - Ubetydelig" },
  { value: 2, label: "2 - Liten" },
  { value: 3, label: "3 - Moderat" },
  { value: 4, label: "4 - Alvorlig" },
  { value: 5, label: "5 - Svært alvorlig" },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: "1 - Svært lite sannsynlig" },
  { value: 2, label: "2 - Lite sannsynlig" },
  { value: 3, label: "3 - Sannsynlig" },
  { value: 4, label: "4 - Meget sannsynlig" },
  { value: 5, label: "5 - Svært sannsynlig" },
];

export function HmsSjaWizard({ sja, onClose }: HmsSjaWizardProps) {
  const { profile } = useAuth();
  const { updateSja, completeSja } = useHmsSja();
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [workDescription, setWorkDescription] = useState(sja.work_description || "");
  const [participants, setParticipants] = useState(sja.participants || "");
  const [emergencyProcedures, setEmergencyProcedures] = useState(sja.emergency_procedures || "");
  const [ppeRequired, setPpeRequired] = useState(sja.ppe_required || "");
  const [risks, setRisks] = useState<HmsSjaRisk[]>(sja.risks || []);
  const [measures, setMeasures] = useState<HmsSjaMeasure[]>(sja.measures || []);
  
  // New risk form
  const [newRisk, setNewRisk] = useState({
    description: "",
    probability: 3,
    consequence: 3,
  });

  const addRisk = () => {
    if (!newRisk.description) return;
    
    const risk: HmsSjaRisk = {
      id: crypto.randomUUID(),
      description: newRisk.description,
      probability: newRisk.probability,
      consequence: newRisk.consequence,
    };
    
    setRisks([...risks, risk]);
    setNewRisk({ description: "", probability: 3, consequence: 3 });
  };

  const removeRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
    // Also remove measures linked to this risk
    setMeasures(measures.filter(m => m.riskId !== id));
  };

  const addMeasure = (riskId: string) => {
    const measure: HmsSjaMeasure = {
      id: crypto.randomUUID(),
      riskId,
      description: "",
      responsible: "",
    };
    setMeasures([...measures, measure]);
  };

  const updateMeasure = (id: string, updates: Partial<HmsSjaMeasure>) => {
    setMeasures(measures.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMeasure = (id: string) => {
    setMeasures(measures.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSja.mutateAsync({
        id: sja.id,
        work_description: workDescription,
        participants,
        emergency_procedures: emergencyProcedures,
        ppe_required: ppeRequired,
        risks,
        measures,
        status: 'active',
      });
      toast.success("SJA lagret");
    } catch (error) {
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Signatur er påkrevd");
      return;
    }

    const signature = sigCanvasRef.current.toDataURL();
    const completedByName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ukjent";

    try {
      await completeSja.mutateAsync({
        id: sja.id,
        leaderSignature: signature,
        completedByName,
      });
      onClose();
    } catch (error) {
      toast.error("Kunne ikke fullføre SJA");
    }
  };

  const getRiskLevel = (probability: number, consequence: number) => {
    const score = probability * consequence;
    if (score <= 4) return { level: "Lav", color: "bg-green-100 text-green-700" };
    if (score <= 9) return { level: "Moderat", color: "bg-yellow-100 text-yellow-700" };
    if (score <= 15) return { level: "Høy", color: "bg-orange-100 text-orange-700" };
    return { level: "Svært høy", color: "bg-red-100 text-red-700" };
  };

  const isCompleted = sja.status === "completed";

  const steps = [
    { number: 1, title: "Arbeidsbeskrivelse", icon: FileCheck },
    { number: 2, title: "Risikoer", icon: AlertTriangle },
    { number: 3, title: "Tiltak", icon: Shield },
    { number: 4, title: "Signering", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sja.sja_number}</Badge>
              {isCompleted && <Badge className="bg-green-100 text-green-700">Fullført</Badge>}
            </div>
            <h1 className="text-xl font-bold">{sja.title}</h1>
          </div>
        </div>
        {!isCompleted && (
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Lagrer..." : "Lagre"}
          </Button>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.number;
          const isComplete = currentStep > step.number;

          return (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "bg-green-100 text-green-700",
                  !isActive && !isComplete && "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  isComplete ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Arbeidsbeskrivelse
              </h2>
              
              <div>
                <label className="text-sm font-medium">Beskrivelse av arbeidet som skal utføres *</label>
                <Textarea 
                  placeholder="Beskriv arbeidet i detalj..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Deltakere (navn)</label>
                <Input 
                  placeholder="F.eks. Ola Nordmann, Kari Hansen"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nødprosedyrer</label>
                <Textarea 
                  placeholder="Beskriv nødprosedyrer ved ulykke..."
                  value={emergencyProcedures}
                  onChange={(e) => setEmergencyProcedures(e.target.value)}
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Påkrevd verneutstyr (PPE)</label>
                <Input 
                  placeholder="F.eks. Hjelm, vernebriller, hansker"
                  value={ppeRequired}
                  onChange={(e) => setPpeRequired(e.target.value)}
                  disabled={isCompleted}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setCurrentStep(2)}>
                  Neste: Risikoer
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Identifiser risikoer
              </h2>

              {!isCompleted && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium">Beskriv risiko/fare</label>
                      <Textarea 
                        placeholder="Hva kan gå galt?"
                        value={newRisk.description}
                        onChange={(e) => setNewRisk(p => ({ ...p, description: e.target.value }))}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Sannsynlighet</label>
                        <Select 
                          value={newRisk.probability.toString()}
                          onValueChange={(v) => setNewRisk(p => ({ ...p, probability: parseInt(v) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBABILITY_LEVELS.map(l => (
                              <SelectItem key={l.value} value={l.value.toString()}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Konsekvens</label>
                        <Select 
                          value={newRisk.consequence.toString()}
                          onValueChange={(v) => setNewRisk(p => ({ ...p, consequence: parseInt(v) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONSEQUENCE_LEVELS.map(l => (
                              <SelectItem key={l.value} value={l.value.toString()}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={addRisk} disabled={!newRisk.description}>
                      <Plus className="h-4 w-4 mr-2" />
                      Legg til risiko
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Risk list */}
              <div className="space-y-2">
                {risks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Ingen risikoer identifisert ennå</p>
                  </div>
                ) : (
                  risks.map(risk => {
                    const riskLevel = getRiskLevel(risk.probability, risk.consequence);
                    return (
                      <div key={risk.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{risk.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>S: {risk.probability}</span>
                              <span>×</span>
                              <span>K: {risk.consequence}</span>
                              <span>=</span>
                              <Badge className={riskLevel.color}>
                                {risk.probability * risk.consequence} - {riskLevel.level}
                              </Badge>
                            </div>
                          </div>
                          {!isCompleted && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeRisk(risk.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Tilbake
                </Button>
                <Button onClick={() => setCurrentStep(3)} disabled={risks.length === 0}>
                  Neste: Tiltak
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Definer tiltak
              </h2>

              {risks.map(risk => {
                const riskMeasures = measures.filter(m => m.riskId === risk.id);
                const riskLevel = getRiskLevel(risk.probability, risk.consequence);

                return (
                  <Card key={risk.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{risk.description}</CardTitle>
                          <Badge className={cn("mt-1", riskLevel.color)}>{riskLevel.level}</Badge>
                        </div>
                        {!isCompleted && (
                          <Button size="sm" variant="outline" onClick={() => addMeasure(risk.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Tiltak
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {riskMeasures.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ingen tiltak definert</p>
                      ) : (
                        <div className="space-y-2">
                          {riskMeasures.map(measure => (
                            <div key={measure.id} className="flex items-center gap-2">
                              <Input 
                                placeholder="Beskriv tiltak..."
                                value={measure.description}
                                onChange={(e) => updateMeasure(measure.id, { description: e.target.value })}
                                className="flex-1"
                                disabled={isCompleted}
                              />
                              <Input 
                                placeholder="Ansvarlig"
                                value={measure.responsible}
                                onChange={(e) => updateMeasure(measure.id, { responsible: e.target.value })}
                                className="w-32"
                                disabled={isCompleted}
                              />
                              {!isCompleted && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => removeMeasure(measure.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Tilbake
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Neste: Signering
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Signering og godkjenning
              </h2>

              {isCompleted ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">SJA er fullført og signert</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Signert av {sja.completed_by_name} den{" "}
                      {sja.completed_at && new Date(sja.completed_at).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  {sja.leader_signature && (
                    <div>
                      <label className="text-sm font-medium">Signatur</label>
                      <img 
                        src={sja.leader_signature} 
                        alt="Signatur" 
                        className="border rounded-lg max-h-32 bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                      Ved å signere bekrefter du at alle har forstått risikoene og tiltakene som er beskrevet i denne SJA-en.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Din signatur *</label>
                    <div className="border rounded-lg bg-white mt-1">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        canvasProps={{
                          className: "w-full h-40",
                          style: { width: "100%", height: "160px" }
                        }}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => sigCanvasRef.current?.clear()}
                    >
                      Tøm signatur
                    </Button>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>
                      Tilbake
                    </Button>
                    <Button 
                      onClick={handleComplete} 
                      disabled={completeSja.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {completeSja.isPending ? "Fullfører..." : "Fullfør og signer SJA"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
