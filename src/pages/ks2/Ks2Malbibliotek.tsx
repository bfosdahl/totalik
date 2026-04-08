import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  FileText, 
  ClipboardList, 
  Download, 
  Eye,
  FolderOpen,
  File,
  FileImage,
  BookOpen,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Check,
  Edit,
  PenLine,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Ks2ChecklistWizard, PreSelectedTemplate } from "@/components/ks2/Ks2ChecklistWizard";
import { useAdminTemplatesForCustomers, AdminChecklistTemplate, AdminRoutineTemplate, AdminDocument } from "@/hooks/useAdminTemplatesForCustomers";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { useKsModule2Routines, KsModule2Routine } from "@/hooks/useKsModule2Routines";
import { useKsModule2ChecklistTemplates, KsModule2ChecklistTemplate, ChecklistCheckpoint } from "@/hooks/useKsModule2ChecklistTemplates";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHECKLIST_CATEGORIES: Record<string, string> = {
  tomrerarbeid: "Tømrerarbeid",
  vatrom: "Våtrom",
  betong: "Betong",
  tak: "Tak",
  fasade: "Fasade",
  grunn: "Grunn og fundamenter",
  sluttkontroll: "Sluttkontroll",
  forprosjekt: "Førprosjekt",
  underentreprenor: "Underentreprenør",
  uk: "Uavhengig kontroll",
  general: "Generelt",
};

// Dynamically get category config with fallback colors
const getCategoryConfig = (category: string): { label: string; icon: typeof FileText; color: string } => {
  const categoryColors = [
    "text-primary",
    "text-blue-500",
    "text-purple-500",
    "text-orange-500",
    "text-emerald-500",
    "text-green-500",
    "text-yellow-500",
    "text-cyan-500",
    "text-pink-500",
    "text-indigo-500",
  ];
  
  // Hash the category name to get a consistent color
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % categoryColors.length;
  
  return {
    label: category,
    icon: FolderOpen,
    color: categoryColors[colorIndex],
  };
};

const ROUTINE_CATEGORIES: Record<string, string> = {
  kvalitetssikring: "Kvalitetssikring - Generelt",
  avvikshåndtering: "Avvikshåndtering",
  dokumentstyring: "Dokumentstyring",
  underentreprenor: "Underentreprenørkontroll",
  hms: "HMS på byggeplass",
  opplæring: "Opplæring",
  kontroll: "Kontroll",
  general: "Generelt",
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
  if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes("image")) return <FileImage className="h-8 w-8 text-blue-500" />;
  if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-8 w-8 text-blue-600" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
};

