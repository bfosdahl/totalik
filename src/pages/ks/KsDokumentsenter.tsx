import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FolderOpen,
  Image,
  FileSpreadsheet,
  File,
  Building2,
  Copy,
  Library
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const CATEGORY_CONFIG = {
  tegninger: { label: "Tegninger", icon: FileText, color: "bg-blue-500" },
  beskrivelser: { label: "Beskrivelser", icon: FileText, color: "bg-green-500" },
  sha_plan: { label: "SHA-plan", icon: FileText, color: "bg-yellow-500" },
  bilder: { label: "Bilder", icon: Image, color: "bg-purple-500" },
  endringsmeldinger: { label: "Endringsmeldinger", icon: FileSpreadsheet, color: "bg-orange-500" },
  fdv: { label: "FDV-dokumentasjon", icon: FolderOpen, color: "bg-teal-500" },
  samsvar: { label: "Samsvarserklæringer", icon: FileText, color: "bg-red-500" },
  byggesak: { label: "Byggesak", icon: Building2, color: "bg-indigo-500" },
  annet: { label: "Annet", icon: File, color: "bg-gray-500" },
};

interface KsProject {
  id: string;
  name: string;
  project_number: string | null;
}

interface KsDocument {
  id: string;
  document_name: string;
  category: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  file_name: string;
  created_at: string;
  project_id: string;
  ks_projects: KsProject | null;
}

interface AdminDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
}

