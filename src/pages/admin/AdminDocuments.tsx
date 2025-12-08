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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Plus,
  ChevronRight,
  ChevronDown,
  Leaf,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

// IK-HMS Mappestruktur (17 hovedmapper)
const IK_HMS_FOLDERS = [
  { id: "0", name: "Virksomhetsinformasjon", subfolders: ["0.1 Bedriftsinfo", "0.2 Kontaktinformasjon", "0.3 Organisasjonskart"] },
  { id: "1", name: "Organisasjon og personal", subfolders: ["1.1 Roller og ansvar", "1.2 Arbeidsavtaler", "1.3 Personalhåndbok"] },
  { id: "2", name: "Regelverk og krav", subfolders: ["2.1 Lover", "2.2 Forskrifter", "2.3 Standarder"] },
  { id: "3", name: "HMS-mål, handlingsplan og årshjul", subfolders: ["3.1 HMS-mål", "3.2 Handlingsplan", "3.3 Årshjul"] },
  { id: "4", name: "Risikovurderinger", subfolders: ["4.1 Generelle risikovurderinger", "4.2 Spesifikke risikovurderinger", "4.3 Maler"] },
  { id: "5", name: "HMS-rutiner og prosedyrer", subfolders: ["5.1 Arbeidsrutiner", "5.2 Sikkerhetsprosedyrer", "5.3 Vernerunder"] },
  { id: "6", name: "Avvikssystem", subfolders: ["6.1 Avviksprosedyrer", "6.2 Skjemaer", "6.3 Rapporter"] },
  { id: "7", name: "SJA – Sikker Jobb Analyse", subfolders: ["7.1 SJA-maler", "7.2 Veiledninger", "7.3 Utfylte SJA'er"] },
  { id: "8", name: "Verneombud og medvirkning", subfolders: ["8.1 Verneombudsinfo", "8.2 AMU", "8.3 Medvirkningsrutiner"] },
  { id: "9", name: "Førstehjelp, beredskap og brannvern", subfolders: ["9.1 Førstehjelp", "9.2 Beredskapsplaner", "9.3 Brannvern"] },
  { id: "10", name: "Kjemikalier og stoffkartotek", subfolders: ["10.1 Stoffkartotek", "10.2 Sikkerhetsdatablader", "10.3 Rutiner"] },
  { id: "11", name: "Maskiner, verktøy og utstyr", subfolders: ["11.1 Maskinliste", "11.2 Brukerveiledninger", "11.3 Vedlikeholdsrutiner"] },
  { id: "12", name: "Sjekklister (HMS)", subfolders: ["12.1 Daglige sjekklister", "12.2 Periodiske sjekklister", "12.3 Maler"] },
  { id: "13", name: "Revisjon og årlig gjennomgang", subfolders: ["13.1 Revisjonsrapporter", "13.2 Årlig gjennomgang", "13.3 Forbedringstiltak"] },
  { id: "14", name: "Skjema og dokumentmaler", subfolders: ["14.1 Arbeidsavtaler", "14.2 HMS-skjemaer", "14.3 Generelle maler"] },
  { id: "15", name: "Eksterne avtaler og rapporter", subfolders: ["15.1 BHT-avtaler", "15.2 Forsikringer", "15.3 Rapporter"] },
  { id: "16", name: "Arkiv", subfolders: ["16.1 Historiske dokumenter", "16.2 Utgåtte rutiner", "16.3 Gamle versjoner"] },
];

interface AdminDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  category: string | null;
  is_mandatory: boolean | null;
  version: string | null;
  created_at: string;
  uploaded_by_name: string;
}

