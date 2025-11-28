import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KsProjectRisk } from "@/hooks/useKsHmsPlan";
import { Badge } from "@/components/ui/badge";

const consequenceOptions = [
  { value: 1, label: "1 - Ufarlig", description: "Mindre skader, < 3 dager fravær" },
  { value: 2, label: "2 - Mindre alvorlig", description: "Skader, 3-30 dager fravær" },
  { value: 3, label: "3 - Alvorlig", description: "Betydelige skader, > 30 dager fravær" },
  { value: 4, label: "4 - Svært alvorlig", description: "Varige skader, invaliditet" },
  { value: 5, label: "5 - Katastrofalt", description: "Potensielt dødsfall" },
];

const probabilityOptions = [
  { value: 1, label: "1 - Lite sannsynlig", description: "< 1 gang per 10 år" },
  { value: 2, label: "2 - Mindre sannsynlig", description: "1-10 ganger per 10 år" },
  { value: 3, label: "3 - Sannsynlig", description: "1-10 ganger per år" },
  { value: 4, label: "4 - Meget sannsynlig", description: "1-10 ganger per måned" },
  { value: 5, label: "5 - Svært sannsynlig", description: "> 10 ganger per måned" },
];

interface RiskForm {
  hazard: string;
  consequence: number;
  probability: number;
  measures: string;
  responsible: string;
  deadline: string;
  status: string;
}

interface KsHmsRiskAssessmentStepProps {
  risks: KsProjectRisk[];
  onSave: (risks: Omit<KsProjectRisk, 'id' | 'project_id' | 'risk_score'>[]) => Promise<void>;
}

export function KsHmsRiskAssessmentStep({ risks: existingRisks, onSave }: KsHmsRiskAssessmentStepProps) {
  const [risks, setRisks] = useState<RiskForm[]>([]);

  useEffect(() => {
    if (existingRisks.length > 0) {
      setRisks(existingRisks.map(r => ({
        hazard: r.hazard,
        consequence: r.consequence,
        probability: r.probability,
        measures: r.measures || "",
        responsible: r.responsible || "",
        deadline: r.deadline || "",
        status: r.status,
      })));
    } else {
      // Add one empty risk
      setRisks([{
        hazard: "",
        consequence: 3,
        probability: 3,
        measures: "",
        responsible: "",
        deadline: "",
        status: "open",
      }]);
    }
  }, [existingRisks]);

  const addRisk = () => {
    setRisks(prev => [...prev, {
      hazard: "",
      consequence: 3,
      probability: 3,
      measures: "",
      responsible: "",
      deadline: "",
      status: "open",
    }]);
  };

  const removeRisk = (index: number) => {
    setRisks(prev => prev.filter((_, i) => i !== index));
  };

  const updateRisk = (index: number, field: keyof RiskForm, value: any) => {
    setRisks(prev => prev.map((risk, i) =>
      i === index ? { ...risk, [field]: value } : risk
    ));
  };

  const getRiskColor = (score: number) => {
    if (score >= 15) return "bg-red-600 text-white";
    if (score >= 8) return "bg-orange-500 text-white";
    if (score >= 4) return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
  };

  const handleSave = async () => {
    const validRisks = risks.filter(r => r.hazard.trim());
    await onSave(validRisks);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Risikovurdering</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Risiko = Konsekvens × Sannsynlighet. Rød (≥15) = Høy risiko, Oransje (8-14) = Middels, Gul (4-7) = Lav, Grønn (≤3) = Akseptabel
            </p>
          </div>
        </CardContent>
      </Card>

      {risks.map((risk, index) => {
        const riskScore = risk.consequence * risk.probability;
        return (
          <Card key={index}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">Risiko #{index + 1}</CardTitle>
                  <Badge className={getRiskColor(riskScore)}>
                    Risikoscore: {riskScore}
                  </Badge>
                </div>
                {risks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRisk(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fare/Hendelse *</Label>
                <Input
                  value={risk.hazard}
                  onChange={(e) => updateRisk(index, "hazard", e.target.value)}
                  placeholder="F.eks. Fall fra stillas, håndtering av tunge løft, støv og kjemikalier..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Konsekvens *</Label>
                  <Select
                    value={risk.consequence.toString()}
                    onValueChange={(value) => updateRisk(index, "consequence", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {consequenceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sannsynlighet *</Label>
                  <Select
                    value={risk.probability.toString()}
                    onValueChange={(value) => updateRisk(index, "probability", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {probabilityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Risikoreduserende tiltak</Label>
                <Textarea
                  value={risk.measures}
                  onChange={(e) => updateRisk(index, "measures", e.target.value)}
                  placeholder="Beskriv tiltak for å redusere risiko..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ansvarlig</Label>
                  <Input
                    value={risk.responsible}
                    onChange={(e) => updateRisk(index, "responsible", e.target.value)}
                    placeholder="Navn på ansvarlig"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frist</Label>
                  <Input
                    type="date"
                    value={risk.deadline}
                    onChange={(e) => updateRisk(index, "deadline", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button variant="outline" onClick={addRisk} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Legg til risiko
      </Button>

      <Button onClick={handleSave} className="w-full">
        Lagre risikovurdering og gå videre
      </Button>
    </div>
  );
}