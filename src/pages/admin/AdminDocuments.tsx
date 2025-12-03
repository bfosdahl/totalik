import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  File
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const DOCUMENT_TYPES = {
  template: { label: "Mal/Template", icon: FileText, color: "bg-blue-500" },
  guide: { label: "Veiledning", icon: FileText, color: "bg-green-500" },
  regulation: { label: "Forskrift/Lov", icon: FileText, color: "bg-yellow-500" },
  image: { label: "Bilde", icon: Image, color: "bg-purple-500" },
  other: { label: "Annet", icon: File, color: "bg-gray-500" },
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

export default function AdminDocuments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("template");
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch all admin documents
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
      setSelectedFile(null);
      setDocumentName("");
      setDescription("");
      setUploadType("template");
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("admin-documents")
        .remove([doc.file_path]);
      
      if (storageError) console.error("Storage delete error:", storageError);

      // Delete from database
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dokumentsenter</h1>
            <p className="text-muted-foreground">Administrer maler, veiledninger og dokumenter</p>
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
          </CardContent>
        </Card>

        {/* Documents list */}
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
                <p className="text-sm">Last opp ditt første dokument for å komme i gang</p>
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
      </div>
    </AdminLayout>
  );
}