export default function KsDokumentsenter() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("annet");
  const [uploadProject, setUploadProject] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AdminDocument | null>(null);
  const [copyToProject, setCopyToProject] = useState<string>("");
  const [copyToCategory, setCopyToCategory] = useState<string>("byggesak");
  const [isCopying, setIsCopying] = useState(false);

  // Fetch all projects for the company
  const { data: projects } = useQuery({
    queryKey: ["ks-projects", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("ks_projects")
        .select("id, name, project_number")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch all documents across all projects
  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ["ks-all-documents", profile?.company_id, categoryFilter, projectFilter],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      let query = supabase
        .from("ks_project_documents")
        .select(`
          id,
          document_name,
          category,
          file_path,
          file_size,
          file_type,
          file_name,
          created_at,
          project_id,
          ks_projects (
            id,
            name,
            project_number
          )
        `)
        .eq("company_id", profile.company_id)
        .eq("is_latest_version", true)
        .order("created_at", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (projectFilter !== "all") {
        query = query.eq("project_id", projectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as KsDocument[];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch admin document templates (byggesak etc.)
  const { data: adminDocuments } = useQuery({
    queryKey: ["admin-document-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .order("document_type", { ascending: true })
        .order("document_name", { ascending: true });
      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  const filteredDocuments = documents?.filter(doc => 
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.ks_projects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdminDocs = adminDocuments?.filter(doc =>
    doc.document_name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadProject || !profile?.company_id) {
      toast.error("Velg fil og prosjekt");
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${profile.company_id}/${uploadProject}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("ks-project-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.email || "Ukjent";

      const { error: dbError } = await supabase
        .from("ks_project_documents")
        .insert({
          project_id: uploadProject,
          company_id: profile.company_id,
          document_name: selectedFile.name,
          file_name: selectedFile.name,
          category: uploadCategory,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: profile.id,
          uploaded_by_name: userName,
          version: 1,
          is_latest_version: true,
        });

      if (dbError) throw dbError;

      toast.success("Dokument lastet opp");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadCategory("annet");
      setUploadProject("");
      refetchDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokument");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadDocument = async (doc: KsDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("ks-project-documents")
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

  const previewDocument = async (doc: KsDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("ks-project-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.annet;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      byggesak: "Byggesak",
      other: "Annet",
      template: "Mal",
    };
    return labels[docType] || docType;
  };

  const openCopyDialog = (doc: AdminDocument) => {
    setSelectedTemplate(doc);
    setCopyDialogOpen(true);
  };

  const handleCopyToProject = async () => {
    if (!selectedTemplate || !copyToProject || !profile?.company_id) {
      toast.error("Velg prosjekt");
      return;
    }

    setIsCopying(true);
    try {
      // Download the admin document
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("admin-documents")
        .download(selectedTemplate.file_path);

      if (downloadError) throw downloadError;

      // Upload to project documents
      const newFilePath = `${profile.company_id}/${copyToProject}/${Date.now()}_${selectedTemplate.document_name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("ks-project-documents")
        .upload(newFilePath, fileData);

      if (uploadError) throw uploadError;

      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.email || "Ukjent";

      // Create document record
      const { error: dbError } = await supabase
        .from("ks_project_documents")
        .insert({
          project_id: copyToProject,
          company_id: profile.company_id,
          document_name: selectedTemplate.document_name,
          file_name: selectedTemplate.document_name,
          category: copyToCategory,
          file_path: newFilePath,
          file_type: selectedTemplate.file_type,
          file_size: selectedTemplate.file_size,
          uploaded_by: profile.id,
          uploaded_by_name: userName,
          version: 1,
          is_latest_version: true,
        });

      if (dbError) throw dbError;

      toast.success("Dokument kopiert til prosjekt");
      setCopyDialogOpen(false);
      setSelectedTemplate(null);
      setCopyToProject("");
      setCopyToCategory("byggesak");
      refetchDocuments();
    } catch (error: any) {
      console.error("Copy error:", error);
      toast.error("Kunne ikke kopiere dokument");
    } finally {
      setIsCopying(false);
    }
  };

  const previewAdminDocument = async (doc: AdminDocument) => {
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

  const downloadAdminDocument = async (doc: AdminDocument) => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dokumentsenter</h1>
            <p className="text-muted-foreground">Alle dokumenter på tvers av prosjekter</p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Last opp dokument
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Last opp dokument</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Prosjekt *</Label>
                  <Select value={uploadProject} onValueChange={setUploadProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prosjekt" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fil *</Label>
                  <Input type="file" onChange={handleFileChange} />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || !uploadProject || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Laster opp..." : "Last opp"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Mine dokumenter
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Library className="w-4 h-4 mr-2" />
              Malbibliotek
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk i dokumenter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Alle prosjekter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prosjekter</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_number || project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Alle kategorier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kategorier</SelectItem>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Documents list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Dokumenter ({filteredDocuments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredDocuments || filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen dokumenter funnet</p>
                    <p className="text-sm">Last opp ditt første dokument for å komme i gang</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => {
                      const catConfig = getCategoryConfig(doc.category);
                      const CatIcon = catConfig.icon;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg ${catConfig.color}`}>
                              <CatIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.document_name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {doc.ks_projects?.project_number || doc.ks_projects?.name || "Ukjent prosjekt"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {catConfig.label}
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {/* Template search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i maler..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Dokumentmaler ({filteredAdminDocs?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredAdminDocs || filteredAdminDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen maler tilgjengelig</p>
                    <p className="text-sm">Kontakt administrator for å få tilgang til maler</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAdminDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-indigo-500">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{doc.document_name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getDocTypeLabel(doc.document_type)}
                              </Badge>
                              {doc.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {doc.description}
                                </span>
                              )}
                              {doc.file_size && (
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file_size)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => previewAdminDocument(doc)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadAdminDocument(doc)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openCopyDialog(doc)}>
                            <Copy className="w-4 h-4 mr-1" />
                            Bruk
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

        {/* Copy to project dialog */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kopier til prosjekt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kopier "{selectedTemplate?.document_name}" til et prosjekt
              </p>
              <div className="space-y-2">
                <Label>Prosjekt *</Label>
                <Select value={copyToProject} onValueChange={setCopyToProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={copyToCategory} onValueChange={setCopyToCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCopyToProject} 
                disabled={!copyToProject || isCopying}
                className="w-full"
              >
                {isCopying ? "Kopierer..." : "Kopier til prosjekt"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
