import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MinusCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useKsModule2SubcontractorEvaluation, SubcontractorEvaluation } from "@/hooks/useKsModule2Subcontractors";

const EVALUATION_ITEMS = [
  { key: 'has_valid_org_number', label: 'Gyldig organisasjonsnummer', commentKey: 'org_number_comment' },
  { key: 'has_tax_certificate', label: 'Gyldig skatteattest', commentKey: 'tax_certificate_comment' },
  { key: 'has_liability_insurance', label: 'Ansvarsforsikring', commentKey: 'liability_insurance_comment' },
  { key: 'has_valid_hms_card', label: 'Gyldige HMS-kort', commentKey: 'hms_card_comment' },
  { key: 'has_required_certifications', label: 'Påkrevde sertifiseringer', commentKey: 'certifications_comment' },
  { key: 'has_signed_contract', label: 'Signert kontrakt', commentKey: 'contract_comment' },
  { key: 'has_competence_documentation', label: 'Kompetansedokumentasjon', commentKey: 'competence_comment' },
  { key: 'has_references', label: 'Referanser', commentKey: 'references_comment' },
  { key: 'has_quality_system', label: 'Kvalitetssystem', commentKey: 'quality_system_comment' },
  { key: 'has_environmental_plan', label: 'Miljøplan', commentKey: 'environmental_plan_comment' },
] as const;

interface FormData {
  [key: string]: boolean | null | string;
}

interface Ks2SubcontractorEvaluationProps {
  subcontractorId: string;
}

export function Ks2SubcontractorEvaluation({ subcontractorId }: Ks2SubcontractorEvaluationProps) {
  const { evaluation, isLoading, saveEvaluation, isSaving } = useKsModule2SubcontractorEvaluation(subcontractorId);
  const [formData, setFormData] = useState<FormData>({});
  const [conclusion, setConclusion] = useState<string>("");
  const [conclusionNotes, setConclusionNotes] = useState("");

  useEffect(() => {
    if (evaluation) {
      const data: FormData = {};
      EVALUATION_ITEMS.forEach(item => {
        data[item.key] = evaluation[item.key as keyof SubcontractorEvaluation] as boolean | null;
        data[item.commentKey] = evaluation[item.commentKey as keyof SubcontractorEvaluation] as string || "";
      });
      setFormData(data);
      setConclusion(evaluation.overall_conclusion || "");
      setConclusionNotes(evaluation.conclusion_notes || "");
    }
  }, [evaluation]);

  const handleCheckChange = (key: string, value: boolean | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCommentChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const evaluationData: Partial<SubcontractorEvaluation> = {
      overall_conclusion: conclusion as SubcontractorEvaluation['overall_conclusion'],
      conclusion_notes: conclusionNotes,
    };

    EVALUATION_ITEMS.forEach(item => {
      (evaluationData as any)[item.key] = formData[item.key] as boolean | null;
      (evaluationData as any)[item.commentKey] = formData[item.commentKey] as string;
    });

    saveEvaluation(evaluationData);
  };

  const getStatusIcon = (value: boolean | null | undefined) => {
    if (value === true) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (value === false) return <XCircle className="h-5 w-5 text-red-600" />;
    return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Laster gransking...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Seriøsitetskontroll</CardTitle>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Lagrer..." : "Lagre"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checkpoints */}
        <div className="space-y-4">
          {EVALUATION_ITEMS.map((item) => (
            <div key={item.key} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(formData[item.key] as boolean | null)}
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData[item.key] === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCheckChange(item.key, true)}
                    className="w-16"
                  >
                    OK
                  </Button>
                  <Button
                    type="button"
                    variant={formData[item.key] === false ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleCheckChange(item.key, false)}
                    className="w-16"
                  >
                    Nei
                  </Button>
                  <Button
                    type="button"
                    variant={formData[item.key] === null ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleCheckChange(item.key, null)}
                    className="w-16"
                  >
                    N/A
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Kommentar..."
                value={(formData[item.commentKey] as string) || ""}
                onChange={(e) => handleCommentChange(item.commentKey, e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium">Konklusjon</h4>
          
          <RadioGroup value={conclusion} onValueChange={setConclusion}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approved" id="approved" />
              <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Godkjent
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approved_with_remarks" id="approved_with_remarks" />
              <Label htmlFor="approved_with_remarks" className="flex items-center gap-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Godkjent med merknader
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rejected" id="rejected" />
              <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer">
                <XCircle className="h-4 w-4 text-red-600" />
                Avvist
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label>Begrunnelse / merknader</Label>
            <Textarea
              placeholder="Skriv begrunnelse for konklusjonen..."
              value={conclusionNotes}
              onChange={(e) => setConclusionNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
