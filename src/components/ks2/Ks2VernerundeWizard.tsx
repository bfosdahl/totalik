import { useState } from "react"; // Vernerunde wizard
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2,
  FileText,
  Loader2
} from "lucide-react";
import { VernerundeTemplate, VernerundeCheckpoint } from "@/hooks/useKsModule2VernerundeTemplates";
import { KsModule2Vernerunde, Finding, CheckpointResponse } from "@/hooks/useKsModule2Vernerunder";
import { SignaturePad } from "./SignaturePad";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vernerunde: KsModule2Vernerunde;
  template: VernerundeTemplate | null;
  onComplete: (data: {
    checklist_responses: CheckpointResponse[];
    findings: Finding[];
    signature: string;
    inspector_name: string;
  }) => void;
  isSubmitting?: boolean;
}

export default function Ks2VernerundeWizard({ 
  open, 
  onOpenChange, 
  vernerunde, 
  template,
  onComplete,
  isSubmitting 
}: Props) {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState<CheckpointResponse[]>(() => {
    if (vernerunde.checklist_responses && Array.isArray(vernerunde.checklist_responses) && vernerunde.checklist_responses.length > 0) {
      return vernerunde.checklist_responses;
    }
    return template?.checkpoints.map(cp => ({
      checkpoint_id: cp.id,
      status: null,
      comment: ""
    })) || [];
  });
  const [findings, setFindings] = useState<Finding[]>(vernerunde.findings || []);
  const [newFinding, setNewFinding] = useState<Partial<Finding & { escalate_to_avvik?: boolean }>>({
    description: "",
    responsible: "",
    deadline: "",
    status: "open",
    escalate_to_avvik: false
  });
  const [signature, setSignature] = useState("");
  const [inspectorName, setInspectorName] = useState(vernerunde.responsible_name || "");

  const checkpoints = template?.checkpoints || [];
  const categories = [...new Set(checkpoints.map(cp => cp.category))];

  const handleResponseChange = (checkpointId: string, status: "ok" | "avvik" | "na") => {
    setResponses(prev => prev.map(r => 
      r.checkpoint_id === checkpointId ? { ...r, status } : r
    ));
  };

  const handleCommentChange = (checkpointId: string, comment: string) => {
    setResponses(prev => prev.map(r => 
      r.checkpoint_id === checkpointId ? { ...r, comment } : r
    ));
  };

  const handleAddFinding = () => {
    if (!newFinding.description) return;
    
    const finding: Finding = {
      id: crypto.randomUUID(),
      description: newFinding.description || "",
      responsible: newFinding.responsible || "",
      deadline: newFinding.deadline || "",
      status: "open",
      escalate_to_avvik: newFinding.escalate_to_avvik || false,
      created_at: new Date().toISOString()
    };
    
    setFindings(prev => [...prev, finding]);
    setNewFinding({
      description: "",
      responsible: "",
      deadline: "",
      status: "open",
      escalate_to_avvik: false
    });
  };

  const handleRemoveFinding = (id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  const handleComplete = () => {
    onComplete({
      checklist_responses: responses,
      findings,
      signature,
      inspector_name: inspectorName
    });
  };

  const avvikCount = responses.filter(r => r.status === "avvik").length;
  const completedCount = responses.filter(r => r.status !== null).length;
  const progress = checkpoints.length > 0 ? Math.round((completedCount / checkpoints.length) * 100) : 0;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Fremgang</p>
          <p className="text-2xl font-bold">{progress}%</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{responses.filter(r => r.status === "ok").length} OK</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{avvikCount} Avvik</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span>{responses.filter(r => r.status === "na").length} N/A</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h3 className="font-semibold text-lg mb-3 sticky top-0 bg-background py-2">
              {category}
            </h3>
            <div className="space-y-3">
              {checkpoints
                .filter(cp => cp.category === category)
                .map((checkpoint) => {
                  const response = responses.find(r => r.checkpoint_id === checkpoint.id);
                  return (
                    <Card key={checkpoint.id} className={
                      response?.status === "avvik" ? "border-red-300 bg-red-50/50 dark:bg-red-900/10" :
                      response?.status === "ok" ? "border-green-300 bg-green-50/50 dark:bg-green-900/10" :
                      ""
                    }>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="font-medium">{checkpoint.checkpoint}</p>
                            {checkpoint.help_text && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {checkpoint.help_text}
                              </p>
                            )}
                          </div>
                          
                          <RadioGroup
                            value={response?.status || ""}
                            onValueChange={(value) => handleResponseChange(checkpoint.id, value as "ok" | "avvik" | "na")}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ok" id={`${checkpoint.id}-ok`} />
                              <Label htmlFor={`${checkpoint.id}-ok`} className="flex items-center gap-1 cursor-pointer">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                OK
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="avvik" id={`${checkpoint.id}-avvik`} />
                              <Label htmlFor={`${checkpoint.id}-avvik`} className="flex items-center gap-1 cursor-pointer">
                                <XCircle className="h-4 w-4 text-red-500" />
                                Avvik
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="na" id={`${checkpoint.id}-na`} />
                              <Label htmlFor={`${checkpoint.id}-na`} className="flex items-center gap-1 cursor-pointer">
                                <AlertTriangle className="h-4 w-4 text-gray-400" />
                                N/A
                              </Label>
                            </div>
                          </RadioGroup>

                          {response?.status === "avvik" && (
                            <Textarea
                              placeholder="Beskriv avviket..."
                              value={response.comment}
                              onChange={(e) => handleCommentChange(checkpoint.id, e.target.value)}
                              className="mt-2"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Registrerte funn ({findings.length})</h3>
        {avvikCount > 0 && (
          <Badge variant="destructive">{avvikCount} avvik fra sjekklisten</Badge>
        )}
      </div>

      {findings.length === 0 && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Ingen funn registrert</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Vernerunden kan fullføres uten funn. Klikk "Neste" for å gå til signatur.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="font-medium mb-3">Legg til nytt funn (valgfritt)</h4>
        <div className="space-y-3">
          <div>
            <Label>Beskrivelse *</Label>
            <Textarea
              placeholder="Beskriv funnet..."
              value={newFinding.description}
              onChange={(e) => setNewFinding(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ansvarlig</Label>
              <Input
                placeholder="Hvem skal følge opp?"
                value={newFinding.responsible}
                onChange={(e) => setNewFinding(prev => ({ ...prev, responsible: e.target.value }))}
              />
            </div>
            <div>
              <Label>Frist</Label>
              <Input
                type="date"
                value={newFinding.deadline}
                onChange={(e) => setNewFinding(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="escalate"
              checked={newFinding.escalate_to_avvik}
              onCheckedChange={(checked) => 
                setNewFinding(prev => ({ ...prev, escalate_to_avvik: !!checked }))
              }
            />
            <Label htmlFor="escalate" className="cursor-pointer">
              Opprett som HMS-avvik
            </Label>
          </div>
          <Button onClick={handleAddFinding} disabled={!newFinding.description}>
            <Plus className="h-4 w-4 mr-2" />
            Legg til funn
          </Button>
        </div>
      </Card>

      {findings.length > 0 && (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {findings.map((finding) => (
              <Card key={finding.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{finding.description}</p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {finding.responsible && <span>Ansvarlig: {finding.responsible}</span>}
                      {finding.deadline && <span>Frist: {finding.deadline}</span>}
                    </div>
                    {finding.escalate_to_avvik && (
                      <Badge variant="destructive" className="mt-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Eskaleres til HMS-avvik
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFinding(finding.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Sammendrag</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sjekkpunkter gjennomgått:</span>
              <span className="font-medium">{completedCount} / {checkpoints.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">OK:</span>
              <span className="font-medium">{responses.filter(r => r.status === "ok").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Avvik:</span>
              <span className="font-medium">{avvikCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Ikke aktuelt:</span>
              <span className="font-medium">{responses.filter(r => r.status === "na").length}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Funn registrert:</span>
              <span className="font-medium">{findings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Eskalert til HMS-avvik:</span>
              <span className="font-medium">{findings.filter(f => f.escalate_to_avvik).length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-2">Vernerunde info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Nummer:</span>
              <span className="font-medium">{vernerunde.vernerunde_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Planlagt dato:</span>
              <span className="font-medium">{vernerunde.scheduled_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Mal:</span>
              <span className="font-medium">{template?.template_name || "Ingen mal"}</span>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Label>Inspektør navn *</Label>
        <Input
          value={inspectorName}
          onChange={(e) => setInspectorName(e.target.value)}
          placeholder="Ditt navn"
        />
      </div>

      <div>
        <Label>Signatur *</Label>
        <SignaturePad
          onSave={(sig) => setSignature(sig)}
          existingSignature={signature}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {vernerunde.vernerunde_number} - {template?.template_name || "Vernerunde"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? "bg-primary text-primary-foreground" :
                step > s ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? "bg-green-500" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground mb-4">
          <span className={step === 1 ? "text-foreground font-medium" : ""}>Sjekkliste</span>
          <span className={step === 2 ? "text-foreground font-medium" : ""}>Funn</span>
          <span className={step === 3 ? "text-foreground font-medium" : ""}>Signatur</span>
        </div>

        <ScrollArea className="h-[450px] pr-2">
          <div className="pr-2">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Neste
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!signature || !inspectorName || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Fullfør vernerunde
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
