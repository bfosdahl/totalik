import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WizardStepBasicInfo } from "./wizard/WizardStepBasicInfo";
import { WizardStepOrganization } from "./wizard/WizardStepOrganization";
import { WizardStepCompetence } from "./wizard/WizardStepCompetence";
import { WizardStepRoutines } from "./wizard/WizardStepRoutines";
import { WizardStepChecklists } from "./wizard/WizardStepChecklists";
import { WizardStepPlanning } from "./wizard/WizardStepPlanning";
import { useKsProjects, NewKsProjectInput, KsProjectResponsibility, KsProject } from "@/hooks/useKsProjects";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: KsProject | null;
}

export interface WizardData extends NewKsProjectInput {
  // Additional wizard-specific fields
  tiltakstype?: string;
  hva_skal_bygges?: string;
  tiltaksomrade?: string;
  prosjekt_funksjon?: string;
  byggherre_org_nr?: string;
  byggherre_kontakt?: string;
  ansvarlig_soker_info?: string;
  kompetanse_krav?: string[];
  spesialkompetanse?: string;
  ue_kompetanse_krav?: string;
  aktive_rutiner?: string[];
  valgte_sjekklister?: string[];
  kontroll_for_lukking_dato?: string;
  ferdigbefaring_dato?: string;
  sluttbefaring_dato?: string;
  planlagte_milepeler?: string;
  motefrekvens?: string;
  ue_oppfolging_plan?: string;
}

const steps = [
  { id: 1, title: "Grunnleggende informasjon", description: "Prosjektdetaljer og byggherre" },
  { id: 2, title: "Prosjektorganisasjon", description: "Roller og ansvar" },
  { id: 3, title: "Krav og kompetanse", description: "Kompetansekrav for prosjektet" },
  { id: 4, title: "Rutiner og dokumenter", description: "Velg KS-rutiner" },
  { id: 5, title: "Sjekklister", description: "Velg sjekklister for prosjektet" },
  { id: 6, title: "Planlegging", description: "Planlegg kontroller og milepæler" },
];

