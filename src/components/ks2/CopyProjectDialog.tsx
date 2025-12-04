import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import type { Json } from "@/integrations/supabase/types";

interface CopyProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceProject: KsModule2Project;
  onSuccess: () => void;
}

interface CopyOptions {
  basicInfo: boolean;
  projectTemplates: boolean;
  customRoutines: boolean;
  customChecklists: boolean;
}

export function CopyProjectDialog({
  open,
  onOpenChange,
  sourceProject,
  onSuccess,
}: CopyProjectDialogProps) {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState(`${sourceProject.project_name} (kopi)`);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    basicInfo: true,
    projectTemplates: true,
    customRoutines: true,
    customChecklists: true,
  });

  const handleCopy = async () => {
    if (!profile?.company_id || !user?.id) {
      toast.error("Du må være logget inn");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Prosjektnavn er påkrevd");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create the new project (with or without basic info)
      const projectInsertData = {
        company_id: profile.company_id,
        created_by: user.id,
        project_name: projectName.trim(),
        project_number: "", // Will be auto-generated
        status: "planned" as const,
        progress_percent: 0,
        is_favorite: false,
        address: copyOptions.basicInfo ? sourceProject.address : null,
        gnr_bnr: copyOptions.basicInfo ? sourceProject.gnr_bnr : null,
        client_name: copyOptions.basicInfo ? sourceProject.client_name : null,
        client_org_number: copyOptions.basicInfo ? sourceProject.client_org_number : null,
        client_contact_person: copyOptions.basicInfo ? sourceProject.client_contact_person : null,
        client_phone: copyOptions.basicInfo ? sourceProject.client_phone : null,
        client_email: copyOptions.basicInfo ? sourceProject.client_email : null,
        contractor_type: copyOptions.basicInfo ? sourceProject.contractor_type : null,
        sha_coordinator_kp: copyOptions.basicInfo ? sourceProject.sha_coordinator_kp : null,
        sha_coordinator_ku: copyOptions.basicInfo ? sourceProject.sha_coordinator_ku : null,
        description: copyOptions.basicInfo ? sourceProject.description : null,
      };

      const { data: newProject, error: projectError } = await supabase
        .from("ks_module2_projects")
        .insert([projectInsertData])
        .select()
        .single();

      if (projectError) throw projectError;

      const newProjectId = newProject.id;

      // 2. Copy project templates (Malbibliotek) if selected
      if (copyOptions.projectTemplates) {
        const { data: templates, error: templatesError } = await supabase
          .from("ks_module2_project_templates")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (templatesError) throw templatesError;

        if (templates && templates.length > 0) {
          const newTemplates = templates.map(t => ({
            project_id: newProjectId,
            template_type: t.template_type,
            admin_checklist_template_id: t.admin_checklist_template_id,
            admin_routine_template_id: t.admin_routine_template_id,
            admin_document_id: t.admin_document_id,
            is_implemented: false, // Reset implementation status
            implemented_at: null,
            implemented_by_id: null,
            implemented_by_name: null,
            approved_by: null, // Reset approval
            approved_at: null,
            linked_checklist_ids: t.linked_checklist_ids,
            notes: null,
          }));

          const { error: insertError } = await supabase
            .from("ks_module2_project_templates")
            .insert(newTemplates);

          if (insertError) throw insertError;
        }
      }

      // 3. Copy custom routines if selected
      if (copyOptions.customRoutines) {
        const { data: routines, error: routinesError } = await supabase
          .from("ks_module2_routines")
          .select("*")
          .eq("project_id", sourceProject.id);

        if (routinesError) throw routinesError;

        if (routines && routines.length > 0) {
          const newRoutines = routines.map(r => ({
            project_id: newProjectId,
            company_id: profile.company_id,
            routine_number: "", // Will be auto-generated
            name: r.name,
            description: r.description,
            content: r.content,
            category: r.category,
            responsible_role: r.responsible_role,
            is_document: false, // Don't copy documents, just the content
            document_path: null,
            document_name: null,
            approved_by: null, // Reset approval
            approved_at: null,
          }));

          const { error: insertError } = await supabase
            .from("ks_module2_routines")
            .insert(newRoutines);

          if (insertError) throw insertError;
        }
      }

      // 4. Copy custom checklist templates if selected
      if (copyOptions.customChecklists) {
        const { data: checklists, error: checklistsError } = await supabase
          .from("ks_module2_checklist_templates")
          .select("*")
          .eq("project_id", sourceProject.id)
          .eq("is_system_template", false);

        if (checklistsError) throw checklistsError;

        if (checklists && checklists.length > 0) {
          const newChecklists = checklists.map(c => ({
            project_id: newProjectId,
            company_id: profile.company_id,
            template_name: c.template_name,
            description: c.description,
            category: c.category,
            checkpoints: c.checkpoints as Json[],
            is_active: true,
            is_system_template: false,
            approved_by: null, // Reset approval
            approved_at: null,
          }));

          const { error: insertError } = await supabase
            .from("ks_module2_checklist_templates")
            .insert(newChecklists);

          if (insertError) throw insertError;
        }
      }

      toast.success("Prosjekt kopiert!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error copying project:", error);
      toast.error("Kunne ikke kopiere prosjekt");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOption = (key: keyof CopyOptions) => {
    setCopyOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Kopier prosjekt
          </DialogTitle>
          <DialogDescription>
            Lag en kopi av "{sourceProject.project_name}" med alle valgte maler og rutiner.
            Ingen gjennomførte data blir kopiert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nytt prosjektnavn</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Skriv inn prosjektnavn"
            />
          </div>

          <div className="space-y-3">
            <Label>Hva skal kopieres?</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basicInfo"
                checked={copyOptions.basicInfo}
                onCheckedChange={() => toggleOption("basicInfo")}
              />
              <label
                htmlFor="basicInfo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Prosjektinfo (adresse, kunde, osv.)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="projectTemplates"
                checked={copyOptions.projectTemplates}
                onCheckedChange={() => toggleOption("projectTemplates")}
              />
              <label
                htmlFor="projectTemplates"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Malbibliotek (sjekklister, rutiner, dokumenter)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customRoutines"
                checked={copyOptions.customRoutines}
                onCheckedChange={() => toggleOption("customRoutines")}
              />
              <label
                htmlFor="customRoutines"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Egne rutiner
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customChecklists"
                checked={copyOptions.customChecklists}
                onCheckedChange={() => toggleOption("customChecklists")}
              />
              <label
                htmlFor="customChecklists"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Egne sjekkliste-maler
              </label>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Det nye prosjektet vil starte med status "Planlagt" og 0% fremdrift.
            Gjennomførte sjekklister, avvik og dokumentasjon blir ikke kopiert.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isLoading || !projectName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Kopierer...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Kopier prosjekt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
