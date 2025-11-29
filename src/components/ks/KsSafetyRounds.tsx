import { useState, useEffect } from "react";
import { Plus, Shield, CheckCircle, AlertCircle, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useKsSafetyRounds } from "@/hooks/useKsSafetyRounds";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface KsSafetyRoundsProps {
  projectId: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface Checkpoint {
  id: string;
  text: string;
  category: string | null;
  order_index: number;
}

interface CheckpointResult {
  checkpoint_id: string;
  status: "ok" | "not_ok" | "not_applicable" | "not_checked";
  comment: string;
}

export function KsSafetyRounds({ projectId }: KsSafetyRoundsProps) {
  const { profile } = useAuth();
  const { safetyRounds, isLoading, createSafetyRound, updateSafetyRound } = useKsSafetyRounds(projectId);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [step, setStep] = useState<"select-template" | "fill-checklist">("select-template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [formData, setFormData] = useState({
    round_date: new Date().toISOString().split("T")[0],
    participants: "",
    responsible: "",
  });
  const [checkpointResults, setCheckpointResults] = useState<CheckpointResult[]>([]);

  // Fetch templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["vernerunde-templates", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("ks_vernerunde_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!profile?.company_id && showNewDialog
  });

  // Fetch checkpoints for selected template
  const { data: checkpoints } = useQuery({
    queryKey: ["vernerunde-checkpoints", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      const { data, error } = await supabase
        .from("ks_vernerunde_checkpoints")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");
      if (error) throw error;
      return data as Checkpoint[];
    },
    enabled: !!selectedTemplateId
  });

  // Initialize checkpoint results when checkpoints are loaded
  useEffect(() => {
    if (checkpoints && checkpoints.length > 0 && checkpointResults.length === 0) {
      setCheckpointResults(
        checkpoints.map((cp) => ({
          checkpoint_id: cp.id,
          status: "not_checked" as const,
          comment: "",
        }))
      );
    }
  }, [checkpoints]);

  const handleTemplateSelect = () => {
    if (!selectedTemplateId) {
      toast.error("Velg en mal først");
      return;
    }
    setStep("fill-checklist");
  };

  const handleCreate = async () => {
    if (!formData.round_date || !selectedTemplateId) return;

    // Create safety round
    const result = await createSafetyRound({
      project_id: projectId,
      round_date: formData.round_date,
      participants: formData.participants || null,
      findings: null,
      actions_required: null,
      responsible: formData.responsible || null,
      deadline: null,
      status: "completed",
      photo_paths: null,
      template_id: selectedTemplateId,
    });

    if (result) {
      // Save checkpoint results
      const resultsToInsert = checkpointResults.map((r) => ({
        safety_round_id: result.id,
        checkpoint_id: r.checkpoint_id,
        company_id: profile?.company_id!,
        status: r.status,
        comment: r.comment || null,
      }));

      const { error: resultsError } = await supabase
        .from("ks_safety_round_results")
        .insert(resultsToInsert);

      if (resultsError) {
        console.error("Error saving checkpoint results:", resultsError);
        toast.error("Kunne ikke lagre sjekkliste-resultater");
        return;
      }

      toast.success("Vernerunde registrert");
      setShowNewDialog(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      round_date: new Date().toISOString().split("T")[0],
      participants: "",
      responsible: "",
    });
    setStep("select-template");
    setSelectedTemplateId("");
    setCheckpointResults([]);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateSafetyRound(id, { status: newStatus });
    if (selectedRound?.id === id) {
      setSelectedRound({ ...selectedRound, status: newStatus });
    }
  };

  const updateCheckpointResult = (checkpointId: string, field: "status" | "comment", value: string) => {
    setCheckpointResults((prev) =>
      prev.map((r) =>
        r.checkpoint_id === checkpointId ? { ...r, [field]: value } : r
      )
    );
  };

  const getCheckpointResult = (checkpointId: string) => {
    return checkpointResults.find((r) => r.checkpoint_id === checkpointId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vernerunder</CardTitle>
            <CardDescription>{safetyRounds.length} gjennomført for dette prosjektet</CardDescription>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny vernerunde
          </Button>
        </CardHeader>
        <CardContent>
          {safetyRounds.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Ingen vernerunder registrert</p>
              <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrer første vernerunde
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {safetyRounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedRound(round)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Vernerunde {new Date(round.round_date).toLocaleDateString("nb-NO")}</p>
                        <Badge variant={round.status === "completed" ? "default" : "secondary"}>
                          {round.status === "completed" ? "Gjennomført" : round.status === "cancelled" ? "Kansellert" : "Planlagt"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {round.participants && `Deltakere: ${round.participants}`}
                        {round.responsible && ` • Ansvarlig: ${round.responsible}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Safety Round Dialog */}
      <Dialog open={showNewDialog} onOpenChange={(open) => {
        setShowNewDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ny vernerunde</DialogTitle>
            <DialogDescription>
              {step === "select-template" ? "Velg mal for vernerunde" : "Fyll ut sjekklisten"}
            </DialogDescription>
          </DialogHeader>

          {step === "select-template" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="round_date">Dato *</Label>
                  <Input
                    id="round_date"
                    type="date"
                    value={formData.round_date}
                    onChange={(e) => setFormData({ ...formData, round_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="participants">Deltakere</Label>
                  <Input
                    id="participants"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                    placeholder="Navn på deltakere"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Navn på ansvarlig"
                />
              </div>
              <div>
                <Label htmlFor="template">Velg mal *</Label>
                {isLoadingTemplates ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg en mal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates && templates.length > 0 ? (
                        templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                            {template.description && (
                              <span className="text-xs text-muted-foreground ml-2">
                                - {template.description}
                              </span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Ingen maler tilgjengelig. Opprett en mal i Mal Generator først.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Dato:</span> {new Date(formData.round_date).toLocaleDateString("nb-NO")}
                </p>
                {formData.participants && (
                  <p className="text-sm">
                    <span className="font-medium">Deltakere:</span> {formData.participants}
                  </p>
                )}
                {formData.responsible && (
                  <p className="text-sm">
                    <span className="font-medium">Ansvarlig:</span> {formData.responsible}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Kontrollpunkter</h3>
                {checkpoints && checkpoints.length > 0 ? (
                  checkpoints.map((checkpoint) => {
                    const result = getCheckpointResult(checkpoint.id);
                    return (
                      <Card key={checkpoint.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{checkpoint.text}</p>
                              {checkpoint.category && (
                                <Badge variant="outline" className="mt-1">
                                  {checkpoint.category}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm mb-2">Status *</Label>
                            <RadioGroup
                              value={result?.status || "not_checked"}
                              onValueChange={(value) =>
                                updateCheckpointResult(checkpoint.id, "status", value)
                              }
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ok" id={`${checkpoint.id}-ok`} />
                                <Label htmlFor={`${checkpoint.id}-ok`} className="cursor-pointer">
                                  OK
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="not_ok" id={`${checkpoint.id}-not-ok`} />
                                <Label htmlFor={`${checkpoint.id}-not-ok`} className="cursor-pointer">
                                  Ikke OK
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="not_applicable" id={`${checkpoint.id}-na`} />
                                <Label htmlFor={`${checkpoint.id}-na`} className="cursor-pointer">
                                  Ikke aktuelt
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div>
                            <Label htmlFor={`comment-${checkpoint.id}`} className="text-sm">
                              Kommentar (valgfri)
                            </Label>
                            <Textarea
                              id={`comment-${checkpoint.id}`}
                              value={result?.comment || ""}
                              onChange={(e) =>
                                updateCheckpointResult(checkpoint.id, "comment", e.target.value)
                              }
                              placeholder="Legg til kommentar..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Ingen kontrollpunkter funnet for denne malen
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {step === "fill-checklist" && (
              <Button variant="outline" onClick={() => setStep("select-template")}>
                Tilbake
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              setShowNewDialog(false);
              resetForm();
            }}>
              Avbryt
            </Button>
            {step === "select-template" ? (
              <Button onClick={handleTemplateSelect} disabled={!selectedTemplateId || !formData.round_date}>
                Neste
              </Button>
            ) : (
              <Button onClick={handleCreate}>
                Lagre vernerunde
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Safety Round Dialog */}
      <Dialog open={!!selectedRound} onOpenChange={(open) => !open && setSelectedRound(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vernerunde {selectedRound && new Date(selectedRound.round_date).toLocaleDateString("nb-NO")}</DialogTitle>
            <DialogDescription>Detaljer om vernerunde</DialogDescription>
          </DialogHeader>
          {selectedRound && (
            <div className="space-y-4">
              <div>
                <Label>Deltakere</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRound.participants || "Ikke oppgitt"}</p>
              </div>
              {selectedRound.responsible && (
                <div>
                  <Label>Ansvarlig</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRound.responsible}</p>
                </div>
              )}
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex gap-2">
                  {selectedRound.status === "pending" ? (
                    <Button onClick={() => handleStatusChange(selectedRound.id, "completed")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marker som gjennomført
                    </Button>
                  ) : selectedRound.status === "completed" ? (
                    <Button variant="outline" onClick={() => handleStatusChange(selectedRound.id, "pending")}>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Marker som planlagt
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