export function ProjectWizard({ open, onOpenChange, project }: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { createProject, updateProject, isSaving } = useKsProjects();
  
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    if (project) {
      return {
        ...project,
        aktive_rutiner: project.aktive_rutiner || [],
        valgte_sjekklister: project.valgte_sjekklister || [],
        kompetanse_krav: project.kompetanse_krav || [],
        team_members: [],
        responsibilities: [],
      };
    }
    return {
      name: "",
      start_date: new Date().toISOString().split("T")[0],
      aktive_rutiner: [],
      valgte_sjekklister: [],
      kompetanse_krav: [],
      team_members: [],
      responsibilities: [],
    };
  });

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.name && wizardData.start_date;
      case 2:
        return true; // Organization is optional
      case 3:
        return true; // Competence is optional
      case 4:
        return true; // Routines are optional
      case 5:
        return true; // Checklists are optional
      case 6:
        return true; // Planning is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!canProceed()) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    // Remove team_members field if it exists (not in database schema)
    const { team_members, valgte_sjekklister, ...dataToSave } = wizardData as any;

    let result;
    if (project?.id) {
      // Update existing project
      result = await updateProject(project.id, { ...dataToSave, valgte_sjekklister });
    } else {
      // Create new project
      result = await createProject({ ...dataToSave, valgte_sjekklister });
    }
    
    if (result && valgte_sjekklister && valgte_sjekklister.length > 0) {
      // Create checklists based on selected checklist IDs
      // Map wizard IDs to partial template names (we'll use LIKE query)
      const checklistMapping: Record<string, string> = {
        'forhandsbefaring': 'Før oppstart',
        'ferdigbefaring': 'Ferdigbefaring',
        'sluttbefaring': 'Sluttbefaring',
        'overtakelsesbefaring': 'Overtakelsesbefaring',
        '1_ars_garanti': 'garantibefaring',
        'tomrerarbeid': 'Råbygg / Bjelkelag',
        'vatrom_membran': 'våtrom',
        'ror_lukking': 'rør',
        'elektro_trekking': 'elektro',
        'luft_dampsperre': 'vindsperre',
        'brannsikring': 'brann',
        'tekking_tak': 'Takstoler',
        'betong_armering': 'betong',
        'isolasjon': 'isolasjon',
        'kontroll_lukking': 'lukking',
        'ue_evaluering': 'evaluering',
        'kvalitet_fagarbeid': 'kvalitet',
      };

      try {
        // Fetch all system templates
        const { data: allTemplates } = await supabase
          .from('ks_templates')
          .select('id, name, phase')
          .eq('is_system_default', true);

        if (allTemplates && allTemplates.length > 0) {
          // Match selected checklists to actual templates using partial name matching
          const templates = valgte_sjekklister
            .map((checklistId: string) => {
              const searchTerm = checklistMapping[checklistId];
              if (!searchTerm) return null;
              
              // Find template that contains the search term (case insensitive)
              return allTemplates.find(t => 
                t.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            })
            .filter((t): t is NonNullable<typeof t> => t !== null);

          if (templates.length > 0) {
            // Create checklists for each template
            for (const template of templates) {
              const { data: checklist, error: checklistError } = await supabase
                .from('ks_checklists')
                .insert({
                  project_id: result.id,
                  template_id: template.id,
                  phase: template.phase || null,
                })
                .select('id')
                .single();

              if (checklistError) {
                console.error('Error creating checklist:', checklistError);
                continue;
              }

              // Get template items and create checklist items
              const { data: templateItems } = await supabase
                .from('ks_template_items')
                .select('id')
                .eq('template_id', template.id);

              if (templateItems && templateItems.length > 0) {
                const checklistItems = templateItems.map(item => ({
                  checklist_id: checklist.id,
                  template_item_id: item.id,
                  status: 'pending',
                }));

                await supabase
                  .from('ks_checklist_items')
                  .insert(checklistItems);
              }
            }
            
            toast.success(`${templates.length} sjekklister opprettet`);
          } else {
            toast.warning('Ingen matchende sjekklister funnet i maler');
          }
        }
      } catch (error) {
        console.error('Error creating checklists:', error);
        toast.error('Noen sjekklister kunne ikke opprettes');
      }
    }
    
    if (result) {
      toast.success(project?.id ? "Prosjekt oppdatert" : "Prosjekt opprettet");
      onOpenChange(false);
      setCurrentStep(1);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{project?.id ? "Rediger prosjektinformasjon" : "Prosjekt-wizard"}</DialogTitle>
            <DialogDescription>
              {project?.id 
                ? "Oppdater prosjektinformasjon gjennom en enkel guide" 
                : "Sett opp et nytt prosjekt på en enkel og komplett måte"}
            </DialogDescription>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Steg {currentStep} av {steps.length}</span>
                <span className="font-medium">{steps[currentStep - 1].title}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </DialogHeader>

          {/* Step indicator */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`ml-2 h-0.5 w-12 transition-colors ${
                        currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="py-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{steps[currentStep - 1].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
              </div>

              {currentStep === 1 && (
                <WizardStepBasicInfo data={wizardData} updateData={updateWizardData} />
              )}
              {currentStep === 2 && (
                <WizardStepOrganization data={wizardData} updateData={updateWizardData} />
              )}
              {currentStep === 3 && (
                <WizardStepCompetence data={wizardData} updateData={updateWizardData} />
              )}
              {currentStep === 4 && (
                <WizardStepRoutines data={wizardData} updateData={updateWizardData} />
              )}
              {currentStep === 5 && (
                <WizardStepChecklists data={wizardData} updateData={updateWizardData} />
              )}
              {currentStep === 6 && (
                <WizardStepPlanning data={wizardData} updateData={updateWizardData} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              {currentStep < steps.length ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Neste
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={!canProceed() || isSaving}>
                  <Check className="mr-2 h-4 w-4" />
                  Fullfør
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