export default function AdminDocuments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["0", "1", "14"]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [documentForm, setDocumentForm] = useState({
    document_name: "",
    description: "",
    category: "",
    is_mandatory: false,
    version: "2025.1",
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-ik-hms-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentForm.document_name) {
        setDocumentForm(prev => ({
          ...prev,
          document_name: file.name.split('.').slice(0, -1).join('.')
        }));
      }
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentForm({
      document_name: "",
      description: "",
      category: selectedFolder || "",
      is_mandatory: false,
      version: "2025.1",
    });
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/æ/gi, 'ae')
      .replace(/ø/gi, 'o')
      .replace(/å/gi, 'a')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentForm.document_name) {
      toast.error("Velg fil og gi dokumentet et navn");
      return;
    }

    setIsUploading(true);
    try {
      const sanitizedName = sanitizeFileName(selectedFile.name);
      const filePath = `ik-hms/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("admin_documents")
        .insert({
          document_name: documentForm.document_name,
          document_type: "IK-HMS",
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: documentForm.description || null,
          category: documentForm.category || null,
          is_mandatory: documentForm.is_mandatory,
          version: documentForm.version,
          uploaded_by_name: "System Admin",
        });

      if (dbError) throw dbError;

      toast.success("Dokument lastet opp");
      setUploadDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-ik-hms-documents"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-ik-hms-documents"] });
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.includes("image")) return Image;
    return FileText;
  };

  // Filter documents by selected folder/category and search
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = !selectedFolder || doc.category === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  // Get all folder options for dropdown (flatten structure)
  const allFolderOptions = IK_HMS_FOLDERS.flatMap(folder => [
    { value: folder.id, label: `${folder.id}. ${folder.name}` },
    ...folder.subfolders.map(sub => ({ value: sub, label: sub }))
  ]);

  const stats = {
    totalDocuments: documents?.length || 0,
    mandatoryDocuments: documents?.filter(d => d.is_mandatory).length || 0,
    foldersWithContent: new Set(documents?.map(d => d.category?.split('.')[0]).filter(Boolean)).size,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Leaf className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin – Dokumenter (IK-HMS)</h1>
              <p className="text-muted-foreground text-sm">
                Sentralt lager for IK-HMS dokumenter, maler og rutiner
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 w-fit border-emerald-500/50 text-emerald-600">
            <Shield className="h-3.5 w-3.5" />
            System Admin
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Totalt dokumenter</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.mandatoryDocuments}</div>
              <p className="text-xs text-muted-foreground">Obligatoriske</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.foldersWithContent}</div>
              <p className="text-xs text-muted-foreground">Mapper med innhold</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folder Navigation */}
          <Card className="lg:col-span-1 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-emerald-500" />
                Mappestruktur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="px-4 pb-4 space-y-1">
                  <Button
                    variant={selectedFolder === null ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedFolder(null)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Alle dokumenter
                  </Button>
                  
                  {IK_HMS_FOLDERS.map(folder => (
                    <Collapsible
                      key={folder.id}
                      open={expandedFolders.includes(folder.id)}
                      onOpenChange={() => toggleFolder(folder.id)}
                    >
                      <div className="flex items-center">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                            {expandedFolders.includes(folder.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                          size="sm"
                          className="flex-1 justify-start text-left text-xs"
                          onClick={() => setSelectedFolder(folder.id)}
                        >
                          <span className="truncate">{folder.id}. {folder.name}</span>
                        </Button>
                      </div>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-0.5">
                          {folder.subfolders.map(sub => (
                            <Button
                              key={sub}
                              variant={selectedFolder === sub ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-left text-xs h-7 px-2"
                              onClick={() => setSelectedFolder(sub)}
                            >
                              <span className="truncate">{sub}</span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm font-medium">
                  {selectedFolder ? `Dokumenter i: ${selectedFolder}` : "Alle dokumenter"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk dokumenter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Last opp
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Last opp dokument</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="file">Fil</Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dokumentnavn</Label>
                          <Input
                            value={documentForm.document_name}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, document_name: e.target.value }))}
                            placeholder="Gi dokumentet et navn"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mappe/Kategori</Label>
                          <Select
                            value={documentForm.category}
                            onValueChange={(v) => setDocumentForm(prev => ({ ...prev, category: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg mappe" />
                            </SelectTrigger>
                            <SelectContent>
                              {allFolderOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Beskrivelse</Label>
                          <Textarea
                            value={documentForm.description}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Kort beskrivelse av dokumentet"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Versjon</Label>
                            <Input
                              value={documentForm.version}
                              onChange={(e) => setDocumentForm(prev => ({ ...prev, version: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Switch
                              checked={documentForm.is_mandatory}
                              onCheckedChange={(v) => setDocumentForm(prev => ({ ...prev, is_mandatory: v }))}
                            />
                            <Label>Obligatorisk</Label>
                          </div>
                        </div>
                        <Button 
                          onClick={handleUpload} 
                          disabled={isUploading || !selectedFile}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isUploading ? "Laster opp..." : "Last opp dokument"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                </div>
              ) : filteredDocuments && filteredDocuments.length > 0 ? (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.file_type);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-emerald-500/10 rounded">
                            <FileIcon className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{doc.document_name}</p>
                              {doc.is_mandatory && (
                                <Badge variant="destructive" className="text-xs">Obligatorisk</Badge>
                              )}
                              {doc.version && (
                                <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {doc.category && <span className="text-emerald-600">{doc.category}</span>}
                              {doc.category && <span>•</span>}
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}</span>
                            </div>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => previewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadDocument(doc)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(doc)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {selectedFolder ? "Ingen dokumenter i denne mappen" : "Ingen dokumenter lastet opp"}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setDocumentForm(prev => ({ ...prev, category: selectedFolder || "" }));
                      setUploadDialogOpen(true);
                    }}
                    className="text-emerald-600"
                  >
                    Last opp første dokument
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}