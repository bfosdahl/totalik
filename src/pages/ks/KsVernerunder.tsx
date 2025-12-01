import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Shield, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, FileText, ShieldCheck, ExternalLink, ListTodo, Clock, Users, Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsSafetyRounds, type KsSafetyRound } from "@/hooks/useKsSafetyRounds";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KsSafetyRoundChecklist } from "@/components/ks/KsSafetyRoundChecklist";

interface VernerundeCheckpoint {
  id?: string;
  text: string;
  category?: string;
  order_index: number;
}

interface VernerundeTemplate {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  is_predefined: boolean;
  checkpoints?: VernerundeCheckpoint[];
}

const PREDEFINED_TEMPLATES = [
  {
    name: "Standard Vernerunde - Byggeplass",
    description: "Generell vernerunde for byggeplass med standard kontrollpunkter",
    checkpoints: [
      { text: "Kontroll av stilaser og stillas", category: "Sikkerhet", order_index: 0 },
      { text: "Sjekk av rekkverksikring og fallsikring", category: "Sikkerhet", order_index: 1 },
      { text: "Kontroll av elektriske anlegg og tilkoblinger", category: "Sikkerhet", order_index: 2 },
      { text: "Orden og rydding på arbeidsområdet", category: "Orden", order_index: 3 },
      { text: "Tilgang til nødutganger og rømningsveier", category: "Sikkerhet", order_index: 4 },
      { text: "Brannfarlig materiale og brannslukkingsutstyr", category: "Brann", order_index: 5 },
      { text: "Kjemikaliehåndtering og merking", category: "Kjemikalie", order_index: 6 },
      { text: "Vernemidler tilgjengelig og i bruk", category: "Verneutstyr", order_index: 7 },
      { text: "Tydelig skilting av fareområder", category: "Sikkerhet", order_index: 8 },
      { text: "Førstehjelp-utstyr tilgjengelig", category: "Helse", order_index: 9 },
    ]
  },
  {
    name: "Vernerunde - Innvendig Arbeid",
    description: "Kontrollpunkter for innvendig byggearbeid",
    checkpoints: [
      { text: "Kontroll av innvendig belysning", category: "Arbeidsmiljø", order_index: 0 },
      { text: "Ventilasjon og luftkvalitet", category: "Arbeidsmiljø", order_index: 1 },
      { text: "Støvdannelse og støvbekjempelse", category: "Helse", order_index: 2 },
      { text: "Sikring av huller i gulv og dekker", category: "Sikkerhet", order_index: 3 },
      { text: "Arbeid på stige - sikring", category: "Sikkerhet", order_index: 4 },
      { text: "Elektrisk håndverktøy - tilstand", category: "Utstyr", order_index: 5 },
      { text: "Støynivå og hørselsvern", category: "Helse", order_index: 6 },
      { text: "Renhold og avfallshåndtering", category: "Orden", order_index: 7 },
    ]
  },
  {
    name: "Vernerunde - Utvendig Arbeid",
    description: "Kontrollpunkter for utvendig byggearbeid og takkonstruksjoner",
    checkpoints: [
      { text: "Værforhold og vind", category: "Sikkerhet", order_index: 0 },
      { text: "Sikring mot fall fra tak", category: "Sikkerhet", order_index: 1 },
      { text: "Personlig fallsikringsutstyr i orden", category: "Verneutstyr", order_index: 2 },
      { text: "Tilgang til taket - stige/stillas sikret", category: "Sikkerhet", order_index: 3 },
      { text: "Kontroll av takflater - befarbarhet", category: "Sikkerhet", order_index: 4 },
      { text: "Materialhåndtering - løfting/sikring", category: "Utstyr", order_index: 5 },
      { text: "Avgrensning av fareområder på bakken", category: "Sikkerhet", order_index: 6 },
      { text: "Værmelding for arbeidsdagen", category: "Informasjon", order_index: 7 },
    ]
  },
  {
    name: "Vernerunde - Maskiner og Verktøy",
    description: "Fokus på maskiner, verktøy og utstyr",
    checkpoints: [
      { text: "Maskiner har påkrevd vern montert", category: "Sikkerhet", order_index: 0 },
      { text: "Maskinene er i forsvarlig stand", category: "Utstyr", order_index: 1 },
      { text: "Bruksanvisninger tilgjengelige", category: "Informasjon", order_index: 2 },
      { text: "Håndholdt elektroverktøy kontrollert", category: "Utstyr", order_index: 3 },
      { text: "Trykkluftslanger og koblinger i orden", category: "Utstyr", order_index: 4 },
      { text: "Løfteutstyr godkjent og merket", category: "Utstyr", order_index: 5 },
      { text: "Oppbevaringsplass for verktøy ryddig", category: "Orden", order_index: 6 },
    ]
  }
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Planlagt", variant: "secondary" },
  completed: { label: "Gjennomført", variant: "default" },
  cancelled: { label: "Kansellert", variant: "destructive" },
};

