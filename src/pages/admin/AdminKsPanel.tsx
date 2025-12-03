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
} from "lucide-react";
import {
  useAdminKsTemplates,
  CHECKLIST_CATEGORIES,
  ROUTINE_CATEGORIES,
  DOCUMENT_CATEGORIES,
  AdminChecklistTemplate,
  AdminRoutineTemplate,
} from "@/hooks/useAdminKsTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

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

  const [activeTab, setActiveTab] = useState("checklists");
  const [showNewChecklistDialog, setShowNewChecklistDialog] = useState(false);
  const [showNewRoutineDialog, setShowNewRoutineDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<AdminChecklistTemplate | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<AdminRoutineTemplate | null>(null);

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

    setDocumentForm({
      document_name: "",
      document_type: "Skjema",
      description: "",
      category: "",
      is_mandatory: false,
      version: "2025.1",
    });
    setSelectedFile(null);
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
          <TabsList className="grid w-full grid-cols-3">
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
                        <Select
                          value={checklistForm.category}
                          onValueChange={(value) => setChecklistForm({ ...checklistForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {CHECKLIST_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select
                          value={routineForm.category}
                          onValueChange={(value) => setRoutineForm({ ...routineForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROUTINE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
                        <Select
                          value={documentForm.category}
                          onValueChange={(value) => setDocumentForm({ ...documentForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
