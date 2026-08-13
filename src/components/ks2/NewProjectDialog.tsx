import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Sparkles, ClipboardList, Plus, Trash2, Save, Building2, Briefcase, Hammer } from "lucide-react";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { NewKsModule2ProjectInput, ProjectType } from "@/hooks/useKsModule2Projects";
import { Ks2ProjectSetupChat } from "./Ks2ProjectSetupChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyProjectTemplates } from "@/hooks/useCompanyProjectTemplates";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

const getProjectTypeOptions = (): { id: ProjectType; name: string; description: string; icon: typeof Building2; features: string[] }[] => [
  {
    id: "standard",
    name: t("auto.standard_prosjekt"),
    description: t("auto.komplett_prosjektstyring_med_alle_module"),
    icon: Building2,
    features: [t("auto.feat_ks_hms_sha"), t("auto.feat_byggesak_blanketter"), t("auto.feat_okonomi_fremdrift"), t("auto.feat_underleverandorer"), t("auto.feat_alle_moduler")]
  },
  {
    id: "small",
    name: t("auto.lite_prosjekt2"),
    description: t("auto.for_mindre_prosjekter_med_enklere_behov"),
    icon: Briefcase,
    features: [t("auto.feat_sjekklister"), t("auto.feat_bilder_dokumenter"), t("auto.feat_timer_befaringer"), t("auto.feat_ue_okonomi")]
  },
  {
    id: "mini",
    name: t("auto.mini_prosjekt"),
    description: t("auto.for_enkle_jobber_og_smaa_oppdrag"),
    icon: Hammer,
    features: [t("auto.feat_sjekklister"), t("auto.feat_avvik"), t("auto.feat_dokumenter")]
  }
];