export default function KsVernerunder() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { projects } = useKsProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { safetyRounds, isLoading, createSafetyRound, updateSafetyRound, deleteSafetyRound } = useKsSafetyRounds(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [editingRound, setEditingRound] = useState<KsSafetyRound | null>(null);
  const [activeRound, setActiveRound] = useState<KsSafetyRound | null>(null);
  const [statusTab, setStatusTab] = useState<"pending" | "completed">("pending");
  const [formData, setFormData] = useState<{
    project_id: string;
    round_date: string;
    participants: string;
    findings: string;
    actions_required: string;
    responsible: string;
    deadline: string;
    status: "pending" | "completed" | "cancelled";
    template_id: string;
  }>({
    project_id: "",
    round_date: new Date().toISOString().split("T")[0],
    participants: "",
    findings: "",
    actions_required: "",
    responsible: "",
    deadline: "",
    status: "pending",
    template_id: "",
  });

  // Generator state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCheckpointsDialogOpen, setIsCheckpointsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<VernerundeTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", description: "" });
  const [checkpoints, setCheckpoints] = useState<VernerundeCheckpoint[]>([]);
  const [newCheckpoint, setNewCheckpoint] = useState({ text: "", category: "Sikkerhet" });

  const filteredRounds = selectedProjectId
    ? safetyRounds.filter((r) => r.project_id === selectedProjectId && r.status === statusTab)
    : safetyRounds.filter((r) => r.status === statusTab);

  const resetForm = () => {
    setFormData({
      project_id: "",
      round_date: new Date().toISOString().split("T")[0],
      participants: "",
      findings: "",
      actions_required: "",
      responsible: "",
      deadline: "",
      status: "pending",
      template_id: "",
    });
    setEditingRound(null);
  };

  const handleSubmit = async () => {
    if (!formData.project_id || !formData.round_date || !formData.template_id) {
      toast({ title: "Feil", description: "Fyll ut alle påkrevde felt", variant: "destructive" });
      return;
    }

    if (editingRound) {
      await updateSafetyRound(editingRound.id, formData);
    } else {
      await createSafetyRound({
        ...formData,
        photo_paths: null,
      });
    }

    setShowDialog(false);
    resetForm();
  };

  const handleEdit = (round: KsSafetyRound) => {
    setEditingRound(round);
    setFormData({
      project_id: round.project_id,
      round_date: round.round_date,
      participants: round.participants || "",
      findings: round.findings || "",
      actions_required: round.actions_required || "",
      responsible: round.responsible || "",
      deadline: round.deadline || "",
      status: round.status as "pending" | "completed" | "cancelled",
      template_id: round.template_id || "",
    });
    setShowDialog(true);
  };

  const handleStartRound = (round: KsSafetyRound) => {
    setActiveRound(round);
    setShowChecklistDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne vernerunden?")) {
      await deleteSafetyRound(id);
    }
  };

  const getProjectInfo = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? `${project.project_number} - ${project.name}` : "Ukjent prosjekt";
  };

  // Generator queries and mutations
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
      return data as VernerundeTemplate[];
    },
    enabled: !!profile?.company_id
  });

  const { data: templateCheckpoints } = useQuery({
    queryKey: ["vernerunde-checkpoints", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      const { data, error } = await supabase
        .from("ks_vernerunde_checkpoints")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");
      if (error) throw error;
      return data as VernerundeCheckpoint[];
    },
    enabled: !!selectedTemplateId
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof templateForm) => {
      if (!profile?.company_id) throw new Error("No company ID");
      const { data, error } = await supabase
        .from("ks_vernerunde_templates")
        .insert({
          name: template.name,
          description: template.description,
          company_id: profile.company_id,
          is_predefined: false
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vernerunde-templates"] });
      toast({ title: "Mal opprettet" });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: typeof templateForm & { id: string }) => {
      const { error } = await supabase
        .from("ks_vernerunde_templates")
        .update({ name: template.name, description: template.description })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vernerunde-templates"] });
      toast({ title: "Mal oppdatert" });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("ks_vernerunde_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vernerunde-templates"] });
      toast({ title: "Mal slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const saveCheckpointsMutation = useMutation({
    mutationFn: async ({ templateId, checkpoints }: { templateId: string; checkpoints: VernerundeCheckpoint[] }) => {
      if (!profile?.company_id) throw new Error("No company ID");
      await supabase.from("ks_vernerunde_checkpoints").delete().eq("template_id", templateId);
      const checkpointsToInsert = checkpoints.map((checkpoint, index) => ({
        template_id: templateId,
        text: checkpoint.text,
        category: checkpoint.category || "Sikkerhet",
        order_index: index,
        company_id: profile.company_id
      }));
      const { error } = await supabase.from("ks_vernerunde_checkpoints").insert(checkpointsToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vernerunde-checkpoints"] });
      toast({ title: "Kontrollpunkter lagret" });
      setIsCheckpointsDialogOpen(false);
      setCheckpoints([]);
      setSelectedTemplateId(null);
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const createFromPredefinedMutation = useMutation({
    mutationFn: async (predefinedTemplate: typeof PREDEFINED_TEMPLATES[0]) => {
      if (!profile?.company_id) throw new Error("No company ID");
      const { data: template, error: templateError } = await supabase
        .from("ks_vernerunde_templates")
        .insert({
          name: predefinedTemplate.name,
          description: predefinedTemplate.description,
          company_id: profile.company_id,
          is_predefined: true
        })
        .select()
        .single();
      if (templateError) throw templateError;
      const checkpointsToInsert = predefinedTemplate.checkpoints.map((cp) => ({
        template_id: template.id,
        text: cp.text,
        category: cp.category || "Sikkerhet",
        order_index: cp.order_index,
        company_id: profile.company_id
      }));
      const { error: checkpointsError } = await supabase
        .from("ks_vernerunde_checkpoints")
        .insert(checkpointsToInsert);
      if (checkpointsError) throw checkpointsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vernerunde-templates"] });
      toast({ title: "Forhåndsdefinert mal opprettet" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "" });
    setEditingTemplate(null);
  };

  const handleCreateTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleEditTemplate = (template: VernerundeTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({ name: template.name, description: template.description || "" });
    setIsTemplateDialogOpen(true);
  };

  const handleEditCheckpoints = (template: VernerundeTemplate) => {
    setSelectedTemplateId(template.id);
    setIsCheckpointsDialogOpen(true);
  };

  const handleAddCheckpoint = () => {
    if (!newCheckpoint.text.trim()) return;
    setCheckpoints([
      ...checkpoints,
      { text: newCheckpoint.text, category: newCheckpoint.category, order_index: checkpoints.length }
    ]);
    setNewCheckpoint({ text: "", category: "Sikkerhet" });
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleSaveCheckpoints = () => {
    if (!selectedTemplateId) return;
    const checkpointsToSave = templateCheckpoints && templateCheckpoints.length > 0 
      ? [...templateCheckpoints.filter(cp => !checkpoints.find(c => c.id === cp.id)), ...checkpoints]
      : checkpoints;
    saveCheckpointsMutation.mutate({ templateId: selectedTemplateId, checkpoints: checkpointsToSave });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vernerunder</h1>
            <p className="text-muted-foreground">
              Planlegg og dokumenter vernerunder på prosjektene
            </p>
          </div>
        </div>

        <Tabs defaultValue="oversikt" className="w-full">
          <TabsList>
            <TabsTrigger value="oversikt">Oversikt</TabsTrigger>
            <TabsTrigger value="generator">Mal Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="oversikt" className="space-y-6 mt-6">
            <div className="flex items-center justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ny vernerunde
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filtrer</CardTitle>
                <CardDescription>Vis vernerunder for et spesifikt prosjekt</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedProjectId || "all"}
                  onValueChange={(value) => setSelectedProjectId(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle prosjekter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle prosjekter</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Status tabs */}
            <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as "pending" | "completed")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  <Clock className="h-4 w-4 mr-2" />
                  Pågående
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fullførte
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Laster...</p>
                  </div>
                ) : filteredRounds.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ingen pågående vernerunder</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        {selectedProjectId ? "Ingen pågående vernerunder for valgt prosjekt" : "Opprett din første vernerunde"}
                      </p>
                      <Button
                        onClick={() => {
                          resetForm();
                          setShowDialog(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ny vernerunde
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredRounds.map((round) => (
                      <Card key={round.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{getProjectInfo(round.project_id)}</Badge>
                                <Badge variant={statusConfig[round.status]?.variant || "secondary"}>
                                  {statusConfig[round.status]?.label || round.status}
                                </Badge>
                              </div>
                              <CardTitle className="text-base">
                                Vernerunde {format(new Date(round.round_date), "d. MMMM yyyy", { locale: nb })}
                              </CardTitle>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(round)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(round.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {round.participants && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Deltakere</p>
                              <p className="text-sm">{round.participants}</p>
                            </div>
                          )}
                          {round.responsible && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Ansvarlig</p>
                              <p className="text-sm">
                                {round.responsible}
                                {round.deadline && ` • Frist: ${format(new Date(round.deadline), "d. MMM yyyy", { locale: nb })}`}
                              </p>
                            </div>
                          )}
                          
                          <Button 
                            onClick={() => handleStartRound(round)} 
                            className="w-full mt-4"
                            variant="default"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Start vernerunde
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Laster...</p>
                  </div>
                ) : filteredRounds.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">Ingen fullførte vernerunder</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedProjectId ? "Ingen fullførte vernerunder for valgt prosjekt" : "Fullførte vernerunder vises her"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredRounds.map((round) => (
                      <Card key={round.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{getProjectInfo(round.project_id)}</Badge>
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fullført
                                </Badge>
                              </div>
                              <CardTitle className="text-base">
                                Vernerunde {format(new Date(round.round_date), "d. MMMM yyyy", { locale: nb })}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            {round.participants && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Deltakere
                                </p>
                                <p className="text-sm">{round.participants}</p>
                              </div>
                            )}
                            {round.responsible && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Ansvarlig
                                </p>
                                <p className="text-sm">{round.responsible}</p>
                              </div>
                            )}
                          </div>
                          {round.findings && (
                            <div className="border-t pt-3">
                              <p className="text-xs font-medium text-muted-foreground">Funn</p>
                              <p className="text-sm">{round.findings}</p>
                            </div>
                          )}
                          {round.actions_required && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Tiltak påkrevet</p>
                              <p className="text-sm">{round.actions_required}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6 mt-6">
            <div className="flex items-center justify-end">
              <Button onClick={() => { resetTemplateForm(); setIsTemplateDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Ny mal
              </Button>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Lag egne maler for vernerunde eller bruk forhåndsdefinerte sjekklister
                </p>
              </CardContent>
            </Card>

            {/* Predefined Templates Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Forhåndsdefinerte maler</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {PREDEFINED_TEMPLATES.map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">Forhåndsdefinert</Badge>
                          </div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {template.checkpoints.length} kontrollpunkter
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createFromPredefinedMutation.mutate(template)}
                          disabled={createFromPredefinedMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Bruk denne malen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Templates Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Mine egne maler</h2>
              {isLoadingTemplates ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Laster...</p>
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {template.description && (
                              <CardDescription>{template.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" onClick={() => handleEditCheckpoints(template)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rediger kontrollpunkter
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Ingen egne maler</p>
                    <p className="text-sm text-muted-foreground mt-2">Opprett en mal for å komme i gang</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRound ? "Rediger vernerunde" : "Ny vernerunde"}</DialogTitle>
              <DialogDescription>
                Registrer informasjon om vernerunden
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Prosjekt *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Mal *</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg mal" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round_date">Dato *</Label>
                <Input
                  id="round_date"
                  type="date"
                  value={formData.round_date}
                  onChange={(e) => setFormData({ ...formData, round_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Deltakere</Label>
                <Input
                  id="participants"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  placeholder="Hvem deltok?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Hvem er ansvarlig?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Frist for oppfølging</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="findings">Funn/Observasjoner</Label>
                <Textarea
                  id="findings"
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  placeholder="Beskriv eventuelle funn..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions_required">Tiltak påkrevet</Label>
                <Textarea
                  id="actions_required"
                  value={formData.actions_required}
                  onChange={(e) => setFormData({ ...formData, actions_required: e.target.value })}
                  placeholder="Beskriv tiltak som må gjøres..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSubmit}>
                {editingRound ? "Lagre endringer" : "Opprett vernerunde"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Rediger mal" : "Ny mal"}</DialogTitle>
              <DialogDescription>
                Opprett en egen mal for vernerunde
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Malnavn *</Label>
                <Input
                  id="template_name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="F.eks. 'Standard vernerunde'"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_description">Beskrivelse</Label>
                <Textarea
                  id="template_description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Beskriv når denne malen skal brukes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateTemplate}>
                {editingTemplate ? "Lagre endringer" : "Opprett mal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checkpoints Dialog */}
        <Dialog open={isCheckpointsDialogOpen} onOpenChange={setIsCheckpointsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rediger kontrollpunkter</DialogTitle>
              <DialogDescription>
                Legg til kontrollpunkter for vernerunden
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Existing checkpoints */}
              {templateCheckpoints && templateCheckpoints.length > 0 && (
                <div className="space-y-2">
                  <Label>Eksisterende kontrollpunkter</Label>
                  <div className="space-y-2">
                    {templateCheckpoints.map((checkpoint, index) => (
                      <div key={checkpoint.id} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{checkpoint.category}</Badge>
                        <span className="flex-1 text-sm">{checkpoint.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New checkpoints */}
              {checkpoints.length > 0 && (
                <div className="space-y-2">
                  <Label>Nye kontrollpunkter</Label>
                  <div className="space-y-2">
                    {checkpoints.map((checkpoint, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="outline">{checkpoint.category}</Badge>
                        <span className="flex-1 text-sm">{checkpoint.text}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCheckpoint(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new checkpoint */}
              <div className="border-t pt-4 space-y-4">
                <Label>Legg til nytt kontrollpunkt</Label>
                <div className="space-y-2">
                  <Select
                    value={newCheckpoint.category}
                    onValueChange={(value) => setNewCheckpoint({ ...newCheckpoint, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sikkerhet">Sikkerhet</SelectItem>
                      <SelectItem value="Orden">Orden</SelectItem>
                      <SelectItem value="Helse">Helse</SelectItem>
                      <SelectItem value="Brann">Brann</SelectItem>
                      <SelectItem value="Verneutstyr">Verneutstyr</SelectItem>
                      <SelectItem value="Utstyr">Utstyr</SelectItem>
                      <SelectItem value="Arbeidsmiljø">Arbeidsmiljø</SelectItem>
                      <SelectItem value="Kjemikalie">Kjemikalie</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={newCheckpoint.text}
                    onChange={(e) => setNewCheckpoint({ ...newCheckpoint, text: e.target.value })}
                    placeholder="Beskrivelse av kontrollpunkt"
                  />
                  <Button onClick={handleAddCheckpoint} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Legg til
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckpointsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveCheckpoints}>
                Lagre kontrollpunkter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checklist Dialog */}
        <KsSafetyRoundChecklist
          round={activeRound}
          open={showChecklistDialog}
          onOpenChange={setShowChecklistDialog}
          onComplete={() => {
            setShowChecklistDialog(false);
            setActiveRound(null);
          }}
        />
      </div>
    </AppLayout>
  );
}