export default function Ks2Malbibliotek() {
  const { projectId } = useParams();
  const { checklistTemplates, routineTemplates, documents, folders, folderTree, isLoading } = useAdminTemplatesForCustomers('ks-bygg');
  const { 
    checklistTemplates: projectChecklists,
    routineTemplates: projectRoutines,
    documentTemplates: projectDocuments,
    addedChecklistIds,
    addedRoutineIds,
    addedDocumentIds,
    addChecklistTemplate,
    addRoutineTemplate,
    addDocument,
    removeTemplate,
    markAsImplemented,
    unmarkAsImplemented,
    isLoading: isLoadingProject,
    isSaving,
  } = useKsModule2ProjectTemplates(projectId);

  const {
    routines: customRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    isLoading: isLoadingCustomRoutines,
    isSaving: isSavingCustomRoutine,
  } = useKsModule2Routines(projectId);

  const {
    templates: customChecklistTemplates,
    customCategories: existingCustomCategories,
    createTemplate: createChecklistTemplate,
    updateTemplate: updateChecklistTemplate,
    deleteTemplate: deleteChecklistTemplate,
    isLoading: isLoadingCustomChecklists,
    isSaving: isSavingCustomChecklist,
  } = useKsModule2ChecklistTemplates(projectId);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("checklists");
  const [selectedChecklistCategory, setSelectedChecklistCategory] = useState<string>("all");
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>("all");
  const [selectedRoutineCategory, setSelectedRoutineCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<'checklist' | 'routine' | 'document'>('checklist');
  const [expandedDocCategories, setExpandedDocCategories] = useState<Record<string, boolean>>({});

  // Dialog states
  const [selectedChecklist, setSelectedChecklist] = useState<AdminChecklistTemplate | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<AdminRoutineTemplate | null>(null);
  
  // Custom routine dialog
  const [showCustomRoutineDialog, setShowCustomRoutineDialog] = useState(false);
  const [editingCustomRoutine, setEditingCustomRoutine] = useState<KsModule2Routine | null>(null);
  const [customRoutineName, setCustomRoutineName] = useState("");
  const [customRoutineDescription, setCustomRoutineDescription] = useState("");
  const [customRoutineContent, setCustomRoutineContent] = useState("");
  const [customRoutineCategory, setCustomRoutineCategory] = useState("general");

  // Custom checklist template dialog
  const [showCustomChecklistDialog, setShowCustomChecklistDialog] = useState(false);
  const [editingCustomChecklist, setEditingCustomChecklist] = useState<KsModule2ChecklistTemplate | null>(null);
  const [customChecklistName, setCustomChecklistName] = useState("");
  const [customChecklistDescription, setCustomChecklistDescription] = useState("");
  const [customChecklistCategory, setCustomChecklistCategory] = useState("general");
  const [customChecklistUseNewCategory, setCustomChecklistUseNewCategory] = useState(false);
  const [customChecklistNewCategory, setCustomChecklistNewCategory] = useState("");
  const [customChecklistCheckpoints, setCustomChecklistCheckpoints] = useState<ChecklistCheckpoint[]>([]);

  // Checklist wizard state
  const [showChecklistWizard, setShowChecklistWizard] = useState(false);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState<PreSelectedTemplate | null>(null);

  const handleStartCustomChecklist = (template: KsModule2ChecklistTemplate) => {
    setSelectedTemplateForWizard({
      id: template.id,
      template_name: template.template_name,
      category: template.category,
      description: template.description || undefined,
      checkpoints: template.checkpoints,
    });
    setShowChecklistWizard(true);
  };

  const handleWizardClose = (result?: { saved: boolean }) => {
    setShowChecklistWizard(false);
    setSelectedTemplateForWizard(null);
  };

  // Filter checklist templates
  const filteredChecklists = checklistTemplates.filter(t => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedChecklistCategory === "all" || t.category === selectedChecklistCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter routine templates
  const filteredRoutines = routineTemplates.filter(r => {
    const matchesSearch = r.routine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedRoutineCategory === "all" || r.category === selectedRoutineCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter custom routines
  const filteredCustomRoutines = customRoutines.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedDocumentCategory === "all" || doc.category === selectedDocumentCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
      toast.success("Dokumentet åpnes i ny fane");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke laste ned dokumentet");
    }
  };

  const openCreateCustomRoutine = () => {
    setEditingCustomRoutine(null);
    setCustomRoutineName("");
    setCustomRoutineDescription("");
    setCustomRoutineContent("");
    setCustomRoutineCategory("general");
    setShowCustomRoutineDialog(true);
  };

  const openEditCustomRoutine = (routine: KsModule2Routine) => {
    setEditingCustomRoutine(routine);
    setCustomRoutineName(routine.name);
    setCustomRoutineDescription(routine.description || "");
    setCustomRoutineContent(routine.content || "");
    setCustomRoutineCategory(routine.category || "general");
    setShowCustomRoutineDialog(true);
  };

  const handleSaveCustomRoutine = async () => {
    if (!customRoutineName.trim()) {
      toast.error("Vennligst fyll inn navn på rutinen");
      return;
    }

    if (editingCustomRoutine) {
      await updateRoutine(editingCustomRoutine.id, {
        name: customRoutineName,
        description: customRoutineDescription || null,
        content: customRoutineContent || null,
        category: customRoutineCategory,
      });
    } else {
      await createRoutine({
        project_id: projectId!,
        name: customRoutineName,
        description: customRoutineDescription || undefined,
        content: customRoutineContent || undefined,
        category: customRoutineCategory,
      });
    }
    setShowCustomRoutineDialog(false);
  };

  const handleDeleteCustomRoutine = async (routine: KsModule2Routine) => {
    if (confirm("Er du sikker på at du vil slette denne rutinen?")) {
      await deleteRoutine(routine.id);
    }
  };

  // Custom checklist template handlers
  const openCreateCustomChecklist = () => {
    setEditingCustomChecklist(null);
    setCustomChecklistName("");
    setCustomChecklistDescription("");
    setCustomChecklistCategory("general");
    setCustomChecklistUseNewCategory(false);
    setCustomChecklistNewCategory("");
    setCustomChecklistCheckpoints([{ checkpoint_text: "", help_text: "" }]);
    setShowCustomChecklistDialog(true);
  };

  const openEditCustomChecklist = (checklist: KsModule2ChecklistTemplate) => {
    setEditingCustomChecklist(checklist);
    setCustomChecklistName(checklist.template_name);
    setCustomChecklistDescription(checklist.description || "");
    setCustomChecklistCategory(checklist.category || "general");
    setCustomChecklistUseNewCategory(false);
    setCustomChecklistNewCategory("");
    setCustomChecklistCheckpoints(
      checklist.checkpoints.length > 0 
        ? checklist.checkpoints 
        : [{ checkpoint_text: "", help_text: "" }]
    );
    setShowCustomChecklistDialog(true);
  };

  const handleSaveCustomChecklist = async () => {
    if (!customChecklistName.trim()) {
      toast.error("Vennligst fyll inn navn på sjekklisten");
      return;
    }

    const validCheckpoints = customChecklistCheckpoints.filter(cp => cp.checkpoint_text.trim());
    if (validCheckpoints.length === 0) {
      toast.error("Legg til minst ett sjekkpunkt");
      return;
    }

    const finalCategory = customChecklistUseNewCategory && customChecklistNewCategory.trim()
      ? customChecklistNewCategory.trim()
      : customChecklistCategory;

    if (editingCustomChecklist) {
      await updateChecklistTemplate(editingCustomChecklist.id, {
        template_name: customChecklistName,
        description: customChecklistDescription || null,
        category: finalCategory,
        checkpoints: validCheckpoints,
      });
    } else {
      await createChecklistTemplate({
        project_id: projectId!,
        template_name: customChecklistName,
        description: customChecklistDescription || undefined,
        category: finalCategory,
        checkpoints: validCheckpoints,
      });
    }
    setShowCustomChecklistDialog(false);
  };

  const handleDeleteCustomChecklist = async (checklist: KsModule2ChecklistTemplate) => {
    if (confirm("Er du sikker på at du vil slette denne sjekkliste-malen?")) {
      await deleteChecklistTemplate(checklist.id);
    }
  };

  const addCheckpoint = () => {
    setCustomChecklistCheckpoints([...customChecklistCheckpoints, { checkpoint_text: "", help_text: "" }]);
  };

  const updateCheckpoint = (index: number, field: keyof ChecklistCheckpoint, value: string) => {
    const updated = [...customChecklistCheckpoints];
    updated[index] = { ...updated[index], [field]: value };
    setCustomChecklistCheckpoints(updated);
  };

  const removeCheckpoint = (index: number) => {
    if (customChecklistCheckpoints.length > 1) {
      setCustomChecklistCheckpoints(customChecklistCheckpoints.filter((_, i) => i !== index));
    }
  };

  // Get unique categories that exist in the data
  const checklistCategoriesInUse = [...new Set(checklistTemplates.map(t => t.category))];
  const routineCategoriesInUse = [...new Set(routineTemplates.map(r => r.category))];
  const documentCategoriesInUse = [...new Set(documents.map(d => d.category).filter(Boolean))];

  // All available categories for custom checklists (predefined + custom)
  const allChecklistCategories = { ...CHECKLIST_CATEGORIES };
  existingCustomCategories.forEach(cat => {
    if (!allChecklistCategories[cat]) {
      allChecklistCategories[cat] = cat;
    }
  });

  const openAddDialog = (type: 'checklist' | 'routine' | 'document') => {
    setAddDialogType(type);
    setShowAddDialog(true);
  };

  if (isLoading || isLoadingProject || isLoadingCustomRoutines || isLoadingCustomChecklists) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster malbibliotek...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Malbibliotek</h1>
          <p className="text-muted-foreground">
            Bla gjennom og bruk sjekkliste-maler, rutiner og dokumenter fra systemleverandøren
          </p>
        </div>
        <Button onClick={() => openAddDialog('checklist')} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Legg til i dette prosjektet
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter maler, rutiner og dokumenter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats - horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{projectChecklists.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Sjekklister</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{projectRoutines.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Rutiner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{customRoutines.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Egne rut.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{customChecklistTemplates.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Egne sjekk.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] sm:min-w-0 shrink-0">
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10">
                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{projectDocuments.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Dokumenter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="checklists" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Sjekklister</span>
          </TabsTrigger>
          <TabsTrigger value="custom-checklists" className="gap-2">
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Egne sjekklister</span>
            <span className="sm:hidden">Egne</span>
          </TabsTrigger>
          <TabsTrigger value="routines" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Rutiner</span>
          </TabsTrigger>
          <TabsTrigger value="custom-routines" className="gap-2">
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Egne rutiner</span>
            <span className="sm:hidden">Egne</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumenter</span>
            <span className="sm:hidden">Dok.</span>
          </TabsTrigger>
        </TabsList>

        {/* Checklist Templates Tab */}
        <TabsContent value="checklists" className="space-y-2">
          {filteredChecklists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen sjekkliste-maler funnet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {/* Group by category */}
              {checklistCategoriesInUse.map((cat) => {
                const categoryTemplates = filteredChecklists.filter(t => t.category === cat);
                if (categoryTemplates.length === 0) return null;
                const isCatExpanded = expandedDocCategories[`cl-${cat}`] ?? false;

                return (
                  <Collapsible
                    key={cat}
                    open={isCatExpanded}
                    onOpenChange={(open) => setExpandedDocCategories(prev => ({ ...prev, [`cl-${cat}`]: open }))}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {isCatExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm">{CHECKLIST_CATEGORIES[cat] || cat}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{categoryTemplates.length}</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 border-l pl-3 space-y-0.5 mb-2">
                        {categoryTemplates.map((template) => {
                          const isAdded = addedChecklistIds.includes(template.id);
                          const projectTemplate = projectChecklists.find(
                            pt => pt.admin_checklist_template_id === template.id
                          );

                          return (
                            <div
                              key={template.id}
                              className={cn(
                                "flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors group",
                                isAdded && "bg-primary/5"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isAdded && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{template.template_name}</span>
                                    {template.is_mandatory && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Obl.</Badge>
                                    )}
                                    {template.is_locked && (
                                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                    )}
                                  </div>
                                  {template.description && (
                                    <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setSelectedChecklist(template)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {isAdded ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => projectTemplate && removeTemplate(projectTemplate.id)}
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => addChecklistTemplate(template.id)}
                                    disabled={isSaving}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Legg til
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Custom Checklists Tab */}
        <TabsContent value="custom-checklists" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Opprett og administrer egne sjekkliste-maler for dette prosjektet
            </p>
            <Button onClick={openCreateCustomChecklist}>
              <Plus className="h-4 w-4 mr-2" />
              Ny sjekkliste-mal
            </Button>
          </div>

          {customChecklistTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Ingen egne sjekkliste-maler opprettet</p>
                <p className="text-sm">Opprett din første sjekkliste-mal ved å klikke på knappen ovenfor</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0.5">
              {customChecklistTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PenLine className="h-4 w-4 text-cyan-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{template.template_name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {allChecklistCategories[template.category] || template.category}
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground mr-1">{template.checkpoints.length} pkt</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleStartCustomChecklist(template)}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEditCustomChecklist(template)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteCustomChecklist(template)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routine Templates Tab */}
        <TabsContent value="routines" className="space-y-2">
          {filteredRoutines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen rutine-maler funnet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {routineCategoriesInUse.map((cat) => {
                const categoryRoutines = filteredRoutines.filter(r => r.category === cat);
                if (categoryRoutines.length === 0) return null;
                const isCatExpanded = expandedDocCategories[`rt-${cat}`] ?? false;

                return (
                  <Collapsible
                    key={cat}
                    open={isCatExpanded}
                    onOpenChange={(open) => setExpandedDocCategories(prev => ({ ...prev, [`rt-${cat}`]: open }))}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          {isCatExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm">{ROUTINE_CATEGORIES[cat] || cat}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{categoryRoutines.length}</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 border-l pl-3 space-y-0.5 mb-2">
                        {categoryRoutines.map((routine) => {
                          const isAdded = addedRoutineIds.includes(routine.id);
                          const projectTemplate = projectRoutines.find(
                            pt => pt.admin_routine_template_id === routine.id
                          );

                          return (
                            <div
                              key={routine.id}
                              className={cn(
                                "flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors group",
                                isAdded && "bg-purple-500/5"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isAdded && <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{routine.routine_name}</span>
                                    {routine.is_mandatory && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Obl.</Badge>
                                    )}
                                    {routine.is_locked && (
                                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                    )}
                                  </div>
                                  {routine.description && (
                                    <p className="text-xs text-muted-foreground truncate">{routine.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setSelectedRoutine(routine)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {isAdded ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => projectTemplate && removeTemplate(projectTemplate.id)}
                                    disabled={isSaving}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => addRoutineTemplate(routine.id)}
                                    disabled={isSaving}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Legg til
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Custom Routines Tab */}
        <TabsContent value="custom-routines" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Opprett og administrer egne rutiner for dette prosjektet
            </p>
            <Button onClick={openCreateCustomRoutine}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
          </div>

          {filteredCustomRoutines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <PenLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Ingen egne rutiner opprettet</p>
                <p className="text-sm">Opprett din første rutine ved å klikke på knappen ovenfor</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0.5">
              {filteredCustomRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PenLine className="h-4 w-4 text-green-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{routine.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {ROUTINE_CATEGORIES[routine.category || 'general'] || routine.category}
                        </Badge>
                      </div>
                      {routine.description && (
                        <p className="text-xs text-muted-foreground truncate">{routine.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground mr-1">
                      {format(parseISO(routine.created_at), "dd.MM.yy", { locale: nb })}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEditCustomRoutine(routine)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteCustomRoutine(routine)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {folderTree.length === 0 && documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumenter tilgjengelig</p>
                <p className="text-sm mt-1">Dokumenter vil bli lagt til av systemadministrator</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {folderTree.map((folder) => {
                const folderDocs = documents.filter(d => d.folder_id === folder.id);
                const filteredFolderDocs = folderDocs.filter(doc => {
                  const matchesSearch = !searchQuery || 
                    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
                  return matchesSearch;
                });
                
                if (searchQuery && filteredFolderDocs.length === 0 && folder.children.length === 0) return null;
                
                const isExpanded = expandedDocCategories[folder.id] ?? false;
                const addedCount = filteredFolderDocs.filter(d => addedDocumentIds.includes(d.id)).length;
                
                return (
                  <Collapsible
                    key={folder.id}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedDocCategories(prev => ({ ...prev, [folder.id]: open }))}
                    className="md:col-span-1"
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FolderOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{folder.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {filteredFolderDocs.length} dokument{filteredFolderDocs.length !== 1 ? 'er' : ''}
                                  {addedCount > 0 && (
                                    <span className="text-amber-600 ml-2">
                                      • {addedCount} lagt til
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="divide-y">
                          {filteredFolderDocs.map((doc) => {
                            const isAdded = addedDocumentIds.includes(doc.id);
                            const projectTemplate = projectDocuments.find(
                              pt => pt.admin_document_id === doc.id
                            );
                            
                            return (
                              <div 
                                key={doc.id} 
                                className={cn(
                                  "py-3 first:pt-0 last:pb-0",
                                  isAdded && "bg-amber-50/50 dark:bg-amber-950/20 -mx-4 px-4 rounded"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  {getFileIcon(doc.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm truncate">
                                        {doc.document_name}
                                      </span>
                                      {isAdded && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                          <Check className="h-3 w-3 mr-1" />
                                          Lagt til
                                        </Badge>
                                      )}
                                      {doc.is_mandatory && (
                                        <Badge variant="destructive" className="text-xs">
                                          Obligatorisk
                                        </Badge>
                                      )}
                                    </div>
                                    {doc.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {doc.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {doc.version && (
                                        <span className="text-xs text-muted-foreground">
                                          v{doc.version}
                                        </span>
                                      )}
                                      <div className="flex gap-1 ml-auto">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 text-xs"
                                          onClick={() => handleDownloadDocument(doc)}
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Last ned
                                        </Button>
                                        {isAdded ? (
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="h-7 text-xs text-destructive hover:text-destructive"
                                            onClick={() => projectTemplate && removeTemplate(projectTemplate.id)}
                                            disabled={isSaving}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        ) : (
                                          <Button 
                                            variant="ghost"
                                            size="sm" 
                                            className="h-7 text-xs"
                                            onClick={() => addDocument(doc.id)}
                                            disabled={isSaving}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Legg til
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {filteredFolderDocs.length === 0 && (
                            <p className="text-sm text-muted-foreground py-2">Ingen dokumenter i denne mappen</p>
                          )}
                        </div>
                        
                        {/* Subfolders */}
                        {folder.children.length > 0 && (
                          <div className="mt-4 space-y-2 border-t pt-4">
                            {folder.children.map((subFolder) => {
                              const subFolderDocs = documents.filter(d => d.folder_id === subFolder.id);
                              const filteredSubDocs = subFolderDocs.filter(doc => {
                                const matchesSearch = !searchQuery || 
                                  doc.document_name.toLowerCase().includes(searchQuery.toLowerCase());
                                return matchesSearch;
                              });
                              
                              if (searchQuery && filteredSubDocs.length === 0) return null;
                              
                              const subIsExpanded = expandedDocCategories[subFolder.id] ?? false;
                              
                              return (
                                <Collapsible
                                  key={subFolder.id}
                                  open={subIsExpanded}
                                  onOpenChange={(open) => setExpandedDocCategories(prev => ({ ...prev, [subFolder.id]: open }))}
                                >
                                  <div className="border rounded-lg overflow-hidden">
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <FolderOpen className="h-4 w-4 text-primary" />
                                        <span className="flex-1 font-medium text-sm">{subFolder.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {filteredSubDocs.length}
                                        </Badge>
                                        {subIsExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="p-3 pt-0 space-y-2">
                                        {filteredSubDocs.map((doc) => (
                                          <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 transition-colors"
                                          >
                                            {getFileIcon(doc.file_type)}
                                            <div className="flex-1 min-w-0">
                                              <span className="font-medium text-sm truncate">{doc.document_name}</span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDownloadDocument(doc)}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Checklist Preview Dialog */}
      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {selectedChecklist?.template_name}
            </DialogTitle>
            <DialogDescription>
              {selectedChecklist?.description}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {CHECKLIST_CATEGORIES[selectedChecklist?.category || ''] || selectedChecklist?.category}
                </Badge>
                {selectedChecklist?.is_mandatory && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Obligatorisk
                  </Badge>
                )}
                {selectedChecklist?.is_locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Låst
                  </Badge>
                )}
                {selectedChecklist?.version && (
                  <Badge variant="outline">v{selectedChecklist.version}</Badge>
                )}
              </div>
              
              <div className="border rounded-lg divide-y">
                <div className="p-3 bg-muted/50 font-medium">
                  Sjekkpunkter ({selectedChecklist?.checkpoints?.length || 0})
                </div>
                {(selectedChecklist?.checkpoints as any[] || []).map((checkpoint: any, index: number) => {
                  const text = typeof checkpoint === 'string' 
                    ? checkpoint 
                    : checkpoint.text || checkpoint.checkpoint || checkpoint.checkpoint_text || '';
                  const helpText = checkpoint?.help || checkpoint?.help_text || '';
                  
                  return (
                    <div key={index} className="p-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm">{text}</p>
                        {helpText && (
                          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChecklist(null)}>
              Lukk
            </Button>
            {selectedChecklist && !addedChecklistIds.includes(selectedChecklist.id) && (
              <Button onClick={() => {
                addChecklistTemplate(selectedChecklist.id);
                setSelectedChecklist(null);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til i prosjektet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Routine Preview Dialog */}
      <Dialog open={!!selectedRoutine} onOpenChange={() => setSelectedRoutine(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              {selectedRoutine?.routine_name}
            </DialogTitle>
            <DialogDescription>
              {selectedRoutine?.description}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {ROUTINE_CATEGORIES[selectedRoutine?.category || ''] || selectedRoutine?.category}
                </Badge>
                {selectedRoutine?.is_mandatory && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Obligatorisk
                  </Badge>
                )}
                {selectedRoutine?.is_locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Låst
                  </Badge>
                )}
                {selectedRoutine?.version && (
                  <Badge variant="outline">v{selectedRoutine.version}</Badge>
                )}
              </div>
              
              {selectedRoutine?.content && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{selectedRoutine.content}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRoutine(null)}>
              Lukk
            </Button>
            {selectedRoutine && !addedRoutineIds.includes(selectedRoutine.id) && (
              <Button onClick={() => {
                addRoutineTemplate(selectedRoutine.id);
                setSelectedRoutine(null);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til i prosjektet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Routine Create/Edit Dialog */}
      <Dialog open={showCustomRoutineDialog} onOpenChange={setShowCustomRoutineDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-green-500" />
              {editingCustomRoutine ? "Rediger rutine" : "Opprett ny rutine"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomRoutine 
                ? "Rediger innholdet i rutinen nedenfor"
                : "Fyll inn informasjon for å opprette en ny rutine"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routine-name">Navn på rutine *</Label>
              <Input
                id="routine-name"
                value={customRoutineName}
                onChange={(e) => setCustomRoutineName(e.target.value)}
                placeholder="F.eks. Rutine for kvalitetskontroll"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routine-category">Kategori</Label>
              <Select value={customRoutineCategory} onValueChange={setCustomRoutineCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROUTINE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routine-description">Beskrivelse</Label>
              <Input
                id="routine-description"
                value={customRoutineDescription}
                onChange={(e) => setCustomRoutineDescription(e.target.value)}
                placeholder="Kort beskrivelse av rutinen"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routine-content">Innhold</Label>
              <Textarea
                id="routine-content"
                value={customRoutineContent}
                onChange={(e) => setCustomRoutineContent(e.target.value)}
                placeholder="Skriv rutinens fullstendige innhold her..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomRoutineDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleSaveCustomRoutine}
              disabled={isSavingCustomRoutine || !customRoutineName.trim()}
            >
              {isSavingCustomRoutine ? "Lagrer..." : (editingCustomRoutine ? "Lagre endringer" : "Opprett rutine")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Checklist Create/Edit Dialog */}
      <Dialog open={showCustomChecklistDialog} onOpenChange={setShowCustomChecklistDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-cyan-500" />
              {editingCustomChecklist ? "Rediger sjekkliste-mal" : "Opprett ny sjekkliste-mal"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomChecklist 
                ? "Rediger innholdet i sjekkliste-malen nedenfor"
                : "Fyll inn informasjon for å opprette en ny sjekkliste-mal"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checklist-name">Navn på sjekkliste *</Label>
              <Input
                id="checklist-name"
                value={customChecklistName}
                onChange={(e) => setCustomChecklistName(e.target.value)}
                placeholder="F.eks. Kontroll av våtrom"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kategori</Label>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="use-new-category"
                  checked={customChecklistUseNewCategory}
                  onCheckedChange={(checked) => setCustomChecklistUseNewCategory(!!checked)}
                />
                <label htmlFor="use-new-category" className="text-sm cursor-pointer">
                  Opprett egen kategori
                </label>
              </div>
              {customChecklistUseNewCategory ? (
                <Input
                  value={customChecklistNewCategory}
                  onChange={(e) => setCustomChecklistNewCategory(e.target.value)}
                  placeholder="Skriv inn ny kategori (f.eks. Vernerunde, Opplæring)"
                />
              ) : (
                <Select value={customChecklistCategory} onValueChange={setCustomChecklistCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(allChecklistCategories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checklist-description">Beskrivelse</Label>
              <Input
                id="checklist-description"
                value={customChecklistDescription}
                onChange={(e) => setCustomChecklistDescription(e.target.value)}
                placeholder="Kort beskrivelse av sjekklisten"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sjekkpunkter *</Label>
              <div className="space-y-3">
                {customChecklistCheckpoints.map((cp, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={cp.checkpoint_text}
                        onChange={(e) => updateCheckpoint(index, 'checkpoint_text', e.target.value)}
                        placeholder={`Sjekkpunkt ${index + 1}`}
                      />
                      <Input
                        value={cp.help_text || ""}
                        onChange={(e) => updateCheckpoint(index, 'help_text', e.target.value)}
                        placeholder="Hjelpetekst (valgfritt)"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCheckpoint(index)}
                      disabled={customChecklistCheckpoints.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addCheckpoint} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Legg til sjekkpunkt
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomChecklistDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleSaveCustomChecklist}
              disabled={isSavingCustomChecklist || !customChecklistName.trim()}
            >
              {isSavingCustomChecklist ? "Lagrer..." : (editingCustomChecklist ? "Lagre endringer" : "Opprett sjekkliste-mal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Wizard */}
      {showChecklistWizard && projectId && (
        <Ks2ChecklistWizard
          projectId={projectId}
          onClose={handleWizardClose}
          preSelectedTemplate={selectedTemplateForWizard || undefined}
        />
      )}
    </div>
  );
}
