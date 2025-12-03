import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Eye, 
  Trash2,
  FolderOpen,
  Image,
  File,
  ListChecks,
  BookOpen,
  Plus,
  Edit,
  X
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const DOCUMENT_TYPES = {
  template: { label: "Mal/Template", icon: FileText, color: "bg-blue-500" },
  guide: { label: "Veiledning", icon: FileText, color: "bg-green-500" },
  regulation: { label: "Forskrift/Lov", icon: FileText, color: "bg-yellow-500" },
  byggesak: { label: "Byggesak", icon: FileText, color: "bg-orange-500" },
  image: { label: "Bilde", icon: Image, color: "bg-purple-500" },
  other: { label: "Annet", icon: File, color: "bg-gray-500" },
};

const CHECKLIST_CATEGORIES = {
  carpentry: "Tømrerarbeid",
  concrete: "Betongarbeid",
  electrical: "Elektro",
  plumbing: "Rørlegger",
  roofing: "Takarbeid",
  general: "Generelt",
  safety: "HMS/Sikkerhet",
};

const ROUTINE_CATEGORIES = {
  quality: "Kvalitetssikring",
  safety: "HMS",
  documentation: "Dokumentasjon",
  control: "Kontroll",
  general: "Generelt",
};

interface AdminDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
  uploaded_by_name: string;
}

interface ChecklistTemplate {
  id: string;
  template_name: string;
  description: string | null;
  category: string;
  trade: string | null;
  checkpoints: { text: string; help?: string }[];
  is_active: boolean;
  created_at: string;
}

interface RoutineTemplate {
  id: string;
  routine_name: string;
  description: string | null;
  category: string;
  content: string;
  file_path: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminDocuments() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("documents");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("template");
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [checklistName, setChecklistName] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [checklistCategory, setChecklistCategory] = useState("general");
  const [checklistTrade, setChecklistTrade] = useState("");
  const [checkpoints, setCheckpoints] = useState<{ text: string; help: string }[]>([{ text: "", help: "" }]);

  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTemplate | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [routineCategory, setRoutineCategory] = useState("general");
  const [routineContent, setRoutineContent] = useState("");

