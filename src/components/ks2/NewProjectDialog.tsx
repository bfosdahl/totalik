import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Sparkles, ClipboardList, Plus, Trash2, Save } from "lucide-react";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { NewKsModule2ProjectInput } from "@/hooks/useKsModule2Projects";
import { Ks2ProjectSetupChat } from "./Ks2ProjectSetupChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyProjectTemplates } from "@/hooks/useCompanyProjectTemplates";
import { Separator } from "@/components/ui/separator";

// Prosjektmaler med forhåndsdefinert informasjon
const PROJECT_TEMPLATES = [
  {
    id: "blank",
    name: "Tomt prosjekt",
    description: "Start fra bunnen uten forhåndsutfylling",
    defaults: {}
  },
  {
    id: "enebolig",
    name: "Enebolig",
    description: "Nybygg eller renovering av enebolig",
    defaults: {
      description: "Oppføring/renovering av enebolig. Prosjektet omfatter komplett byggearbeid fra grunn til ferdig bygg.",
      contractor_type: "total" as const
    }
  },
  {
    id: "leilighet",
    name: "Leilighetsbygg",
    description: "Flerboligbygg med leiligheter",
    defaults: {
      description: "Oppføring av leilighetsbygg. Prosjektet omfatter komplett byggearbeid inkludert fellesarealer.",
      contractor_type: "total" as const
    }
  },
  {
    id: "naeringsbygg",
    name: "Næringsbygg",
    description: "Kontor, butikk eller industribygg",
    defaults: {
      description: "Oppføring av næringsbygg. Prosjektet omfatter byggearbeid tilpasset næringsdrift.",
      contractor_type: "hoved" as const
    }
  },
  {
    id: "renovering",
    name: "Totalrenovering",
    description: "Større renovering av eksisterende bygg",
    defaults: {
      description: "Totalrenovering av eksisterende bygg. Prosjektet omfatter omfattende oppgradering og modernisering.",
      contractor_type: "hoved" as const
    }
  },
  {
    id: "tilbygg",
    name: "Tilbygg/påbygg",
    description: "Utvidelse av eksisterende bygg",
    defaults: {
      description: "Tilbygg/påbygg til eksisterende bygg. Prosjektet omfatter utvidelse med tilkobling til eksisterende konstruksjon.",
      contractor_type: "hoved" as const
    }
  },
  {
    id: "betong",
    name: "Betongarbeid",
    description: "Spesialisert betongentreprise",
    defaults: {
      description: "Betongarbeider. Prosjektet omfatter forskaling, armering og støping iht. tegninger og beskrivelse.",
      contractor_type: "under" as const
    }
  },
  {
    id: "tomrer",
    name: "Tømrerarbeid",
    description: "Tømrer- og snekkerarbeid",
    defaults: {
      description: "Tømrer- og snekkerarbeid. Prosjektet omfatter trearbeider iht. tegninger og beskrivelse.",
      contractor_type: "under" as const
    }
  },
  {
    id: "rorlegger",
    name: "Rørleggerarbeid",
    description: "VVS og sanitærinstallasjon",
    defaults: {
      description: "VVS og sanitærarbeid. Prosjektet omfatter rørinstallasjon, sanitærutstyr og evt. varmeanlegg.",
      contractor_type: "under" as const
    }
  },
  {
    id: "elektro",
    name: "Elektroarbeid",
    description: "Elektrisk installasjon",
    defaults: {
      description: "Elektroarbeider. Prosjektet omfatter elektrisk installasjon iht. tegninger og beskrivelse.",
      contractor_type: "under" as const
    }
  },
  {
    id: "maler",
    name: "Malerarbeid",
    description: "Maling og overflatebehandling",
    defaults: {
      description: "Maler- og tapetserarbeid. Prosjektet omfatter overflatebehandling av vegger, tak og treverk.",
      contractor_type: "under" as const
    }
  },
  {
    id: "flislegger",
    name: "Flislegging",
    description: "Flis og våtromsarbeid",
    defaults: {
      description: "Flislegging og våtromsarbeid. Prosjektet omfatter membran, flislegging og fuging i våtrom.",
      contractor_type: "under" as const
    }
  }
];

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewKsModule2ProjectInput) => Promise<any>;
  isSaving: boolean;
}

const getEmptyFormData = (): NewKsModule2ProjectInput => ({
  project_name: "",
  project_number: "",
  address: "",
  gnr_bnr: "",
  client_name: "",
  client_org_number: "",
  client_contact_person: "",
  client_phone: "",
  client_email: "",
  contractor_type: undefined,
  project_leader_id: "",
  project_leader_name: "",
  sha_coordinator_kp: "",
  sha_coordinator_ku: "",
  planned_start_date: "",
  planned_end_date: "",
  contract_sum: undefined,
  description: "",
});