// Prosjektmaler med forhåndsdefinert informasjon
const PROJECT_TEMPLATES = [
  {
    id: "blank",
    name: "Tomt prosjekt",
    description: t("auto.start_fra_bunnen_uten_forhaandsutfylling"),
    defaults: {}
  },
  {
    id: "enebolig",
    name: "Enebolig",
    description: t("auto.nybygg_eller_renovering_av_enebolig"),
    defaults: {
      description: t("auto.oppfoering_renovering_av_enebolig_prosje"),
      contractor_type: "total" as const
    }
  },
  {
    id: "leilighet",
    name: "Leilighetsbygg",
    description: t("auto.flerboligbygg_med_leiligheter"),
    defaults: {
      description: t("auto.oppfoering_av_leilighetsbygg_prosjektet_"),
      contractor_type: "total" as const
    }
  },
  {
    id: "naeringsbygg",
    name: "Næringsbygg",
    description: t("auto.kontor_butikk_eller_industribygg"),
    defaults: {
      description: t("auto.oppfoering_av_naeringsbygg_prosjektet_om"),
      contractor_type: "hoved" as const
    }
  },
  {
    id: "renovering",
    name: "Totalrenovering",
    description: t("auto.stoerre_renovering_av_eksisterende_bygg"),
    defaults: {
      description: t("auto.totalrenovering_av_eksisterende_bygg_pro"),
      contractor_type: "hoved" as const
    }
  },
  {
    id: "tilbygg",
    name: "Tilbygg/påbygg",
    description: t("auto.utvidelse_av_eksisterende_bygg"),
    defaults: {
      description: t("auto.tilbygg_paabygg_til_eksisterende_bygg_pr"),
      contractor_type: "hoved" as const
    }
  },
  {
    id: "betong",
    name: "Betongarbeid",
    description: t("auto.spesialisert_betongentreprise"),
    defaults: {
      description: t("auto.betongarbeider_prosjektet_omfatter_forsk"),
      contractor_type: "under" as const
    }
  },
  {
    id: "tomrer",
    name: "Tømrerarbeid",
    description: t("auto.toemrer_og_snekkerarbeid"),
    defaults: {
      description: t("auto.toemrer_og_snekkerarbeid_prosjektet_omfa"),
      contractor_type: "under" as const
    }
  },
  {
    id: "rorlegger",
    name: "Rørleggerarbeid",
    description: t("auto.vvs_og_sanitaerinstallasjon"),
    defaults: {
      description: t("auto.vvs_og_sanitaerarbeid_prosjektet_omfatte"),
      contractor_type: "under" as const
    }
  },
  {
    id: "elektro",
    name: "Elektroarbeid",
    description: t("auto.elektrisk_installasjon"),
    defaults: {
      description: t("auto.elektroarbeider_prosjektet_omfatter_elek"),
      contractor_type: "under" as const
    }
  },
  {
    id: "maler",
    name: "Malerarbeid",
    description: t("auto.maling_og_overflatebehandling"),
    defaults: {
      description: t("auto.maler_og_tapetserarbeid_prosjektet_omfat"),
      contractor_type: "under" as const
    }
  },
  {
    id: "flislegger",
    name: "Flislegging",
    description: t("auto.flis_og_vaatromsarbeid"),
    defaults: {
      description: t("auto.flislegging_og_vaatromsarbeid_prosjektet"),
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
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
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

    await onSubmit({ ...formData, project_type: selectedProjectType || "standard" });
    setFormData(getEmptyFormData());
    setSelectedTemplate("blank");
    setSelectedProjectType(null);
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
      project_type: selectedProjectType || "standard",
      project_name: data.project_name || "",
      description: data.description || "",
      address: data.address || "",
      client_name: data.client_name || "",
      contractor_type: data.contractor_type || undefined,
    };

    if (!projectData.project_name.trim()) {
      toast.error(t("auto.ai_en_genererte_ikke_et_prosjektnavn_pro"));
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
      toast.error(t("auto.kunne_ikke_opprette_prosjektet_automatis"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedProjectType(null); onOpenChange(o); }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] h-[90vh] flex flex-col overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            {selectedProjectType ? "Opprett nytt prosjekt" : "Velg prosjekttype"}
          </DialogTitle>
        </DialogHeader>

        {/* Project Type Selection Step */}
        {!selectedProjectType ? (
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-6">
              {t("auto.velg_hvilken_type_prosjekt_du_vil_oppret")}
            </p>
            <div className="grid gap-4">
              {PROJECT_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedProjectType(option.id)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5",
                      "border-border"
                    )}
                  >
                    <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{option.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {option.features.map((f) => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
        <>
        {/* Back button */}
        <div className="px-6 pb-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProjectType(null)} className="-ml-2 text-muted-foreground">
            ← Endre prosjekttype ({PROJECT_TYPE_OPTIONS.find(o => o.id === selectedProjectType)?.name})
          </Button>
        </div>

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

          <TabsContent value="ai" className="mt-0 flex-1 min-h-0 flex flex-col data-[state=inactive]:hidden">
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
                {t("auto.prosjektnavn")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">{t("auto.prosjektnavn_2")}</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_name: e.target.value }))}
                    placeholder={t("auto.skriv_inn_prosjektnavn_f_eks_tilbygg_sto")}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_number">{t("auto.prosjektnummer")}</Label>
                  <Input
                    id="project_number"
                    value={formData.project_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_number: e.target.value }))}
                    placeholder={t("auto.auto_genereres_hvis_tom")}
                  />
                </div>
              </div>
            </div>

            {/* Project Template Selection - standard only */}
            {selectedProjectType === "standard" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prosjektmal (valgfritt)
              </h3>
              
              <div className="space-y-2">
                <Label>{t("auto.forhaandsutfyll_med_mal")}</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_en_mal")} />
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
                          {t("auto.egne_maler")}
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
                    {t("auto.malen_forhaandsutfyller_entreprenoerform")}
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
                    <Label className="text-xs">{t("auto.navn_paa_ny_mal")}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder={t("auto.f_eks_tilbygg_garasje")}
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
                      {t("auto.lagrer_naavaerende_entreprenoerform_og_b")}
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
            )}

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t("auto.grunnleggende_informasjon")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">{t("auto.adresse")}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder={t("auto.gateadresse")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gnr_bnr">{t("auto.gaards_bruksnummer")}</Label>
                  <Input
                    id="gnr_bnr"
                    value={formData.gnr_bnr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gnr_bnr: e.target.value }))}
                    placeholder={t("auto.f_eks_123_45")}
                  />
                </div>
              </div>
            </div>

            {/* Client Info - not for mini */}
            {selectedProjectType !== "mini" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t("auto.byggherre")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">{t("auto.navn_2")}</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                    placeholder={t("auto.byggherrens_navn")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_org_number">{t("auto.org_nr")}</Label>
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
                  <Label htmlFor="client_contact_person">{t("auto.kontaktperson_2")}</Label>
                  <Input
                    id="client_contact_person"
                    value={formData.client_contact_person}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_contact_person: e.target.value }))}
                    placeholder={t("auto.navn_2")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">{t("auto.telefon")}</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+47..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">{t("auto.e_post_2")}</Label>
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
            )}

            {/* Project Details - standard and small only */}
            {selectedProjectType !== "mini" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t("auto.prosjektdetaljer")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.entreprenoerform")}</Label>
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
                      <SelectValue placeholder={t("auto.velg_type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">{t("auto.totalentreprenoer")}</SelectItem>
                      <SelectItem value="hoved">{t("auto.hovedentreprenoer")}</SelectItem>
                      <SelectItem value="under">{t("auto.underentreprenoer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("auto.prosjektleder")}</Label>
                  <Select
                    value={formData.project_leader_id || ""}
                    onValueChange={handleProjectLeaderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_prosjektleder")} />
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
                  <Label htmlFor="sha_coordinator_kp">{t("auto.sha_koordinator_kp")}</Label>
                  <Input
                    id="sha_coordinator_kp"
                    value={formData.sha_coordinator_kp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_kp: e.target.value }))}
                    placeholder={t("auto.navn_paa_kp_koordinator")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sha_coordinator_ku">{t("auto.sha_koordinator_ku")}</Label>
                  <Input
                    id="sha_coordinator_ku"
                    value={formData.sha_coordinator_ku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_ku: e.target.value }))}
                    placeholder={t("auto.navn_paa_ku_koordinator")}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Dates and Contract */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t("auto.datoer_og_oekonomi")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">{t("auto.planlagt_oppstart")}</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">{t("auto.planlagt_ferdig")}</Label>
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
                  <Label htmlFor="description">{t("auto.hva_skal_gjoeres")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t("auto.beskriv_oppdraget_og_hva_som_skal_utfoer")}
                    rows={4}
                  />
                </div>
                </div>
              </div>

              {/* Submit - Outside scroll area for visibility */}
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t flex-shrink-0 pb-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("auto.avbryt")}
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
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
