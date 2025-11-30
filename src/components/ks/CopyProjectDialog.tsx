import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy } from "lucide-react";

interface CopyProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceProject: any;
  onSuccess: () => void;
}

export function CopyProjectDialog({ open, onOpenChange, sourceProject, onSuccess }: CopyProjectDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState(`${sourceProject?.name || ""} - Kopi`);
  
  const [copyOptions, setCopyOptions] = useState({
    basicInfo: true,
    responsibilities: true,
    hmsPlan: true,
    routines: true,
    templates: false,
  });

  const handleCopy = async () => {
    if (!sourceProject || !profile) return;
    
    setIsLoading(true);
    try {
      // Create new project with basic info
      const { data: newProject, error: projectError } = await supabase
        .from("ks_projects")
        .insert({
          company_id: profile.company_id,
          name: projectName,
          address: copyOptions.basicInfo ? sourceProject.address : "",
          tiltaksklasse: copyOptions.basicInfo ? sourceProject.tiltaksklasse : null,
          trade_role: sourceProject.trade_role,
          status: "planlagt",
          start_date: null,
          end_date: null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy responsibilities
      if (copyOptions.responsibilities) {
        const { data: responsibilities } = await supabase
          .from("ks_project_responsibilities")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (responsibilities && responsibilities.length > 0) {
          const newResponsibilities = responsibilities.map(r => ({
            project_id: newProject.id,
            role_type: r.role_type,
            funksjon: r.funksjon,
            ansvarlig_navn: r.ansvarlig_navn,
          }));

          await supabase
            .from("ks_project_responsibilities")
            .insert(newResponsibilities);
        }
      }

      // Copy HMS plan
      if (copyOptions.hmsPlan) {
        // Copy goals
        const { data: goals } = await supabase
          .from("ks_project_goals")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (goals && goals.length > 0) {
          const newGoals = goals.map(g => ({
            project_id: newProject.id,
            goal_text: g.goal_text,
            is_predefined: g.is_predefined,
            sort_order: g.sort_order,
          }));

          await supabase
            .from("ks_project_goals")
            .insert(newGoals);
        }

        // Copy organization
        const { data: org } = await supabase
          .from("ks_project_organization")
          .select("*")
          .eq("project_id", sourceProject.id)
          .single();

        if (org) {
          await supabase
            .from("ks_project_organization")
            .insert({
              project_id: newProject.id,
              content: org.content,
            });
        }

        // Copy risks
        const { data: risks } = await supabase
          .from("ks_project_risks")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (risks && risks.length > 0) {
          const newRisks = risks.map(r => ({
            project_id: newProject.id,
            hazard: r.hazard,
            probability: r.probability,
            consequence: r.consequence,
            measures: r.measures,
            responsible: r.responsible,
            deadline: null,
            status: "pending",
          }));

          await supabase
            .from("ks_project_risks")
            .insert(newRisks);
        }
      }

      // Copy routines (ks_project_routines links to ks_routines via routine_id)
      if (copyOptions.routines) {
        const { data: routines } = await supabase
          .from("ks_project_routines")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (routines && routines.length > 0) {
          const newRoutines = routines.map(r => ({
            project_id: newProject.id,
            routine_id: r.routine_id,
          }));

          await supabase
            .from("ks_project_routines")
            .insert(newRoutines);
        }
      }

      toast.success("Prosjekt kopiert!", {
        description: `${projectName} er opprettet basert på ${sourceProject.name}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error copying project:", error);
      toast.error("Kunne ikke kopiere prosjekt", {
        description: "Vennligst prøv igjen senere",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Kopier prosjekt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nytt prosjektnavn</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Navn på det nye prosjektet"
            />
          </div>

          <div className="space-y-3">
            <Label>Hva skal kopieres?</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basic-info"
                checked={copyOptions.basicInfo}
                onCheckedChange={(checked) => 
                  setCopyOptions(prev => ({ ...prev, basicInfo: checked as boolean }))
                }
              />
              <label
                htmlFor="basic-info"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Grunnleggende prosjektinfo (adresse, tiltaksklasse)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="responsibilities"
                checked={copyOptions.responsibilities}
                onCheckedChange={(checked) => 
                  setCopyOptions(prev => ({ ...prev, responsibilities: checked as boolean }))
                }
              />
              <label
                htmlFor="responsibilities"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ansvarlige (søker, prosjekterende, utførende, kontrollerende)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hms-plan"
                checked={copyOptions.hmsPlan}
                onCheckedChange={(checked) => 
                  setCopyOptions(prev => ({ ...prev, hmsPlan: checked as boolean }))
                }
              />
              <label
                htmlFor="hms-plan"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                HMS-plan (mål, organisasjon, risikovurdering)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="routines"
                checked={copyOptions.routines}
                onCheckedChange={(checked) => 
                  setCopyOptions(prev => ({ ...prev, routines: checked as boolean }))
                }
              />
              <label
                htmlFor="routines"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Rutiner og prosedyrer
              </label>
            </div>

            <div className="pt-2 px-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>Merk:</strong> Sjekklister, avvik, SJA, og andre tids-spesifikke data kopieres ikke.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleCopy} disabled={isLoading || !projectName.trim()}>
            {isLoading ? "Kopierer..." : "Kopier prosjekt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