export function NewProjectDialog({ open, onOpenChange, onSubmit, isSaving }: NewProjectDialogProps) {
  const { users } = useCompanyUsers();
  const { profile, isCompanyAdmin } = useAuth();
  const { templates: customTemplates, createTemplate, deleteTemplate } = useCompanyProjectTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");
  const [formData, setFormData] = useState<NewKsModule2ProjectInput>(getEmptyFormData());
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Check built-in templates first
    const builtIn = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (builtIn) {
      setFormData(prev => ({
        ...getEmptyFormData(),
        ...builtIn.defaults,
        project_name: prev.project_name,
      }));
      return;
    }
    
    // Check custom templates
    const custom = customTemplates.find(t => t.id === templateId);
    if (custom) {
      setFormData(prev => ({
        ...getEmptyFormData(),
        description: custom.default_description || "",
        contractor_type: custom.contractor_type as any || undefined,
        project_name: prev.project_name,
      }));
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;
    await createTemplate({
      template_name: newTemplateName,
      description: formData.description || undefined,
      contractor_type: formData.contractor_type || undefined,
      default_description: formData.description || undefined,
    });
    setNewTemplateName("");
    setShowSaveTemplateDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name.trim()) return;

    await onSubmit(formData);
    setFormData(getEmptyFormData());
    setSelectedTemplate("blank");
    onOpenChange(false);
  };

  const handleProjectLeaderChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      project_leader_id: userId,
      project_leader_name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    }));
  };

  const saveAiRecommendations = async (
    projectId: string,
    companyId: string,
    checklists: any[],
    routines: any[]
  ) => {
    try {
      // Save checklists
      if (checklists.length > 0) {
        const checklistInserts = checklists.map((cl) => ({
          project_id: projectId,
          company_id: companyId,
          title: cl.name,
          template_name: cl.name,
          checklist_items: (cl.checkpoints || []).map((cp: string, idx: number) => ({
            id: `item-${idx}`,
            checkpoint: cp,
            value: null,
            comment: "",
          })),
          status: "not_started",
          progress_percent: 0,
        }));

        const { error: clError } = await (supabase
          .from("ks_module2_checklists" as any)
          .insert(checklistInserts) as any);

        if (clError) {
          console.error("Error saving AI checklists:", clError);
        }
      }

      // Save routines
      if (routines.length > 0) {
        const routineInserts = routines.map((r) => ({
          project_id: projectId,
          company_id: companyId,
          name: r.name,
          description: r.description || null,
          category: r.category || "general",
          routine_number: "",
        }));

        const { error: rError } = await supabase
          .from("ks_module2_routines")
          .insert(routineInserts);

        if (rError) {
          console.error("Error saving AI routines:", rError);
        }
      }
    } catch (error) {
      console.error("Error saving AI recommendations:", error);
    }
  };

  const handleAiComplete = async (data: Partial<NewKsModule2ProjectInput> & {
    recommended_checklists?: any[];
    recommended_routines?: any[];
    hms_focus?: any[];
    milestones?: any[];
  }) => {
    const projectData: NewKsModule2ProjectInput = {
      ...getEmptyFormData(),
      project_name: data.project_name || "",
      description: data.description || "",
      address: data.address || "",
      client_name: data.client_name || "",
      contractor_type: data.contractor_type || undefined,
    };

    if (!projectData.project_name.trim()) {
      toast.error("AI-en genererte ikke et prosjektnavn. Prøv igjen.");
      return;
    }

    try {
      const createdProject = await onSubmit(projectData);
      
      // Save AI-generated checklists and routines to the new project
      if (createdProject?.id && profile?.company_id) {
        await saveAiRecommendations(
          createdProject.id,
          profile.company_id,
          data.recommended_checklists || [],
          data.recommended_routines || []
        );
      }

      const checklistCount = data.recommended_checklists?.length || 0;
      const routineCount = data.recommended_routines?.length || 0;
      
      toast.success(
        `Prosjekt opprettet!`,
        { description: `${checklistCount} sjekklister og ${routineCount} rutiner lagt til.` }
      );
      setFormData(getEmptyFormData());
      setSelectedTemplate("blank");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating project from AI:", error);
      setFormData(projectData);
      setActiveTab("manual");
      toast.error("Kunne ikke opprette prosjektet automatisk. Sjekk skjemaet og prøv igjen.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Opprett nytt prosjekt</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Manuelt oppsett
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Prosjekt-hjelperen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-0 flex-1 min-h-0">
            <Ks2ProjectSetupChat 
              onComplete={handleAiComplete}
              onCancel={() => setActiveTab("manual")}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-0 flex-1 flex flex-col min-h-0">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto pr-2"
                style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-6 pb-4">
            {/* Project Name - First and prominent */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Prosjektnavn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Prosjektnavn *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_name: e.target.value }))}
                    placeholder="Skriv inn prosjektnavn, f.eks. Tilbygg Storgata 5"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_number">Prosjektnummer</Label>
                  <Input
                    id="project_number"
                    value={formData.project_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_number: e.target.value }))}
                    placeholder="Auto-genereres hvis tom"
                  />
                </div>
              </div>
            </div>

            {/* Project Template Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prosjektmal (valgfritt)
              </h3>
              
              <div className="space-y-2">
                <Label>Forhåndsutfyll med mal</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg en mal" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {customTemplates.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Egne maler
                        </div>
                        {customTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.template_name}</span>
                              {template.description && (
                                <span className="text-xs text-muted-foreground">{template.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    Malen forhåndsutfyller entreprenørform og beskrivelse.
                  </p>
                  {isCompanyAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => setShowSaveTemplateDialog(true)}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Lagre som mal
                    </Button>
                  )}
                </div>

                {/* Save as template inline form */}
                {showSaveTemplateDialog && (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <Label className="text-xs">Navn på ny mal</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="F.eks. Tilbygg garasje"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveAsTemplate}
                        disabled={!newTemplateName.trim()}
                      >
                        Lagre
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSaveTemplateDialog(false)}
                      >
                        Avbryt
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lagrer nåværende entreprenørform og beskrivelse som gjenbrukbar mal.
                    </p>
                  </div>
                )}

                {/* Delete custom template */}
                {isCompanyAdmin && customTemplates.find(t => t.id === selectedTemplate) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive"
                    onClick={() => {
                      deleteTemplate(selectedTemplate);
                      setSelectedTemplate("blank");
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Slett denne malen
                  </Button>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Grunnleggende informasjon
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Gateadresse"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gnr_bnr">Gårds-/bruksnummer</Label>
                  <Input
                    id="gnr_bnr"
                    value={formData.gnr_bnr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gnr_bnr: e.target.value }))}
                    placeholder="F.eks. 123/45"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Byggherre
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Navn</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Byggherrens navn"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_org_number">Org.nr</Label>
                  <Input
                    id="client_org_number"
                    value={formData.client_org_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_org_number: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_contact_person">Kontaktperson</Label>
                  <Input
                    id="client_contact_person"
                    value={formData.client_contact_person}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_contact_person: e.target.value }))}
                    placeholder="Navn"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefon</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+47..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">E-post</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_email: e.target.value }))}
                    placeholder="e-post@eksempel.no"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Prosjektdetaljer
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entreprenørform</Label>
                  <Select
                    value={formData.contractor_type || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        contractor_type: value as "total" | "hoved" | "under",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Totalentreprenør</SelectItem>
                      <SelectItem value="hoved">Hovedentreprenør</SelectItem>
                      <SelectItem value="under">Underentreprenør</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prosjektleder</Label>
                  <Select
                    value={formData.project_leader_id || ""}
                    onValueChange={handleProjectLeaderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prosjektleder" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sha_coordinator_kp">SHA-koordinator KP</Label>
                  <Input
                    id="sha_coordinator_kp"
                    value={formData.sha_coordinator_kp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_kp: e.target.value }))}
                    placeholder="Navn på KP-koordinator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sha_coordinator_ku">SHA-koordinator KU</Label>
                  <Input
                    id="sha_coordinator_ku"
                    value={formData.sha_coordinator_ku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_ku: e.target.value }))}
                    placeholder="Navn på KU-koordinator"
                  />
                </div>
              </div>
            </div>

            {/* Dates and Contract */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Datoer og økonomi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">Planlagt oppstart</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">Planlagt ferdig</Label>
                  <Input
                    id="planned_end_date"
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_end_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_sum">Kontraktssum (kr)</Label>
                  <Input
                    id="contract_sum"
                    type="number"
                    value={formData.contract_sum || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contract_sum: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Hva skal gjøres?</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Beskriv oppdraget og hva som skal utføres..."
                    rows={4}
                  />
                </div>
                </div>
              </div>

              {/* Submit - Outside scroll area for visibility */}
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t flex-shrink-0 pb-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={isSaving || !formData.project_name.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oppretter...
                    </>
                  ) : (
                    "Opprett prosjekt"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
