import { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  Shield,
  Clock,
  FileCheck,
  Calendar,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Leaf,
  HardHat,
  UtensilsCrossed,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DocumentFolderTree } from "@/components/admin/DocumentFolderTree";
import { DocumentBulkActions } from "@/components/admin/DocumentBulkActions";
import { useAdminDocumentFolders, AdminDocumentFolder, ModuleType } from "@/hooks/useAdminDocumentFolders";

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
  folder_id: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

const MODULE_CONFIG: Record<ModuleType, { label: string; icon: any; color: string; bgColor: string }> = {
  "ik-hms": { label: "IK-HMS", icon: Shield, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  "ik-mat": { label: "IK-Mat", icon: UtensilsCrossed, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  "ks-bygg": { label: "KS Bygg", icon: HardHat, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

export default function AdminDocuments() {
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState<ModuleType>("ik-hms");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { folders } = useAdminDocumentFolders(activeModule);

  const [documentForm, setDocumentForm] = useState({
    folder_id: "",
    is_mandatory: false,
    version: "2025.1",
    requires_signature: false,
    upload_deadline_days: 7,
    include_in_pdf: true,
  });

  // Fetch documents for current module's folders
  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-documents", activeModule],
    queryFn: async () => {
      // Get folder IDs for this module
      const { data: moduleFolders } = await supabase
        .from("admin_document_folders")
        .select("id")
        .eq("module_type", activeModule);
      
      const folderIds = moduleFolders?.map(f => f.id) || [];
      
      // Get documents in these folders
      let query = supabase
        .from("admin_documents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (folderIds.length > 0) {
        query = query.in("folder_id", folderIds);
      } else {
        // No folders yet for this module, return empty
        return [] as AdminDocument[];
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  // Calculate document counts per folder
  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents?.forEach((doc) => {
      const folderId = doc.folder_id || "uncategorized";
      counts[folderId] = (counts[folderId] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Get current folder info
  const currentFolder = folders?.find((f) => f.id === selectedFolderId);

  // Get breadcrumb path
  const getBreadcrumbPath = (): AdminDocumentFolder[] => {
    if (!selectedFolderId || !folders) return [];
    const path: AdminDocumentFolder[] = [];
    let current = folders.find((f) => f.id === selectedFolderId);
    while (current) {
      path.unshift(current);
      current = folders.find((f) => f.id === current?.parent_folder_id);
    }
    return path;
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let result = documents?.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolder = selectedFolderId
        ? doc.folder_id === selectedFolderId
        : true;

      return matchesSearch && matchesFolder;
    });

    // Sort
    result?.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.document_name.localeCompare(b.document_name);
          break;
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "size":
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [documents, searchQuery, selectedFolderId, sortBy, sortOrder]);

  // Recently modified documents
  const recentDocuments = useMemo(() => {
    return documents
      ?.slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setDocumentForm({
      folder_id: selectedFolderId || "",
      is_mandatory: false,
      version: "2025.1",
      requires_signature: false,
      upload_deadline_days: 7,
      include_in_pdf: true,
    });
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/æ/gi, "ae")
      .replace(/ø/gi, "o")
      .replace(/å/gi, "a")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Velg minst én fil");
      return;
    }

    if (!documentForm.folder_id) {
      toast.error("Velg en mappe for dokumentene");
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const sanitizedName = sanitizeFileName(file.name);
          const filePath = `admin/${activeModule}/${Date.now()}_${sanitizedName}`;
          const documentName = file.name.split(".").slice(0, -1).join(".");

          const { error: uploadError } = await supabase.storage
            .from("admin-documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from("admin_documents").insert({
            document_name: documentName,
            document_type: activeModule.toUpperCase(),
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            description: documentForm.requires_signature
              ? `Krever signering. Frist: ${documentForm.upload_deadline_days} dager.`
              : null,
            folder_id: documentForm.folder_id || null,
            is_mandatory: documentForm.is_mandatory,
            version: documentForm.version,
            uploaded_by_name: "System Admin",
          });

          if (dbError) throw dbError;
          successCount++;
        } catch (error) {
          console.error("Upload error for file:", file.name, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} dokument${successCount > 1 ? "er" : ""} lastet opp`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} fil${errorCount > 1 ? "er" : ""} feilet`);
      }

      setUploadDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokumenter");
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

      const { error: dbError } = await supabase.from("admin_documents").delete().eq("id", doc.id);

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

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ docIds, folderId }: { docIds: string[]; folderId: string | null }) => {
      const { error } = await supabase
        .from("admin_documents")
        .update({ folder_id: folderId })
        .in("id", docIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dokumenter flyttet");
      setSelectedDocIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: () => {
      toast.error("Kunne ikke flytte dokumenter");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (docIds: string[]) => {
      const docsToDelete = documents?.filter((d) => docIds.includes(d.id)) || [];

      // Delete from storage
      const filePaths = docsToDelete.map((d) => d.file_path);
      if (filePaths.length > 0) {
        await supabase.storage.from("admin-documents").remove(filePaths);
      }

      // Delete from database
      const { error } = await supabase.from("admin_documents").delete().in("id", docIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dokumenter slettet");
      setSelectedDocIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette dokumenter");
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

  const handleBulkDownload = async () => {
    const selectedDocs = documents?.filter((d) => selectedDocIds.has(d.id)) || [];
    for (const doc of selectedDocs) {
      await downloadDocument(doc);
    }
  };

  const toggleDocSelection = (docId: string) => {
    const newSelection = new Set(selectedDocIds);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocIds(newSelection);
  };

  const selectAllVisible = () => {
    const allIds = new Set(filteredDocuments?.map((d) => d.id) || []);
    setSelectedDocIds(allIds);
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

  const handleModuleChange = (module: string) => {
    setActiveModule(module as ModuleType);
    setSelectedFolderId(null);
    setSelectedDocIds(new Set());
    setSearchQuery("");
  };

  const stats = {
    totalDocuments: documents?.length || 0,
    mandatoryDocuments: documents?.filter((d) => d.is_mandatory).length || 0,
    foldersCount: folders?.length || 0,
  };

  const activeConfig = MODULE_CONFIG[activeModule];
  const ActiveIcon = activeConfig.icon;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Module Tabs */}
        <div className="border-b bg-background px-4 py-3">
          <Tabs value={activeModule} onValueChange={handleModuleChange}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {(Object.entries(MODULE_CONFIG) as [ModuleType, typeof activeConfig][]).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with folder tree */}
          <div className="w-64 border-r bg-muted/30 flex-shrink-0 hidden lg:flex flex-col">
            <DocumentFolderTree
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              documentCounts={documentCounts}
              moduleType={activeModule}
            />

            {/* Recent documents */}
            {recentDocuments && recentDocuments.length > 0 && (
              <div className="border-t p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Nylig lagt til
                </h4>
                <div className="space-y-1">
                  {recentDocuments?.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-sm"
                      onClick={() => previewDocument(doc)}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate flex-1">{doc.document_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", activeConfig.bgColor)}>
                    <ActiveIcon className={cn("h-6 w-6", activeConfig.color)} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Dokumentsenter - {activeConfig.label}</h1>
                    <p className="text-muted-foreground text-sm">
                      Administrer maler og dokumenter for kunder
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className={cn(
                        activeModule === "ik-hms" && "bg-emerald-600 hover:bg-emerald-700",
                        activeModule === "ik-mat" && "bg-orange-600 hover:bg-orange-700",
                        activeModule === "ks-bygg" && "bg-blue-600 hover:bg-blue-700",
                      )}>
                        <Plus className="h-4 w-4 mr-2" />
                        Last opp
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Last opp dokumenter til {activeConfig.label}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Drag and Drop Zone */}
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                            isDragging
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/25 hover:border-primary/50"
                          )}
                          onClick={() => document.getElementById("multi-file-input")?.click()}
                        >
                          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm font-medium">Dra og slipp filer her</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            eller klikk for å velge filer
                          </p>
                          <Input
                            id="multi-file-input"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                        </div>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            <Label>Valgte filer ({selectedFiles.length})</Label>
                            <ScrollArea className="h-28 border rounded-md p-2">
                              <div className="space-y-1">
                                {selectedFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1"
                                  >
                                    <div className="flex items-center gap-2 truncate flex-1">
                                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({(file.size / 1024).toFixed(0)} KB)
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      onClick={() => removeFile(index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Mappe *</Label>
                          <Select
                            value={documentForm.folder_id}
                            onValueChange={(v) =>
                              setDocumentForm((prev) => ({ ...prev, folder_id: v }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg mappe" />
                            </SelectTrigger>
                            <SelectContent>
                              {folders?.map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                  {folder.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {folders?.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Opprett en mappe først i sidepanelet
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Versjon</Label>
                            <Input
                              value={documentForm.version}
                              onChange={(e) =>
                                setDocumentForm((prev) => ({ ...prev, version: e.target.value }))
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Switch
                              checked={documentForm.is_mandatory}
                              onCheckedChange={(v) =>
                                setDocumentForm((prev) => ({ ...prev, is_mandatory: v }))
                              }
                            />
                            <Label>Obligatorisk</Label>
                          </div>
                        </div>

                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={documentForm.requires_signature}
                              onCheckedChange={(v) =>
                                setDocumentForm((prev) => ({ ...prev, requires_signature: !!v }))
                              }
                            />
                            <div>
                              <Label className="text-sm font-medium">Krever signering</Label>
                              <p className="text-xs text-muted-foreground">
                                Brukeren må signere og laste opp igjen
                              </p>
                            </div>
                          </div>

                          {documentForm.requires_signature && (
                            <div className="pl-6 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm">Frist (dager):</Label>
                              <Input
                                type="number"
                                value={documentForm.upload_deadline_days}
                                onChange={(e) =>
                                  setDocumentForm((prev) => ({
                                    ...prev,
                                    upload_deadline_days: parseInt(e.target.value) || 7,
                                  }))
                                }
                                className="w-20"
                                min={1}
                              />
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleUpload}
                          disabled={isUploading || selectedFiles.length === 0 || !documentForm.folder_id}
                          className={cn(
                            "w-full",
                            activeModule === "ik-hms" && "bg-emerald-600 hover:bg-emerald-700",
                            activeModule === "ik-mat" && "bg-orange-600 hover:bg-orange-700",
                            activeModule === "ks-bygg" && "bg-blue-600 hover:bg-blue-700",
                          )}
                        >
                          {isUploading
                            ? "Laster opp..."
                            : `Last opp ${selectedFiles.length} dokument${selectedFiles.length !== 1 ? "er" : ""}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Breadcrumb */}
              {selectedFolderId && (
                <div className="mt-3">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          onClick={() => setSelectedFolderId(null)}
                          className="cursor-pointer"
                        >
                          Alle dokumenter
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {getBreadcrumbPath().map((folder, index, arr) => (
                        <div key={folder.id} className="flex items-center">
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {index === arr.length - 1 ? (
                              <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink
                                onClick={() => setSelectedFolderId(folder.id)}
                                className="cursor-pointer"
                              >
                                {folder.name}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </div>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{stats.totalDocuments}</strong> dokumenter
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  <strong className="text-foreground">{stats.mandatoryDocuments}</strong> obligatoriske
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  <strong className="text-foreground">{stats.foldersCount}</strong> mapper
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i dokumenter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-32">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Dato</SelectItem>
                    <SelectItem value="name">Navn</SelectItem>
                    <SelectItem value="size">Størrelse</SelectItem>
                  </SelectContent>
                </Select>

                <div className="border rounded-md flex">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {filteredDocuments && filteredDocuments.length > 0 && (
                  <Button variant="outline" size="sm" onClick={selectAllVisible}>
                    Velg alle
                  </Button>
                )}
              </div>
            </div>

            {/* Documents */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filteredDocuments && filteredDocuments.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocuments.map((doc) => {
                      const FileIcon = getFileIcon(doc.file_type);
                      const isPDF = doc.file_type?.includes("pdf");
                      const isSelected = selectedDocIds.has(doc.id);

                      return (
                        <Card
                          key={doc.id}
                          className={cn(
                            "overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative",
                            isSelected && "ring-2 ring-primary"
                          )}
                        >
                          {/* Selection checkbox */}
                          <div
                            className="absolute top-2 left-2 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocSelection(doc.id);
                            }}
                          >
                            <Checkbox checked={isSelected} />
                          </div>

                          {/* Preview area */}
                          <div
                            className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative"
                            onClick={() => previewDocument(doc)}
                          >
                            {isPDF ? (
                              <FileText className="h-12 w-12 text-red-500" />
                            ) : (
                              <FileIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>

                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm truncate" title={doc.document_name}>
                              {doc.document_name}
                            </h4>

                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {doc.is_mandatory && (
                                <Badge variant="destructive" className="text-xs h-5">
                                  Obligatorisk
                                </Badge>
                              )}
                              {doc.version && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  v{doc.version}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                              {formatFileSize(doc.file_size)} •{" "}
                              {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadDocument(doc);
                                }}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Last ned
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(doc);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredDocuments.map((doc) => {
                      const FileIcon = getFileIcon(doc.file_type);
                      const isSelected = selectedDocIds.has(doc.id);

                      return (
                        <div
                          key={doc.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDocSelection(doc.id)}
                          />
                          <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{doc.document_name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)} •{" "}
                              {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {doc.is_mandatory && (
                              <Badge variant="destructive" className="text-xs">
                                Obligatorisk
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => previewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => downloadDocument(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">
                      {folders?.length === 0 
                        ? "Opprett en mappe først"
                        : selectedFolderId 
                          ? "Ingen dokumenter i denne mappen" 
                          : "Ingen dokumenter ennå"}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {folders?.length === 0 
                        ? "Bruk '+'-knappen i sidepanelet for å opprette mapper"
                        : "Last opp ditt første dokument for å komme i gang"}
                    </p>
                    {folders && folders.length > 0 && (
                      <Button
                        className={cn(
                          "mt-4",
                          activeModule === "ik-hms" && "bg-emerald-600 hover:bg-emerald-700",
                          activeModule === "ik-mat" && "bg-orange-600 hover:bg-orange-700",
                          activeModule === "ks-bygg" && "bg-blue-600 hover:bg-blue-700",
                        )}
                        onClick={() => {
                          setDocumentForm((prev) => ({ ...prev, folder_id: selectedFolderId || "" }));
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Last opp dokument
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <DocumentBulkActions
        selectedCount={selectedDocIds.size}
        folders={folders || []}
        onMove={(folderId) =>
          bulkMoveMutation.mutate({ docIds: Array.from(selectedDocIds), folderId })
        }
        onDelete={() => bulkDeleteMutation.mutate(Array.from(selectedDocIds))}
        onDownload={handleBulkDownload}
        onClearSelection={() => setSelectedDocIds(new Set())}
      />
    </AdminLayout>
  );
}