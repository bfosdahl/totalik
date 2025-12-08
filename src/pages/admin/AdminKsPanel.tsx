import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Plus,
  FileText,
  ClipboardList,
  Upload,
  Trash2,
  Edit,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Download,
  Shield,
  FolderOpen,
  Building2,
} from "lucide-react";
import {
  useAdminKsTemplates,
  CHECKLIST_CATEGORIES,
  ROUTINE_CATEGORIES,
  DOCUMENT_CATEGORIES,
  AdminChecklistTemplate,
  AdminRoutineTemplate,
} from "@/hooks/useAdminKsTemplates";
import { useAdminProjectTypeTemplates, AdminProjectTypeTemplate } from "@/hooks/useAdminProjectTypeTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const CONTRACTOR_TYPES = [
  { value: "total", label: "Totalentreprenør" },
  { value: "hoved", label: "Hovedentreprenør" },
  { value: "under", label: "Underentreprenør" },
];

const EXAMPLE_CONTENT_LEVELS = [
  { value: "minimal", label: "Minimal - Kun sjekklister og rutiner" },
  { value: "medium", label: "Medium - Inkluderer byggherre, underleverandører" },
  { value: "full", label: "Full - Alt innhold (møtereferater, økonomi, avvik, etc.)" },
];

export default function AdminKsPanel() {
  const { profile } = useAuth();
  const {
    checklistTemplates,
    routineTemplates,
    documents,
    isLoading,
    createChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    createRoutineTemplate,
    updateRoutineTemplate,
    deleteRoutineTemplate,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    sendVersionNotification,
  } = useAdminKsTemplates();

  const {
    templates: projectTypeTemplates,
    isLoading: isLoadingProjectTypes,
    createTemplate: createProjectTypeTemplate,
    updateTemplate: updateProjectTypeTemplate,
    deleteTemplate: deleteProjectTypeTemplate,
  } = useAdminProjectTypeTemplates();

  const [activeTab, setActiveTab] = useState("checklists");
  const [showNewChecklistDialog, setShowNewChecklistDialog] = useState(false);
  const [showNewRoutineDialog, setShowNewRoutineDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewProjectTypeDialog, setShowNewProjectTypeDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<AdminChecklistTemplate | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<AdminRoutineTemplate | null>(null);
  const [editingProjectType, setEditingProjectType] = useState<AdminProjectTypeTemplate | null>(null);

  // Custom category state
  const [checklistCustomCategoryMode, setChecklistCustomCategoryMode] = useState(false);
  const [checklistCustomCategory, setChecklistCustomCategory] = useState("");
  const [routineCustomCategoryMode, setRoutineCustomCategoryMode] = useState(false);
  const [routineCustomCategory, setRoutineCustomCategory] = useState("");
  const [documentCustomCategoryMode, setDocumentCustomCategoryMode] = useState(false);
  const [documentCustomCategory, setDocumentCustomCategory] = useState("");

  // Checklist form state
  const [checklistForm, setChecklistForm] = useState({
    template_name: "",
    description: "",
    category: "",
    version: "2025.1",
    is_mandatory: false,
    is_locked: false,
    checkpoints: [{ checkpoint_text: "", help_text: "" }],
  });

  // Routine form state
  const [routineForm, setRoutineForm] = useState({
    routine_name: "",
    description: "",
    category: "",
    content: "",
    version: "2025.1",
    is_mandatory: false,
    is_locked: false,
  });

  // Document form state
  const [documentForm, setDocumentForm] = useState({
    document_name: "",
    document_type: "Skjema",
    description: "",
    category: "",
    is_mandatory: false,
    version: "2025.1",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Project type form state
  const [projectTypeForm, setProjectTypeForm] = useState({
    template_name: "",
    description: "",
    contractor_type: "total",
    default_description: "",
    include_example_content: false,
    example_content_level: "minimal",
    example_client_name: "",
    example_client_org_number: "",
    example_contract_sum: "",
    selectedChecklistIds: [] as string[],
    selectedRoutineIds: [] as string[],
    selectedDocumentIds: [] as string[],
  });

  const resetChecklistForm = () => {
    setChecklistForm({
      template_name: "",
      description: "",
      category: "",
      version: "2025.1",
      is_mandatory: false,
      is_locked: false,
      checkpoints: [{ checkpoint_text: "", help_text: "" }],
    });
    setEditingChecklist(null);
    setChecklistCustomCategoryMode(false);
    setChecklistCustomCategory("");
  };

  const resetRoutineForm = () => {
    setRoutineForm({
      routine_name: "",
      description: "",
      category: "",
      content: "",
      version: "2025.1",
      is_mandatory: false,
      is_locked: false,
    });
    setEditingRoutine(null);
    setRoutineCustomCategoryMode(false);
    setRoutineCustomCategory("");
  };

  const resetDocumentForm = () => {
    setDocumentForm({
      document_name: "",
      document_type: "Skjema",
      description: "",
      category: "",
      is_mandatory: false,
      version: "2025.1",
    });
    setSelectedFile(null);
    setDocumentCustomCategoryMode(false);
    setDocumentCustomCategory("");
  };

  const resetProjectTypeForm = () => {
    setProjectTypeForm({
      template_name: "",
      description: "",
      contractor_type: "total",
      default_description: "",
      include_example_content: false,
      example_content_level: "minimal",
      example_client_name: "",
      example_client_org_number: "",
      example_contract_sum: "",
      selectedChecklistIds: [],
      selectedRoutineIds: [],
      selectedDocumentIds: [],
    });
    setEditingProjectType(null);
  };

  const handleCreateChecklist = async () => {
    if (!checklistForm.template_name || !checklistForm.category) return;

    await createChecklistTemplate.mutateAsync({
      template_name: checklistForm.template_name,
      description: checklistForm.description,
      category: checklistForm.category,
      version: checklistForm.version,
      is_mandatory: checklistForm.is_mandatory,
      is_locked: checklistForm.is_locked,
      checkpoints: checklistForm.checkpoints.filter((c) => c.checkpoint_text.trim()),
    });

    resetChecklistForm();
    setShowNewChecklistDialog(false);
  };

  const handleUpdateChecklist = async () => {
    if (!editingChecklist) return;

    await updateChecklistTemplate.mutateAsync({
      id: editingChecklist.id,
      template_name: checklistForm.template_name,
      description: checklistForm.description,
      category: checklistForm.category,
      version: checklistForm.version,
      is_mandatory: checklistForm.is_mandatory,
      is_locked: checklistForm.is_locked,
      checkpoints: checklistForm.checkpoints.filter((c) => c.checkpoint_text.trim()),
    });

    resetChecklistForm();
    setShowNewChecklistDialog(false);
  };

  const handleCreateRoutine = async () => {
    if (!routineForm.routine_name || !routineForm.category) return;

    await createRoutineTemplate.mutateAsync({
      routine_name: routineForm.routine_name,
      description: routineForm.description,
      category: routineForm.category,
      content: routineForm.content,
      version: routineForm.version,
      is_mandatory: routineForm.is_mandatory,
      is_locked: routineForm.is_locked,
    });

    resetRoutineForm();
    setShowNewRoutineDialog(false);
  };

  const handleUpdateRoutine = async () => {
    if (!editingRoutine) return;

    await updateRoutineTemplate.mutateAsync({
      id: editingRoutine.id,
      routine_name: routineForm.routine_name,
      description: routineForm.description,
      category: routineForm.category,
      content: routineForm.content,
      version: routineForm.version,
      is_mandatory: routineForm.is_mandatory,
      is_locked: routineForm.is_locked,
    });

    resetRoutineForm();
    setShowNewRoutineDialog(false);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentForm.document_name) return;

    await uploadDocument.mutateAsync({
      file: selectedFile,
      documentName: documentForm.document_name,
      documentType: documentForm.document_type,
      description: documentForm.description,
      category: documentForm.category,
      uploadedByName: profile?.first_name || "System Admin",
      isMandatory: documentForm.is_mandatory,
      version: documentForm.version,
    });

    resetDocumentForm();
    setShowUploadDialog(false);
  };

  const handleEditChecklist = (template: AdminChecklistTemplate) => {
    setEditingChecklist(template);
    setChecklistForm({
      template_name: template.template_name,
      description: template.description || "",
      category: template.category,
      version: template.version || "2025.1",
      is_mandatory: template.is_mandatory || false,
      is_locked: template.is_locked || false,
      checkpoints: template.checkpoints.length > 0 
        ? template.checkpoints 
        : [{ checkpoint_text: "", help_text: "" }],
    });
    setShowNewChecklistDialog(true);
  };

  const handleEditRoutine = (routine: AdminRoutineTemplate) => {
    setEditingRoutine(routine);
    setRoutineForm({
      routine_name: routine.routine_name,
      description: routine.description || "",
      category: routine.category,
      content: routine.content,
      version: routine.version || "2025.1",
      is_mandatory: routine.is_mandatory || false,
      is_locked: routine.is_locked || false,
    });
    setShowNewRoutineDialog(true);
  };

  const addCheckpoint = () => {
    setChecklistForm({
      ...checklistForm,
      checkpoints: [...checklistForm.checkpoints, { checkpoint_text: "", help_text: "" }],
    });
  };

  const removeCheckpoint = (index: number) => {
    setChecklistForm({
      ...checklistForm,
      checkpoints: checklistForm.checkpoints.filter((_, i) => i !== index),
    });
  };

  const updateCheckpoint = (index: number, field: string, value: string) => {
    const newCheckpoints = [...checklistForm.checkpoints];
    newCheckpoints[index] = { ...newCheckpoints[index], [field]: value };
    setChecklistForm({ ...checklistForm, checkpoints: newCheckpoints });
  };

  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error getting document URL:", error);
    }
  };

  const handleCreateProjectType = async () => {
    if (!projectTypeForm.template_name) return;

    await createProjectTypeTemplate.mutateAsync({
      template_name: projectTypeForm.template_name,
      description: projectTypeForm.description || undefined,
      contractor_type: projectTypeForm.contractor_type,
      default_description: projectTypeForm.default_description || undefined,
      include_example_content: projectTypeForm.include_example_content,
      example_content_level: projectTypeForm.example_content_level,
      example_client_name: projectTypeForm.example_client_name || undefined,
      example_client_org_number: projectTypeForm.example_client_org_number || undefined,
      example_contract_sum: projectTypeForm.example_contract_sum ? parseFloat(projectTypeForm.example_contract_sum) : undefined,
      checklist_template_ids: projectTypeForm.selectedChecklistIds,
      routine_template_ids: projectTypeForm.selectedRoutineIds,
      document_template_ids: projectTypeForm.selectedDocumentIds,
    });

    resetProjectTypeForm();
    setShowNewProjectTypeDialog(false);
  };

  const handleUpdateProjectType = async () => {
    if (!editingProjectType) return;

    await updateProjectTypeTemplate.mutateAsync({
      id: editingProjectType.id,
      template_name: projectTypeForm.template_name,
      description: projectTypeForm.description || null,
      contractor_type: projectTypeForm.contractor_type,
      default_description: projectTypeForm.default_description || null,
      include_example_content: projectTypeForm.include_example_content,
      example_content_level: projectTypeForm.example_content_level,
      example_client_name: projectTypeForm.example_client_name || null,
      example_client_org_number: projectTypeForm.example_client_org_number || null,
      example_contract_sum: projectTypeForm.example_contract_sum ? parseFloat(projectTypeForm.example_contract_sum) : null,
      checklist_template_ids: projectTypeForm.selectedChecklistIds,
      routine_template_ids: projectTypeForm.selectedRoutineIds,
      document_template_ids: projectTypeForm.selectedDocumentIds,
    });

    resetProjectTypeForm();
    setShowNewProjectTypeDialog(false);
  };

  const handleEditProjectType = (template: AdminProjectTypeTemplate) => {
    setEditingProjectType(template);
    setProjectTypeForm({
      template_name: template.template_name,
      description: template.description || "",
      contractor_type: template.contractor_type,
      default_description: template.default_description || "",
      include_example_content: template.include_example_content,
      example_content_level: template.example_content_level,
      example_client_name: template.example_client_name || "",
      example_client_org_number: template.example_client_org_number || "",
      example_contract_sum: template.example_contract_sum?.toString() || "",
      selectedChecklistIds: template.checklist_template_ids || [],
      selectedRoutineIds: template.routine_template_ids || [],
      selectedDocumentIds: template.document_template_ids || [],
    });
    setShowNewProjectTypeDialog(true);
  };

  const toggleChecklistSelection = (id: string) => {
    setProjectTypeForm(prev => ({
      ...prev,
      selectedChecklistIds: prev.selectedChecklistIds.includes(id)
        ? prev.selectedChecklistIds.filter(x => x !== id)
        : [...prev.selectedChecklistIds, id]
    }));
  };

  const toggleRoutineSelection = (id: string) => {
    setProjectTypeForm(prev => ({
      ...prev,
      selectedRoutineIds: prev.selectedRoutineIds.includes(id)
        ? prev.selectedRoutineIds.filter(x => x !== id)
        : [...prev.selectedRoutineIds, id]
    }));
  };

  const toggleDocumentSelection = (id: string) => {
    setProjectTypeForm(prev => ({
      ...prev,
      selectedDocumentIds: prev.selectedDocumentIds.includes(id)
        ? prev.selectedDocumentIds.filter(x => x !== id)
        : [...prev.selectedDocumentIds, id]
    }));
  };

  const stats = {
    totalChecklists: checklistTemplates.length,
    mandatoryChecklists: checklistTemplates.filter((t) => t.is_mandatory).length,
    totalRoutines: routineTemplates.length,
    mandatoryRoutines: routineTemplates.filter((t) => t.is_mandatory).length,
    totalDocuments: documents.length,
    mandatoryDocuments: documents.filter((d) => d.is_mandatory).length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin – Rutiner & Malbank</h1>
              <p className="text-muted-foreground text-sm">
                Administrer standardmaler og rutiner for alle kunder
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 w-fit">
            <Shield className="h-3.5 w-3.5" />
            System Admin
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalChecklists}</div>
              <p className="text-xs text-muted-foreground">Sjekkliste-maler</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.mandatoryChecklists}</div>
              <p className="text-xs text-muted-foreground">Obligatoriske</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalRoutines}</div>
              <p className="text-xs text-muted-foreground">Rutine-maler</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.mandatoryRoutines}</div>
              <p className="text-xs text-muted-foreground">Obligatoriske</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Dokumenter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.mandatoryDocuments}</div>
              <p className="text-xs text-muted-foreground">Obligatoriske</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="project-types" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Prosjektmaler</span>
              <span className="sm:hidden">Prosjekt</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Sjekkliste-maler</span>
              <span className="sm:hidden">Sjekklister</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Rutine-maler</span>
              <span className="sm:hidden">Rutiner</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dokumentbank</span>
              <span className="sm:hidden">Dokumenter</span>
            </TabsTrigger>
          </TabsList>

          {/* Project Types Tab */}
          <TabsContent value="project-types" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {projectTypeTemplates.length} prosjektmaler
              </p>
              <Dialog open={showNewProjectTypeDialog} onOpenChange={(open) => {
                setShowNewProjectTypeDialog(open);
                if (!open) resetProjectTypeForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny prosjektmal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProjectType ? "Rediger prosjektmal" : "Ny prosjektmal"}
                    </DialogTitle>
                    <DialogDescription>
                      Definer prosjekttype med tilhørende sjekklister, rutiner og dokumenter
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Navn på prosjektmal *</Label>
                          <Input
                            value={projectTypeForm.template_name}
                            onChange={(e) => setProjectTypeForm({ ...projectTypeForm, template_name: e.target.value })}
                            placeholder="F.eks. Enebolig nybygg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Entreprenørtype</Label>
                          <Select value={projectTypeForm.contractor_type} onValueChange={(v) => setProjectTypeForm({ ...projectTypeForm, contractor_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CONTRACTOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Kort beskrivelse</Label>
                        <Input value={projectTypeForm.description} onChange={(e) => setProjectTypeForm({ ...projectTypeForm, description: e.target.value })} placeholder="Beskrivelse som vises i valglisten" />
                      </div>
                      <div className="space-y-2">
                        <Label>Standard prosjektbeskrivelse</Label>
                        <Textarea value={projectTypeForm.default_description} onChange={(e) => setProjectTypeForm({ ...projectTypeForm, default_description: e.target.value })} placeholder="Denne teksten fylles ut automatisk i prosjektbeskrivelse" rows={3} />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={projectTypeForm.include_example_content} onCheckedChange={(c) => setProjectTypeForm({ ...projectTypeForm, include_example_content: c })} />
                          <Label>Inkluder eksempelinnhold</Label>
                        </div>
                        {projectTypeForm.include_example_content && (
                          <div className="ml-6 space-y-3 pt-2">
                            <Select value={projectTypeForm.example_content_level} onValueChange={(v) => setProjectTypeForm({ ...projectTypeForm, example_content_level: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {EXAMPLE_CONTENT_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <div className="grid grid-cols-2 gap-3">
                              <Input placeholder="Eksempel byggherre" value={projectTypeForm.example_client_name} onChange={(e) => setProjectTypeForm({ ...projectTypeForm, example_client_name: e.target.value })} />
                              <Input placeholder="Kontraktssum" type="number" value={projectTypeForm.example_contract_sum} onChange={(e) => setProjectTypeForm({ ...projectTypeForm, example_contract_sum: e.target.value })} />
                            </div>
                          </div>
                        )}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Velg sjekklister ({projectTypeForm.selectedChecklistIds.length} valgt)</Label>
                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                          {checklistTemplates.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              <Checkbox checked={projectTypeForm.selectedChecklistIds.includes(t.id)} onCheckedChange={() => toggleChecklistSelection(t.id)} />
                              <span className="text-sm">{t.template_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Velg rutiner ({projectTypeForm.selectedRoutineIds.length} valgt)</Label>
                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                          {routineTemplates.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              <Checkbox checked={projectTypeForm.selectedRoutineIds.includes(t.id)} onCheckedChange={() => toggleRoutineSelection(t.id)} />
                              <span className="text-sm">{t.routine_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Velg dokumenter ({projectTypeForm.selectedDocumentIds.length} valgt)</Label>
                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                          {documents.map(d => (
                            <div key={d.id} className="flex items-center gap-2">
                              <Checkbox checked={projectTypeForm.selectedDocumentIds.includes(d.id)} onCheckedChange={() => toggleDocumentSelection(d.id)} />
                              <span className="text-sm">{d.document_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { resetProjectTypeForm(); setShowNewProjectTypeDialog(false); }}>Avbryt</Button>
                    <Button onClick={editingProjectType ? handleUpdateProjectType : handleCreateProjectType} disabled={!projectTypeForm.template_name}>
                      {editingProjectType ? "Lagre endringer" : "Opprett mal"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {projectTypeTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{template.template_name}</h3>
                          <Badge variant="outline" className="text-xs">{CONTRACTOR_TYPES.find(t => t.value === template.contractor_type)?.label}</Badge>
                          {template.include_example_content && <Badge variant="secondary" className="text-xs">{template.example_content_level}</Badge>}
                        </div>
                        {template.description && <p className="text-sm text-muted-foreground mt-1">{template.description}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{template.checklist_template_ids?.length || 0} sjekklister</span>
                          <span>{template.routine_template_ids?.length || 0} rutiner</span>
                          <span>{template.document_template_ids?.length || 0} dokumenter</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProjectType(template)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => deleteProjectTypeTemplate.mutate(template.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {checklistTemplates.length} maler totalt
              </p>
              <Dialog open={showNewChecklistDialog} onOpenChange={(open) => {
                setShowNewChecklistDialog(open);
                if (!open) resetChecklistForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny sjekkliste-mal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingChecklist ? "Rediger sjekkliste-mal" : "Ny sjekkliste-mal"}
                    </DialogTitle>
                    <DialogDescription>
                      Opprett en standardisert sjekkliste som alle kunder kan bruke
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Navn på mal *</Label>
                          <Input
                            value={checklistForm.template_name}
                            onChange={(e) => setChecklistForm({ ...checklistForm, template_name: e.target.value })}
                            placeholder="F.eks. Våtrom - Membran NS 3600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Versjon</Label>
                          <Input
                            value={checklistForm.version}
                            onChange={(e) => setChecklistForm({ ...checklistForm, version: e.target.value })}
                            placeholder="2025.1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Kategori *</Label>
                        {checklistCustomCategoryMode ? (
                          <div className="flex gap-2">
                            <Input
                              value={checklistCustomCategory}
                              onChange={(e) => {
                                setChecklistCustomCategory(e.target.value);
                                setChecklistForm({ ...checklistForm, category: e.target.value });
                              }}
                              placeholder="Skriv inn ny kategori..."
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setChecklistCustomCategoryMode(false);
                                setChecklistCustomCategory("");
                                setChecklistForm({ ...checklistForm, category: "" });
                              }}
                            >
                              Avbryt
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={checklistForm.category}
                            onValueChange={(value) => {
                              if (value === "__custom__") {
                                setChecklistCustomCategoryMode(true);
                              } else {
                                setChecklistForm({ ...checklistForm, category: value });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {CHECKLIST_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                              <SelectItem value="__custom__" className="text-primary font-medium">
                                + Opprett ny kategori...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Beskrivelse</Label>
                        <Textarea
                          value={checklistForm.description}
                          onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })}
                          placeholder="Kort beskrivelse av malen..."
                          rows={2}
                        />
                      </div>

                      <Separator />

                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={checklistForm.is_mandatory}
                            onCheckedChange={(checked) => setChecklistForm({ ...checklistForm, is_mandatory: checked })}
                          />
                          <Label className="flex items-center gap-1.5 text-sm">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                            Obligatorisk for alle kunder
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={checklistForm.is_locked}
                            onCheckedChange={(checked) => setChecklistForm({ ...checklistForm, is_locked: checked })}
                          />
                          <Label className="flex items-center gap-1.5 text-sm">
                            <Lock className="h-3.5 w-3.5" />
                            Låst (kan ikke redigeres av kunde)
                          </Label>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sjekkpunkter</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addCheckpoint}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Legg til
                          </Button>
                        </div>
                        {checklistForm.checkpoints.map((cp, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={cp.checkpoint_text}
                                onChange={(e) => updateCheckpoint(index, "checkpoint_text", e.target.value)}
                                placeholder={`Sjekkpunkt ${index + 1}`}
                              />
                              <Input
                                value={cp.help_text || ""}
                                onChange={(e) => updateCheckpoint(index, "help_text", e.target.value)}
                                placeholder="Hjelpetekst (valgfri)"
                                className="text-sm"
                              />
                            </div>
                            {checklistForm.checkpoints.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCheckpoint(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowNewChecklistDialog(false)}>
                      Avbryt
                    </Button>
                    <Button
                      onClick={editingChecklist ? handleUpdateChecklist : handleCreateChecklist}
                      disabled={createChecklistTemplate.isPending || updateChecklistTemplate.isPending}
                    >
                      {editingChecklist ? "Lagre endringer" : "Opprett mal"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {checklistTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{template.template_name}</h3>
                          <Badge variant="outline" className="text-xs">v{template.version}</Badge>
                          {template.is_mandatory && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Obligatorisk
                            </Badge>
                          )}
                          {template.is_locked && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              Låst
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.category}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {template.checkpoints.length} sjekkpunkter
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditChecklist(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteChecklistTemplate.mutate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {checklistTemplates.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen sjekkliste-maler opprettet ennå
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Routines Tab */}
          <TabsContent value="routines" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {routineTemplates.length} rutiner totalt
              </p>
              <Dialog open={showNewRoutineDialog} onOpenChange={(open) => {
                setShowNewRoutineDialog(open);
                if (!open) resetRoutineForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny rutine-mal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRoutine ? "Rediger rutine-mal" : "Ny rutine-mal"}
                    </DialogTitle>
                    <DialogDescription>
                      Opprett en standardisert rutine som alle kunder kan bruke
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Navn på rutine *</Label>
                          <Input
                            value={routineForm.routine_name}
                            onChange={(e) => setRoutineForm({ ...routineForm, routine_name: e.target.value })}
                            placeholder="F.eks. Kontroll av underentreprenører"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Versjon</Label>
                          <Input
                            value={routineForm.version}
                            onChange={(e) => setRoutineForm({ ...routineForm, version: e.target.value })}
                            placeholder="2025.1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Kategori *</Label>
                        {routineCustomCategoryMode ? (
                          <div className="flex gap-2">
                            <Input
                              value={routineCustomCategory}
                              onChange={(e) => {
                                setRoutineCustomCategory(e.target.value);
                                setRoutineForm({ ...routineForm, category: e.target.value });
                              }}
                              placeholder="Skriv inn ny kategori..."
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRoutineCustomCategoryMode(false);
                                setRoutineCustomCategory("");
                                setRoutineForm({ ...routineForm, category: "" });
                              }}
                            >
                              Avbryt
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={routineForm.category}
                            onValueChange={(value) => {
                              if (value === "__custom__") {
                                setRoutineCustomCategoryMode(true);
                              } else {
                                setRoutineForm({ ...routineForm, category: value });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROUTINE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                              <SelectItem value="__custom__" className="text-primary font-medium">
                                + Opprett ny kategori...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Beskrivelse</Label>
                        <Textarea
                          value={routineForm.description}
                          onChange={(e) => setRoutineForm({ ...routineForm, description: e.target.value })}
                          placeholder="Kort beskrivelse av rutinen..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Innhold *</Label>
                        <Textarea
                          value={routineForm.content}
                          onChange={(e) => setRoutineForm({ ...routineForm, content: e.target.value })}
                          placeholder="Skriv rutinens innhold her..."
                          rows={10}
                        />
                      </div>

                      <Separator />

                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={routineForm.is_mandatory}
                            onCheckedChange={(checked) => setRoutineForm({ ...routineForm, is_mandatory: checked })}
                          />
                          <Label className="flex items-center gap-1.5 text-sm">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                            Obligatorisk for alle kunder
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={routineForm.is_locked}
                            onCheckedChange={(checked) => setRoutineForm({ ...routineForm, is_locked: checked })}
                          />
                          <Label className="flex items-center gap-1.5 text-sm">
                            <Lock className="h-3.5 w-3.5" />
                            Låst (kan ikke redigeres av kunde)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowNewRoutineDialog(false)}>
                      Avbryt
                    </Button>
                    <Button
                      onClick={editingRoutine ? handleUpdateRoutine : handleCreateRoutine}
                      disabled={createRoutineTemplate.isPending || updateRoutineTemplate.isPending}
                    >
                      {editingRoutine ? "Lagre endringer" : "Opprett rutine"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {routineTemplates.map((routine) => (
                <Card key={routine.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{routine.routine_name}</h3>
                          <Badge variant="outline" className="text-xs">v{routine.version}</Badge>
                          {routine.is_mandatory && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Obligatorisk
                            </Badge>
                          )}
                          {routine.is_locked && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Lock className="h-3 w-3" />
                              Låst
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{routine.category}</p>
                        {routine.description && (
                          <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditRoutine(routine)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRoutineTemplate.mutate(routine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {routineTemplates.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen rutine-maler opprettet ennå
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {documents.length} dokumenter totalt
              </p>
              <Dialog open={showUploadDialog} onOpenChange={(open) => {
                setShowUploadDialog(open);
                if (!open) resetDocumentForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Last opp dokument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Last opp dokument</DialogTitle>
                    <DialogDescription>
                      Last opp et dokument til dokumentbanken
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dokumentnavn *</Label>
                      <Input
                        value={documentForm.document_name}
                        onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })}
                        placeholder="F.eks. Samsvarserklæring SAK10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={documentForm.document_type}
                          onValueChange={(value) => setDocumentForm({ ...documentForm, document_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Skjema">Skjema</SelectItem>
                            <SelectItem value="Mal">Mal</SelectItem>
                            <SelectItem value="Veileder">Veileder</SelectItem>
                            <SelectItem value="Dokument">Dokument</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        {documentCustomCategoryMode ? (
                          <div className="flex gap-2">
                            <Input
                              value={documentCustomCategory}
                              onChange={(e) => {
                                setDocumentCustomCategory(e.target.value);
                                setDocumentForm({ ...documentForm, category: e.target.value });
                              }}
                              placeholder="Skriv inn ny kategori..."
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDocumentCustomCategoryMode(false);
                                setDocumentCustomCategory("");
                                setDocumentForm({ ...documentForm, category: "" });
                              }}
                            >
                              Avbryt
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={documentForm.category}
                            onValueChange={(value) => {
                              if (value === "__custom__") {
                                setDocumentCustomCategoryMode(true);
                              } else {
                                setDocumentForm({ ...documentForm, category: value });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                              <SelectItem value="__custom__" className="text-primary font-medium">
                                + Opprett ny kategori...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Textarea
                        value={documentForm.description}
                        onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                        placeholder="Kort beskrivelse..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fil *</Label>
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={documentForm.is_mandatory}
                        onCheckedChange={(checked) => setDocumentForm({ ...documentForm, is_mandatory: checked })}
                      />
                      <Label className="flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        Obligatorisk for alle kunder
                      </Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Avbryt
                    </Button>
                    <Button
                      onClick={handleUploadDocument}
                      disabled={uploadDocument.isPending || !selectedFile}
                    >
                      Last opp
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{doc.document_name}</h3>
                          <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                          <Badge variant="secondary" className="text-xs">{doc.document_type}</Badge>
                          {doc.is_mandatory && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Obligatorisk
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{doc.category}</p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Lastet opp av {doc.uploaded_by_name} • {format(new Date(doc.created_at), "d. MMMM yyyy", { locale: nb })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.file_path)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument.mutate({ id: doc.id, filePath: doc.file_path })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {documents.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen dokumenter lastet opp ennå
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
