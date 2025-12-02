import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Loader2, FileCheck, Calendar, CheckCircle2, ArrowLeft, Plus, Edit2, Trash2, List, FileText, Info, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKsTemplates } from "@/hooks/useKsProjects";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

interface TemplateItem {
  id?: string;
  text: string;
  help_text?: string;
  order_index: number;
  category?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  trade?: string;
  phase?: string;
  company_id: string;
}

export default function KsChecklists() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Tab state from URL
  const activeTab = searchParams.get("tab") || "gjennomfort";
  
  // Gjennomført tab state
  const [searchQuery, setSearchQuery] = useState("");
  const projectFromUrl = searchParams.get("project");
  const [selectedProject, setSelectedProject] = useState<string>(projectFromUrl || "all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Generator tab state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    trade: "UTF - Tømrerarbeid",
    phase: "Oppstart"
  });
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newItem, setNewItem] = useState({ text: "", help_text: "" });

  // Fetch system templates
  const { templates: systemTemplates, isLoading: systemTemplatesLoading } = useKsTemplates();

  // Fetch all checklists
  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ['ks-all-checklists', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('ks_checklists')
        .select(`
          *,
          template:ks_templates(*),
          project:ks_projects(id, name, project_number, address),
          items:ks_checklist_items(id, status)
        `)
        .eq('project.company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['ks-projects-filter', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('ks_projects')
        .select('id, name, project_number')
        .eq('company_id', profile.company_id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch company custom templates
  const { data: customTemplates, isLoading: customTemplatesLoading } = useQuery({
    queryKey: ["ks-custom-templates", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("ks_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!profile?.company_id
  });

  // Fetch items for selected template
  const { data: templateItems } = useQuery({
    queryKey: ["ks-template-items", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      const { data, error } = await supabase
        .from("ks_template_items")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");
      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!selectedTemplateId
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof templateForm) => {
      if (!profile?.company_id) throw new Error("No company ID");
      const { data, error } = await supabase
        .from("ks_templates")
        .insert({
          name: template.name,
          description: template.description,
          trade: template.trade,
          phase: template.phase,
          company_id: profile.company_id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast.success("Mal opprettet");
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: typeof templateForm & { id: string }) => {
      const { error } = await supabase
        .from("ks_templates")
        .update({
          name: template.name,
          description: template.description,
          trade: template.trade,
          phase: template.phase
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast.success("Mal oppdatert");
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("ks_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast.success("Mal slettet");
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    }
  });

  const saveItemsMutation = useMutation({
    mutationFn: async ({ templateId, items }: { templateId: string; items: TemplateItem[] }) => {
      if (!profile?.company_id) throw new Error("No company ID");
      await supabase.from("ks_template_items").delete().eq("template_id", templateId);
      const itemsToInsert = items.map((item, index) => ({
        template_id: templateId,
        text: item.text,
        help_text: item.help_text,
        order_index: index,
        category: item.category || "general",
        company_id: profile.company_id
      }));
      const { error } = await supabase.from("ks_template_items").insert(itemsToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-template-items"] });
      toast.success("Sjekkpunkter lagret");
      setIsItemsDialogOpen(false);
      setItems([]);
      setSelectedTemplateId(null);
    },
    onError: (error) => {
      toast.error("Feil: " + error.message);
    }
  });

  // Helper functions
  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "", trade: "UTF - Tømrerarbeid", phase: "Oppstart" });
    setEditingTemplate(null);
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const getCompletionPercentage = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const completedItems = items.filter(item => item.status && item.status !== 'pending').length;
    return Math.round((completedItems / items.length) * 100);
  };

  const filteredChecklists = checklists?.filter(checklist => {
    const matchesSearch = 
      checklist.template?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.project?.project_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || checklist.project_id === selectedProject;
    const matchesPhase = selectedPhase === "all" || checklist.phase === selectedPhase;
    return matchesSearch && matchesProject && matchesPhase;
  });

  const phases = Array.from(new Set(checklists?.map(c => c.phase).filter(Boolean))) as string[];

  // Group system templates by phase
  const templatesByPhase = systemTemplates.reduce((acc, template) => {
    const phase = template.phase || "Generelt";
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(template);
    return acc;
  }, {} as Record<string, typeof systemTemplates>);
  const phaseOrder = ["Før oppstart", "Råbygg", "Tett bygg", "Innvendig", "Ferdigbefaring", "Generelt"];

  useEffect(() => {
    if (templateItems && isItemsDialogOpen) {
      setItems(templateItems);
    }
  }, [templateItems, isItemsDialogOpen]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sjekklister</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Maler, generator og gjennomførte sjekklister
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maler" className="text-xs sm:text-sm">Maler</TabsTrigger>
            <TabsTrigger value="generator" className="text-xs sm:text-sm">Generator</TabsTrigger>
            <TabsTrigger value="gjennomfort" className="text-xs sm:text-sm">Gjennomført</TabsTrigger>
          </TabsList>

          {/* MALER TAB */}
          <TabsContent value="maler" className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="flex items-start gap-3 pt-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">System-maler</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Forhåndsdefinerte maler for UTF – Tømrerarbeid. Bruk dem som utgangspunkt i prosjektene dine.
                  </p>
                </div>
              </CardContent>
            </Card>

            {systemTemplatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {phaseOrder.map(phase => {
                  const phaseTemplates = templatesByPhase[phase];
                  if (!phaseTemplates || phaseTemplates.length === 0) return null;
                  return (
                    <div key={phase} className="space-y-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="outline">{phase}</Badge>
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {phaseTemplates.map(template => (
                          <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <CardTitle className="text-base">{template.name}</CardTitle>
                                </div>
                                {template.is_system_default && (
                                  <Badge variant="secondary" className="text-xs">System</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CardDescription>{template.description || "Ingen beskrivelse"}</CardDescription>
                              <p className="text-xs text-muted-foreground mt-2">Fag: {template.trade}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* GENERATOR TAB */}
          <TabsContent value="generator" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Egne sjekkliste-maler
                </h2>
                <p className="text-sm text-muted-foreground">
                  Lag maler som kan gjenbrukes på prosjekter
                </p>
              </div>
              <Button onClick={() => { resetTemplateForm(); setIsTemplateDialogOpen(true); }} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Ny Mal
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customTemplatesLoading ? (
                <Card><CardHeader><CardTitle>Laster...</CardTitle></CardHeader></Card>
              ) : customTemplates && customTemplates.length > 0 ? (
                customTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                      {template.phase && (
                        <p className="text-xs text-muted-foreground">Fase: {template.phase}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedTemplateId(template.id);
                          setIsItemsDialogOpen(true);
                        }}>
                          <List className="mr-2 h-4 w-4" />
                          Sjekkpunkter
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingTemplate(template);
                          setTemplateForm({
                            name: template.name,
                            description: template.description || "",
                            trade: template.trade || "UTF - Tømrerarbeid",
                            phase: template.phase || "Oppstart"
                          });
                          setIsTemplateDialogOpen(true);
                        }}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rediger
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          if (confirm("Er du sikker på at du vil slette denne malen?")) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Ingen maler ennå</CardTitle>
                    <CardDescription>Klikk "Ny Mal" for å opprette din første sjekkliste mal</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* GJENNOMFØRT TAB */}
          <TabsContent value="gjennomfort" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Alle sjekklister
                </CardTitle>
                <CardDescription>Filtrer og søk i sjekklister for alle prosjekter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Alle prosjekter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prosjekter</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger><SelectValue placeholder="Alle faser" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle faser</SelectItem>
                      {phases.map((phase) => (
                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {checklistsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredChecklists && filteredChecklists.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="border rounded-lg hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sjekkliste</TableHead>
                            <TableHead>Prosjekt</TableHead>
                            <TableHead>Fase</TableHead>
                            <TableHead>Opprettet</TableHead>
                            <TableHead>Utført</TableHead>
                            <TableHead>Fremdrift</TableHead>
                            <TableHead className="text-right">Handling</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredChecklists.map((checklist) => {
                            const completion = getCompletionPercentage(checklist.items || []);
                            return (
                              <TableRow key={checklist.id} className="cursor-pointer hover:bg-muted/50">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                                    {checklist.template?.name || "Ukjent mal"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">{checklist.project?.name || "-"}</div>
                                    {checklist.project?.project_number && (
                                      <Badge variant="outline" className="text-xs">{checklist.project.project_number}</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {checklist.phase ? <Badge variant="secondary">{checklist.phase}</Badge> : "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: nb })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {checklist.filled_at ? (
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      {format(new Date(checklist.filled_at), "dd.MM.yyyy", { locale: nb })}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Ikke utført</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
                                    </div>
                                    <span className="text-sm font-medium min-w-[3ch]">{completion}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => navigate(`/ks/checklists/${checklist.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Åpne
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="space-y-3 md:hidden">
                      {filteredChecklists.map((checklist) => {
                        const completion = getCompletionPercentage(checklist.items || []);
                        return (
                          <div 
                            key={checklist.id} 
                            className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate(`/ks/checklists/${checklist.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">{checklist.template?.name || "Ukjent mal"}</span>
                              </div>
                              {checklist.phase && <Badge variant="secondary" className="text-xs">{checklist.phase}</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{checklist.project?.name || "-"}</span>
                              {checklist.project?.project_number && (
                                <Badge variant="outline" className="text-xs">{checklist.project.project_number}</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: nb })}
                              </div>
                              {checklist.filled_at ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-xs">Utført</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Ikke utført</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
                              </div>
                              <span className="text-sm font-medium">{completion}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen sjekklister funnet</p>
                    {(searchQuery || selectedProject !== "all" || selectedPhase !== "all") && (
                      <p className="text-sm mt-2">Prøv å justere filtrene dine</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Rediger Mal" : "Ny Sjekkliste Mal"}</DialogTitle>
              <DialogDescription>Opprett en gjenbrukbar sjekkliste mal for dine prosjekter</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input id="name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="F.eks. Råbygg sjekkliste" />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea id="description" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Kort beskrivelse" />
              </div>
              <div>
                <Label htmlFor="phase">Fase</Label>
                <Select value={templateForm.phase} onValueChange={(value) => setTemplateForm({ ...templateForm, phase: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oppstart">Oppstart</SelectItem>
                    <SelectItem value="Råbygg">Råbygg</SelectItem>
                    <SelectItem value="Utvendig">Utvendig</SelectItem>
                    <SelectItem value="Innvendig">Innvendig</SelectItem>
                    <SelectItem value="Ferdigstillelse">Ferdigstillelse</SelectItem>
                    <SelectItem value="Annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} className="w-full sm:w-auto">Avbryt</Button>
              <Button onClick={() => editingTemplate ? updateTemplateMutation.mutate({ ...templateForm, id: editingTemplate.id }) : createTemplateMutation.mutate(templateForm)} disabled={!templateForm.name.trim()} className="w-full sm:w-auto">
                {editingTemplate ? "Oppdater" : "Opprett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Items Dialog */}
        <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Administrer Sjekkpunkter</DialogTitle>
              <DialogDescription>Legg til og rediger sjekkpunkter for denne malen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 p-4 border rounded-lg">
                <Label>Legg til nytt sjekkpunkt</Label>
                <Input placeholder="Sjekkpunkt tekst" value={newItem.text} onChange={(e) => setNewItem({ ...newItem, text: e.target.value })} />
                <Input placeholder="Hjelpetekst (valgfritt)" value={newItem.help_text} onChange={(e) => setNewItem({ ...newItem, help_text: e.target.value })} />
                <Button onClick={() => { if (newItem.text.trim()) { setItems([...items, { text: newItem.text, help_text: newItem.help_text, order_index: items.length }]); setNewItem({ text: "", help_text: "" }); }}} size="sm">
                  <Plus className="mr-2 h-4 w-4" />Legg til
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Sjekkpunkter ({items.length})</Label>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen sjekkpunkter lagt til ennå</p>
                ) : (
                  items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.text}</p>
                        {item.help_text && <p className="text-sm text-muted-foreground mt-1">{item.help_text}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsItemsDialogOpen(false); setItems([]); setSelectedTemplateId(null); }} className="w-full sm:w-auto">Avbryt</Button>
              <Button onClick={() => selectedTemplateId && saveItemsMutation.mutate({ templateId: selectedTemplateId, items })} disabled={items.length === 0} className="w-full sm:w-auto">Lagre Sjekkpunkter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
