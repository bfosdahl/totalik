import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useSubcontractorEvaluations, EvaluationInput } from "@/hooks/useSubcontractorEvaluations";
import { Badge } from "@/components/ui/badge";

interface SubcontractorEvaluationProps {
  subcontractorId: string;
}

const EVALUATION_ITEMS = [
  { key: "sentral_godkjenning", label: "Sentral godkjenning" },
  { key: "lokal_godkjenning", label: "Lokal godkjenning (tidligere)" },
  { key: "godkjenning_for_arbeid", label: "Godkjenning for arbeid i dette prosjektet" },
  { key: "andre_sertifikater", label: "Andre sertifikater / godkjenninger" },
  { key: "referanseprosjekter", label: "Referanseprosjekter" },
  { key: "jobbet_for_oss_for", label: "Har jobbet for oss før?" },
  { key: "endringer_siden_sist", label: "Endringer i foretaket siden sist" },
  { key: "arbeidskapasitet", label: "Arbeidskapasitet" },
  { key: "erfaring_kompetanse", label: "Erfaring & kompetanse" },
  { key: "forsikringer", label: "Forsikringer (Yrkesskade / ansvar)" },
  { key: "okonomi", label: "Økonomi – årsmelding / regnskap" },
  { key: "garantier", label: "Stiller garantier" },
  { key: "kontrakt", label: "Kontrakt på plass" },
  { key: "lonnsklausuler", label: "Lønnsklausuler OK" },
  { key: "paseplikt", label: "Påseplikt OK" },
  { key: "kvalitetssystem", label: "Kvalitetssystem egenerklæring" },
  { key: "hms_system", label: "HMS-system egenerklæring" },
];

export const SubcontractorEvaluation = ({ subcontractorId }: SubcontractorEvaluationProps) => {
  const { evaluation, isLoading, saveEvaluation, isSaving } = useSubcontractorEvaluations(subcontractorId);
  const [formData, setFormData] = useState<EvaluationInput>({});

  // Initialize form data when evaluation loads
  useEffect(() => {
    if (evaluation) {
      setFormData(evaluation);
    }
  }, [evaluation]);

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [key]: checked }));
  };

  const handleCommentChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [`${key}_comment`]: value }));
  };

  const handleSubmit = () => {
    saveEvaluation(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'godkjent':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'ikke_godkjent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'godkjent_med_forbehold':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'godkjent':
        return <Badge className="bg-green-600">✔ Godkjent</Badge>;
      case 'ikke_godkjent':
        return <Badge variant="destructive">✖ Ikke godkjent</Badge>;
      case 'godkjent_med_forbehold':
        return <Badge className="bg-yellow-600">⚠ Godkjent med forbehold</Badge>;
      default:
        return <Badge variant="secondary">Ikke vurdert</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {evaluation?.kan_brukes && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(evaluation.kan_brukes)}
                <div>
                  <CardTitle>Evalueringsstatus</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Evaluert av {evaluation.evaluated_by_name}
                  </p>
                </div>
              </div>
              {getStatusBadge(evaluation.kan_brukes)}
            </div>
          </CardHeader>
          {evaluation.konklusjon_notes && (
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{evaluation.konklusjon_notes}</p>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Seriøsitetskontroll / Gransking</CardTitle>
          <p className="text-sm text-muted-foreground">
            Evaluer underleverandøren basert på følgende sjekkpunkter
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {EVALUATION_ITEMS.map((item) => {
            const key = item.key as keyof EvaluationInput;
            const commentKey = `${key}_comment` as keyof EvaluationInput;
            const checked = formData[key] as boolean | undefined;
            const comment = formData[commentKey] as string | undefined;

            return (
              <div key={item.key} className="space-y-2 pb-4 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={checked || false}
                    onCheckedChange={(checked) => handleCheckboxChange(item.key, checked as boolean)}
                  />
                  <Label htmlFor={item.key} className="cursor-pointer font-medium">
                    {item.label}
                  </Label>
                </div>
                <Textarea
                  placeholder="Kommentar / notater..."
                  value={comment || ""}
                  onChange={(e) => handleCommentChange(item.key, e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            );
          })}

          <div className="space-y-4 pt-4 border-t-2">
            <div className="space-y-2">
              <Label htmlFor="kan_brukes" className="text-base font-semibold">
                Kan underentreprenøren brukes?
              </Label>
              <Select
                value={formData.kan_brukes || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, kan_brukes: value as any }))}
              >
                <SelectTrigger id="kan_brukes">
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="godkjent">✔ Godkjent</SelectItem>
                  <SelectItem value="ikke_godkjent">✖ Ikke godkjent</SelectItem>
                  <SelectItem value="godkjent_med_forbehold">⚠ Godkjent med forbehold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="konklusjon_notes">Konklusjon / notater</Label>
              <Textarea
                id="konklusjon_notes"
                placeholder="Sammendrag av vurderingen, eventuelle forbehold, etc..."
                value={formData.konklusjon_notes || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, konklusjon_notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre evaluering'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};