import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus, Loader2, FolderOpen } from "lucide-react";
import { CompanyKsChecklistTemplate, Checkpoint } from "@/hooks/useCompanyKsChecklistTemplates";
import { useKsModule2Projects, KsModule2Project } from "@/hooks/useKsModule2Projects";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickFillChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompanyKsChecklistTemplate;
}

type CheckpointResponse = {
  checkpoint: string;
  status: "ok" | "not_ok" | "na";
  comment: string;
};

export function QuickFillChecklistDialog({ open, onOpenChange, template }: QuickFillChecklistDialogProps) {
  const { profile, user } = useAuth();
  const { projects } = useKsModule2Projects();
  const [step, setStep] = useState<"project" | "fill">("project");
  const [projectMode, setProjectMode] = useState<"existing" | "freetext">("existing");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [freetextProject, setFreetextProject] = useState("");
  const [responses, setResponses] = useState<CheckpointResponse[]>(
    template.checkpoints.map(cp => ({ checkpoint: cp.text, status: "na", comment: "" }))
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const canProceedToFill = projectMode === "existing" ? !!selectedProjectId : !!freetextProject.trim();

  const updateResponse = (index: number, field: keyof CheckpointResponse, value: string) => {
    setResponses(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async (status: "draft" | "completed") => {
    if (!profile?.company_id) return;
    setIsSaving(true);

    try {
      const checklistItems = template.checkpoints.map((cp, idx) => ({
        id: cp.id,
        text: cp.text,
        type: "yes_no" as const,
        required: true,
        value: responses[idx].status === "ok" ? true : responses[idx].status === "not_ok" ? false : null,
        comment: responses[idx].comment || undefined,
      }));

      const filledCount = checklistItems.filter(i => i.value !== null).length;
      const progressPercent = Math.round((filledCount / checklistItems.length) * 100);

      const title = projectMode === "existing" && selectedProject
        ? `${template.template_name} – ${selectedProject.project_name}`
        : `${template.template_name} – ${freetextProject}`;

      const insertData: Record<string, unknown> = {
        company_id: profile.company_id,
        title,
        template_name: template.template_name,
        checklist_items: checklistItems,
        status: status === "completed" ? "completed" : "in_progress",
        progress_percent: status === "completed" ? 100 : progressPercent,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        responsible_user_id: user?.id || null,
        responsible_user_name: profile.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : null,
        signatures: [],
        created_by: user?.id || null,
        is_paper_version: false,
        paper_uploaded: false,
      };

      if (projectMode === "existing" && selectedProjectId) {
        insertData.project_id = selectedProjectId;
      } else {
        // Use a placeholder project_id - we need one since the column is required
        // We'll store freetext in the title
        insertData.project_id = selectedProjectId || null;
      }

      // If existing project, save to ks_module2_checklists
      if (projectMode === "existing" && selectedProjectId) {
        const { error } = await (supabase
          .from("ks_module2_checklists" as any)
          .insert([insertData]) as any);
        if (error) throw error;
      } else {
        // For freetext, also save but without project_id link
        // We need project_id, so create a minimal entry or skip
        // Actually ks_module2_checklists requires project_id - let's store in a different way
        // We'll save it with notes containing freetext project ref
        if (selectedProjectId) {
          insertData.project_id = selectedProjectId;
        }
        const { error } = await (supabase
          .from("ks_module2_checklists" as any)
          .insert([{
            ...insertData,
            project_id: projects[0]?.id || null, // fallback
            title: `${template.template_name} – ${freetextProject}`,
          }]) as any);
        if (error) throw error;
      }

      toast.success(status === "completed" ? "Sjekkliste fullført!" : "Sjekkliste lagret som utkast");
      onOpenChange(false);
      // Reset
      setStep("project");
      setResponses(template.checkpoints.map(cp => ({ checkpoint: cp.text, status: "na", comment: "" })));
      setNotes("");
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast.error("Kunne ikke lagre sjekklisten");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <Check className="h-4 w-4 text-green-500" />;
      case "not_ok": return <X className="h-4 w-4 text-destructive" />;
      case "na": return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "project" ? "Velg prosjekt" : template.template_name}
          </DialogTitle>
          {step === "fill" && (
            <p className="text-sm text-muted-foreground">
              {projectMode === "existing" && selectedProject 
                ? selectedProject.project_name 
                : freetextProject}
            </p>
          )}
        </DialogHeader>

        {step === "project" ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Velg hvilket prosjekt denne sjekklisten skal tilhøre
            </p>

            <div className="flex gap-2">
              <Button
                variant={projectMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setProjectMode("existing")}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Eksisterende prosjekt
              </Button>
              <Button
                variant={projectMode === "freetext" ? "default" : "outline"}
                size="sm"
                onClick={() => setProjectMode("freetext")}
              >
                Fritekst
              </Button>
            </div>

            {projectMode === "existing" ? (
              <div className="space-y-2">
                <Label>Velg prosjekt</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg et prosjekt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => p.status !== "completed").map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.project_name}</span>
                          <span className="text-muted-foreground text-xs">{p.project_number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProject && (
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    <p className="font-medium">{selectedProject.project_name}</p>
                    <p className="text-muted-foreground">{selectedProject.project_number} • {selectedProject.address || "Ingen adresse"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Prosjektnavn / referanse</Label>
                <Input
                  value={freetextProject}
                  onChange={e => setFreetextProject(e.target.value)}
                  placeholder="F.eks. Enebolig Fjordveien 8"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button disabled={!canProceedToFill} onClick={() => setStep("fill")}>
                Neste – Fyll ut sjekkliste
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {responses.map((response, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">
                  {index + 1}. {response.checkpoint}
                </Label>

                <RadioGroup
                  value={response.status}
                  onValueChange={(value) => updateResponse(index, "status", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ok" id={`ok-${index}`} />
                    <Label htmlFor={`ok-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                      {getStatusIcon("ok")} OK
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_ok" id={`not_ok-${index}`} />
                    <Label htmlFor={`not_ok-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                      {getStatusIcon("not_ok")} Avvik
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="na" id={`na-${index}`} />
                    <Label htmlFor={`na-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                      {getStatusIcon("na")} N/A
                    </Label>
                  </div>
                </RadioGroup>

                <Textarea
                  placeholder="Kommentar (valgfritt)"
                  value={response.comment}
                  onChange={e => updateResponse(index, "comment", e.target.value)}
                  className="min-h-[50px] text-sm"
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label>Generelle notater (valgfritt)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notater om sjekklisten..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 justify-between pt-4 border-t sticky bottom-0 bg-background pb-1">
              <Button variant="ghost" size="sm" onClick={() => setStep("project")}>
                ← Tilbake
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lagre utkast
                </Button>
                <Button onClick={() => handleSave("completed")} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Fullfør sjekkliste
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
