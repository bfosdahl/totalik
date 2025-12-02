import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useKsInspections } from "@/hooks/useKsInspections";
import { useInspectionTemplates, useInspectionTemplateItems, useInspectionResults } from "@/hooks/useInspectionTemplates";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function KsInspeksjonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { inspections, updateInspection } = useKsInspections();
  const { templates } = useInspectionTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { items: templateItems } = useInspectionTemplateItems(selectedTemplateId);
  const { result, saveResult } = useInspectionResults(id || null);

  const inspection = inspections.find((i) => i.id === id);

  const [checkpointResults, setCheckpointResults] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (result) {
      setCheckpointResults(result.checkpoint_results || []);
      setNotes(result.notes || "");
      setSelectedTemplateId(result.template_id || null);
    } else if (templateItems.length > 0) {
      // Initialize with template items
      setCheckpointResults(
        templateItems.map((item) => ({
          checkpoint_id: item.id,
          checkpoint_text: item.checkpoint_text,
          help_text: item.help_text,
          status: null,
          comment: "",
        }))
      );
    }
  }, [result, templateItems]);

  const handleStatusChange = (index: number, status: string) => {
    const newResults = [...checkpointResults];
    newResults[index].status = status;
    setCheckpointResults(newResults);
  };

  const handleCommentChange = (index: number, comment: string) => {
    const newResults = [...checkpointResults];
    newResults[index].comment = comment;
    setCheckpointResults(newResults);
  };

  const handleSave = async () => {
    if (!id || !profile) return;

    // Check if all checkpoints have status
    const allFilled = checkpointResults.every((r) => r.status !== null);
    if (!allFilled) {
      toast.error("Vennligst fyll ut alle sjekkpunkter");
      return;
    }

    await saveResult.mutateAsync({
      inspection_id: id,
      template_id: selectedTemplateId || undefined,
      checkpoint_results: checkpointResults,
      completed_at: new Date().toISOString(),
      completed_by_user_id: profile.id || undefined,
      completed_by_name: `${profile.first_name} ${profile.last_name}`,
      notes,
    });

    // Oppdater inspeksjonens status til ferdig
    await updateInspection(id, { status: "ferdig" });

    navigate("/ks/inspeksjoner");
  };

  if (!inspection) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Inspeksjon ikke funnet</p>
        </div>
      </AppLayout>
    );
  }

  const getStatusIcon = (status: string | null) => {
    if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === "avvik") return <XCircle className="h-5 w-5 text-red-600" />;
    if (status === "na") return <MinusCircle className="h-5 w-5 text-gray-400" />;
    return null;
  };

  const getStatusCounts = () => {
    const ok = checkpointResults.filter((r) => r.status === "ok").length;
    const avvik = checkpointResults.filter((r) => r.status === "avvik").length;
    const na = checkpointResults.filter((r) => r.status === "na").length;
    const total = checkpointResults.length;
    return { ok, avvik, na, total };
  };

  const statusCounts = getStatusCounts();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/ks/inspeksjoner")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{inspection.tittel || "Inspeksjon"}</CardTitle>
            <CardDescription>
              {inspection.område && `Område: ${inspection.område}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OK</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.ok}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avvik</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.avvik}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ikke aktuelt</p>
                <p className="text-2xl font-bold text-gray-500">{statusCounts.na}</p>
              </div>
            </div>

            {!result && checkpointResults.length === 0 && (
              <div className="mb-6">
                <Label>Velg mal</Label>
                <Select
                  value={selectedTemplateId || ""}
                  onValueChange={(value) => setSelectedTemplateId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg en mal" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((t) => t.inspection_type === inspection.inspection_type)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.template_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {checkpointResults.length > 0 && (
              <div className="space-y-4">
                {checkpointResults.map((checkpoint, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm text-muted-foreground">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{checkpoint.checkpoint_text}</p>
                            {checkpoint.help_text && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {checkpoint.help_text}
                              </p>
                            )}
                          </div>
                          {getStatusIcon(checkpoint.status)}
                        </div>

                        <RadioGroup
                          value={checkpoint.status || ""}
                          onValueChange={(value) => handleStatusChange(index, value)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ok" id={`ok-${index}`} />
                            <Label htmlFor={`ok-${index}`} className="cursor-pointer">
                              OK
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="avvik" id={`avvik-${index}`} />
                            <Label htmlFor={`avvik-${index}`} className="cursor-pointer">
                              Avvik
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="na" id={`na-${index}`} />
                            <Label htmlFor={`na-${index}`} className="cursor-pointer">
                              Ikke aktuelt
                            </Label>
                          </div>
                        </RadioGroup>

                        <Textarea
                          placeholder="Kommentar (valgfritt)"
                          value={checkpoint.comment}
                          onChange={(e) => handleCommentChange(index, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="pt-4">
                    <Label>Generelle notater</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Skriv generelle notater om inspeksjonen..."
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => navigate("/ks/inspeksjoner")}>
                    Avbryt
                  </Button>
                  <Button onClick={handleSave}>Fullfør inspeksjon</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