  const { data: documents } = useQuery({
    queryKey: ["admin-documents", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("document_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  const { data: checklistTemplates } = useQuery({
    queryKey: ["admin-checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_checklist_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        checkpoints: (item.checkpoints || []) as { text: string; help?: string }[]
      })) as ChecklistTemplate[];
    },
  });

  const { data: routineTemplates } = useQuery({
    queryKey: ["admin-routine-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_routine_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RoutineTemplate[];
    },
  });

  const filteredDocuments = documents?.filter(doc => 
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const resetDocumentForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
    setUploadType("template");
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName) {
      toast.error("Velg fil og gi dokumentet et navn");
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `admin/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("admin_documents")
        .insert({
          document_name: documentName,
          document_type: uploadType,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: description || null,
          uploaded_by_name: "System Admin",
        });

      if (dbError) throw dbError;

      toast.success("Dokument lastet opp");
      setUploadDialogOpen(false);
      resetDocumentForm();
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokument");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (doc: AdminDocument) => {
      const { error: storageError } = await supabase.storage
        .from("admin-documents")
        .remove([doc.file_path]);
      
      if (storageError) console.error("Storage delete error:", storageError);

      const { error: dbError } = await supabase
        .from("admin_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Dokument slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette dokument");
    },
  });

  const downloadDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.document_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke laste ned dokument");
    }
  };

  const previewDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const resetChecklistForm = () => {
    setChecklistName("");
    setChecklistDescription("");
    setChecklistCategory("general");
    setChecklistTrade("");
    setCheckpoints([{ text: "", help: "" }]);
    setEditingChecklist(null);
  };

  const openEditChecklist = (template: ChecklistTemplate) => {
    setEditingChecklist(template);
    setChecklistName(template.template_name);
    setChecklistDescription(template.description || "");
    setChecklistCategory(template.category);
    setChecklistTrade(template.trade || "");
    setCheckpoints(template.checkpoints.length > 0 
      ? template.checkpoints.map(cp => ({ text: cp.text, help: cp.help || "" }))
      : [{ text: "", help: "" }]
    );
    setChecklistDialogOpen(true);
  };

  const addCheckpoint = () => {
    setCheckpoints([...checkpoints, { text: "", help: "" }]);
  };

  const removeCheckpoint = (index: number) => {
    if (checkpoints.length > 1) {
      setCheckpoints(checkpoints.filter((_, i) => i !== index));
    }
  };

  const updateCheckpoint = (index: number, field: 'text' | 'help', value: string) => {
    const updated = [...checkpoints];
    updated[index][field] = value;
    setCheckpoints(updated);
  };

  const saveChecklistMutation = useMutation({
    mutationFn: async () => {
      const validCheckpoints = checkpoints.filter(cp => cp.text.trim());
      
      if (editingChecklist) {
        const { error } = await supabase
          .from("admin_checklist_templates")
          .update({
            template_name: checklistName,
            description: checklistDescription || null,
            category: checklistCategory,
            trade: checklistTrade || null,
            checkpoints: validCheckpoints,
          })
          .eq("id", editingChecklist.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_checklist_templates")
          .insert({
            template_name: checklistName,
            description: checklistDescription || null,
            category: checklistCategory,
            trade: checklistTrade || null,
            checkpoints: validCheckpoints,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingChecklist ? "Sjekkliste oppdatert" : "Sjekkliste opprettet");
      setChecklistDialogOpen(false);
      resetChecklistForm();
      queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
    },
    onError: () => {
      toast.error("Kunne ikke lagre sjekkliste");
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_checklist_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sjekkliste slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette sjekkliste");
    },
  });

  const resetRoutineForm = () => {
    setRoutineName("");
    setRoutineDescription("");
    setRoutineCategory("general");
    setRoutineContent("");
    setEditingRoutine(null);
  };

  const openEditRoutine = (template: RoutineTemplate) => {
    setEditingRoutine(template);
    setRoutineName(template.routine_name);
    setRoutineDescription(template.description || "");
    setRoutineCategory(template.category);
    setRoutineContent(template.content);
    setRoutineDialogOpen(true);
  };

  const saveRoutineMutation = useMutation({
    mutationFn: async () => {
      if (editingRoutine) {
        const { error } = await supabase
          .from("admin_routine_templates")
          .update({
            routine_name: routineName,
            description: routineDescription || null,
            category: routineCategory,
            content: routineContent,
          })
          .eq("id", editingRoutine.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_routine_templates")
          .insert({
            routine_name: routineName,
            description: routineDescription || null,
            category: routineCategory,
            content: routineContent,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingRoutine ? "Rutine oppdatert" : "Rutine opprettet");
      setRoutineDialogOpen(false);
      resetRoutineForm();
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates"] });
    },
    onError: () => {
      toast.error("Kunne ikke lagre rutine");
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_routine_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rutine slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette rutine");
    },
  });

  const getTypeConfig = (type: string) => {
    return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.other;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dokumentsenter</h1>
          <p className="text-muted-foreground">Administrer maler, sjekklister og rutiner</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Dokumenter</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Sjekkliste-maler</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Rutine-maler</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i dokumenter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Alle typer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle typer</SelectItem>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) resetDocumentForm(); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Last opp
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Last opp dokument</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dokumentnavn *</Label>
                      <Input 
                        value={documentName} 
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Gi dokumentet et navn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={uploadType} onValueChange={setUploadType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Input 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Kort beskrivelse (valgfritt)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fil *</Label>
                      <Input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleUpload} 
                      disabled={!selectedFile || !documentName || isUploading}
                      className="w-full"
                    >
                      {isUploading ? "Laster opp..." : "Last opp"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Dokumenter ({filteredDocuments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredDocuments || filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen dokumenter funnet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => {
                      const typeConfig = getTypeConfig(doc.document_type);
                      const TypeIcon = typeConfig.icon;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                              <TypeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.document_name}</p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {typeConfig.label}
                                </Badge>
                                {doc.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => previewDocument(doc)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => downloadDocument(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteMutation.mutate(doc)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklists" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={checklistDialogOpen} onOpenChange={(open) => { setChecklistDialogOpen(open); if (!open) resetChecklistForm(); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Ny sjekkliste
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingChecklist ? "Rediger sjekkliste" : "Opprett sjekkliste-mal"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Navn *</Label>
                        <Input 
                          value={checklistName} 
                          onChange={(e) => setChecklistName(e.target.value)}
                          placeholder="Navn på sjekklisten"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select value={checklistCategory} onValueChange={setChecklistCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CHECKLIST_CATEGORIES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Input 
                        value={checklistDescription} 
                        onChange={(e) => setChecklistDescription(e.target.value)}
                        placeholder="Kort beskrivelse (valgfritt)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fag/Trade (valgfritt)</Label>
                      <Input 
                        value={checklistTrade} 
                        onChange={(e) => setChecklistTrade(e.target.value)}
                        placeholder="F.eks. Tømrer, Murer, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sjekkpunkter</Label>
                      <div className="space-y-3">
                        {checkpoints.map((cp, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={cp.text}
                                onChange={(e) => updateCheckpoint(index, 'text', e.target.value)}
                                placeholder={`Sjekkpunkt ${index + 1}`}
                              />
                              <Input
                                value={cp.help}
                                onChange={(e) => updateCheckpoint(index, 'help', e.target.value)}
                                placeholder="Hjelpetekst (valgfritt)"
                                className="text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCheckpoint(index)}
                              disabled={checkpoints.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addCheckpoint} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Legg til sjekkpunkt
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => saveChecklistMutation.mutate()} 
                      disabled={!checklistName || saveChecklistMutation.isPending}
                      className="w-full"
                    >
                      {saveChecklistMutation.isPending ? "Lagrer..." : (editingChecklist ? "Oppdater" : "Opprett")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Sjekkliste-maler ({checklistTemplates?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!checklistTemplates || checklistTemplates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen sjekkliste-maler opprettet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {checklistTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{template.template_name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground truncate">{template.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {CHECKLIST_CATEGORIES[template.category as keyof typeof CHECKLIST_CATEGORIES] || template.category}
                            </Badge>
                            {template.trade && (
                              <Badge variant="outline" className="text-xs">{template.trade}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {template.checkpoints.length} sjekkpunkter
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => openEditChecklist(template)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteChecklistMutation.mutate(template.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routines" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={routineDialogOpen} onOpenChange={(open) => { setRoutineDialogOpen(open); if (!open) resetRoutineForm(); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Ny rutine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingRoutine ? "Rediger rutine" : "Opprett rutine-mal"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Navn *</Label>
                        <Input 
                          value={routineName} 
                          onChange={(e) => setRoutineName(e.target.value)}
                          placeholder="Navn på rutinen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select value={routineCategory} onValueChange={setRoutineCategory}>
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
                    </div>
                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Input 
                        value={routineDescription} 
                        onChange={(e) => setRoutineDescription(e.target.value)}
                        placeholder="Kort beskrivelse (valgfritt)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Innhold *</Label>
                      <Textarea 
                        value={routineContent} 
                        onChange={(e) => setRoutineContent(e.target.value)}
                        placeholder="Skriv rutinens innhold her..."
                        rows={10}
                      />
                    </div>
                    <Button 
                      onClick={() => saveRoutineMutation.mutate()} 
                      disabled={!routineName || !routineContent || saveRoutineMutation.isPending}
                      className="w-full"
                    >
                      {saveRoutineMutation.isPending ? "Lagrer..." : (editingRoutine ? "Oppdater" : "Opprett")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Rutine-maler ({routineTemplates?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!routineTemplates || routineTemplates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen rutine-maler opprettet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {routineTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{template.routine_name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground truncate">{template.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {ROUTINE_CATEGORIES[template.category as keyof typeof ROUTINE_CATEGORIES] || template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(template.created_at), "d. MMM yyyy", { locale: nb })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => openEditRoutine(template)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteRoutineMutation.mutate(template.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
