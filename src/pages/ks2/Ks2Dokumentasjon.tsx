import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  Upload,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  File,
  Loader2,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

interface ProjectDocument {
  id: string;
  folder_code: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  file_type?: string | null;
  source_type?: string;
  created_at: string;
  uploaded_by_name?: string | null;
  document_name?: string;
  include_in_report: boolean;
}

interface FolderStructure {
  code: string;
  name: string;
  expanded: boolean;
  documents: ProjectDocument[];
  isCustom?: boolean;
}

const DEFAULT_FOLDERS: { code: string; name: string }[] = [
  { code: "10", name: "Rutiner" },
  { code: "20", name: "SHA" },
  { code: "30", name: "KS Egenkontroller" },
  { code: "31", name: "KS Uavhengig kontroll" },
  { code: "80", name: "FDV" },
  { code: "90", name: "Byggesak" },
];

export default function Ks2Dokumentasjon() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [folders, setFolders] = useState<FolderStructure[]>(
    DEFAULT_FOLDERS.map((f) => ({ ...f, expanded: f.code === "30", documents: [] }))
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCode, setNewFolderCode] = useState("");
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from("ks_module2_documents")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Group documents by folder
        const docs = ((data || []) as any[]).map((d: any) => ({
          ...d,
          folder_code: d.folder_code || d.folder_path?.split('/')[0] || '30',
          file_name: d.file_name || d.document_name || 'Dokument',
          include_in_report: d.include_in_report !== false,
        })) as ProjectDocument[];
        
        // Get unique folder codes from documents
        const existingFolderCodes = new Set(DEFAULT_FOLDERS.map(f => f.code));
        const customFolderCodes = [...new Set(docs.map(d => d.folder_code))]
          .filter(code => !existingFolderCodes.has(code));

        // Create folder structure
        const allFolders: FolderStructure[] = [
          ...DEFAULT_FOLDERS.map((folder) => ({
            ...folder,
            expanded: folder.code === "30",
            documents: docs.filter((d) => d.folder_code === folder.code),
          })),
          ...customFolderCodes.map(code => ({
            code,
            name: code,
            expanded: false,
            documents: docs.filter(d => d.folder_code === code),
            isCustom: true,
          })),
        ];

        setFolders(allFolders);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Kunne ikke laste dokumenter");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [projectId]);

  const toggleFolder = (code: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.code === code ? { ...f, expanded: !f.expanded } : f))
    );
  };

  const handleFileUpload = async (files: FileList | null, folderCode: string) => {
    if (!files || files.length === 0 || !projectId || !profile) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileName = `${projectId}/${folderCode}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
          .from("ks-module2-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from("ks_module2_documents")
          .insert({
            company_id: profile.company_id,
            project_id: projectId,
            document_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            folder_path: folderCode,
            source_type: "upload",
            uploaded_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
            include_in_report: true,
          });

        if (dbError) throw dbError;
      }

      toast.success(`${files.length} dokument(er) lastet opp`);
      
      // Refresh documents
      const { data } = await supabase
        .from("ks_module2_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) {
        const docs = data.map((d: any) => ({
          ...d,
          folder_code: d.folder_code || '30',
          file_name: d.file_name || d.document_name || 'Dokument',
          include_in_report: d.include_in_report !== false,
        })) as ProjectDocument[];

        setFolders(prev => prev.map(folder => ({
          ...folder,
          documents: docs.filter(d => d.folder_code === folder.code),
        })));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokument");
    } finally {
      setIsUploading(false);
      setUploadTargetFolder(null);
    }
  };

  const handleViewDocument = async (doc: ProjectDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("ks-module2-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("View error:", error);
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const handleDownloadDocument = async (doc: ProjectDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("ks-module2-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke laste ned dokument");
    }
  };

  const handleToggleReportInclusion = async (doc: ProjectDocument) => {
    try {
      const { error } = await supabase
        .from("ks_module2_documents")
        .update({ include_in_report: !doc.include_in_report })
        .eq("id", doc.id);

      if (error) throw error;

      setFolders(prev => prev.map(folder => ({
        ...folder,
        documents: folder.documents.map(d => 
          d.id === doc.id ? { ...d, include_in_report: !d.include_in_report } : d
        ),
      })));
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Kunne ikke oppdatere dokument");
    }
  };

  const handleDeleteDocument = async (doc: ProjectDocument) => {
    if (!confirm("Er du sikker på at du vil slette dette dokumentet?")) return;

    try {
      await supabase.storage
        .from("ks-module2-documents")
        .remove([doc.file_path]);

      const { error } = await supabase
        .from("ks_module2_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      setFolders(prev => prev.map(folder => ({
        ...folder,
        documents: folder.documents.filter(d => d.id !== doc.id),
      })));

      toast.success("Dokument slettet");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Kunne ikke slette dokument");
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderCode || !newFolderName) {
      toast.error("Fyll ut mappekode og navn");
      return;
    }

    if (folders.some(f => f.code === newFolderCode)) {
      toast.error("Denne mappekoden finnes allerede");
      return;
    }

    setFolders(prev => [...prev, {
      code: newFolderCode,
      name: newFolderName,
      expanded: true,
      documents: [],
      isCustom: true,
    }].sort((a, b) => a.code.localeCompare(b.code)));

    setShowNewFolderDialog(false);
    setNewFolderCode("");
    setNewFolderName("");
    toast.success("Mappe opprettet");
  };

  const filteredFolders = folders.map((folder) => ({
    ...folder,
    documents: search
      ? folder.documents.filter((d) =>
          d.file_name.toLowerCase().includes(search.toLowerCase())
        )
      : folder.documents,
  }));

  const totalDocuments = folders.reduce((acc, f) => acc + f.documents.length, 0);
  const includedInReport = folders.reduce(
    (acc, f) => acc + f.documents.filter(d => d.include_in_report).length, 
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dokumentasjon & FDV</h1>
          <p className="text-muted-foreground">
            {totalDocuments} dokumenter • {includedInReport} inkludert i rapport
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Ny mappe
          </Button>
          <Button onClick={() => navigate(`/ks/project/${projectId}/rapport`)}>
            <FileText className="h-4 w-4 mr-2" />
            Generer rapport
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i dokumenter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (uploadTargetFolder) {
            handleFileUpload(e.target.files, uploadTargetFolder);
          }
        }}
      />

      {/* Folder Tree */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFolders.map((folder) => (
            <Card key={folder.code}>
              <CardContent className="p-0">
                {/* Folder Header */}
                <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <button
                    onClick={() => toggleFolder(folder.code)}
                    className="flex items-center gap-2 flex-1"
                  >
                    {folder.expanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    {folder.expanded ? (
                      <FolderOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <Folder className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-medium flex-1 text-left">
                      {folder.code} {folder.name}
                    </span>
                  </button>
                  <Badge variant="secondary">{folder.documents.length}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadTargetFolder(folder.code);
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                  >
                    {isUploading && uploadTargetFolder === folder.code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Folder Contents */}
                {folder.expanded && (
                  <div className="border-t">
                    {folder.documents.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        <p>Ingen dokumenter i denne mappen</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setUploadTargetFolder(folder.code);
                            fileInputRef.current?.click();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Last opp dokument
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {folder.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 pl-12 hover:bg-muted/30"
                          >
                            <Checkbox
                              checked={doc.include_in_report}
                              onCheckedChange={() => handleToggleReportInclusion(doc)}
                              title="Inkluder i rapport"
                            />
                            <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.created_at && format(parseISO(doc.created_at), "d. MMM yyyy", { locale: nb })}
                                {doc.source_type && doc.source_type !== "upload" && ` • Fra ${doc.source_type}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny mappe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mappekode</Label>
              <Input
                placeholder="F.eks. 40"
                value={newFolderCode}
                onChange={(e) => setNewFolderCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bruk NS 3451 kodesystem (10-99)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Mappenavn</Label>
              <Input
                placeholder="F.eks. Drift og vedlikehold"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateFolder}>
              Opprett mappe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
