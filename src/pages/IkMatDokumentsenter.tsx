import { useState } from "react";
import { FileText, Download, FolderOpen, Search, File, FileSpreadsheet, FileImage, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminDocument {
  id: string;
  document_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  folder_id: string | null;
  folder_name?: string;
}

interface AdminFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  parent_folder_id: string | null;
}

export default function IkMatDokumentsenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  // Fetch folders for IK-Mat module
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["admin-ik-mat-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_document_folders")
        .select("*")
        .eq("module_type", "ik-mat")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as AdminFolder[];
    },
  });

  // Fetch documents for IK-Mat module folders
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["admin-ik-mat-documents", folders],
    queryFn: async () => {
      if (folders.length === 0) return [];

      const folderIds = folders.map(f => f.id);
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .in("folder_id", folderIds)
        .order("document_name");

      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
    enabled: folders.length > 0,
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const getDocumentsByFolder = (folderId: string) => {
    return documents.filter(doc => doc.folder_id === folderId);
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Ukjent størrelse";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
    if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (fileType.includes("image")) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-8 w-8 text-blue-600" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      emerald: "bg-emerald-500",
      amber: "bg-amber-500",
      purple: "bg-purple-500",
      cyan: "bg-cyan-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      gray: "bg-gray-500",
    };
    return colorMap[color] || "bg-orange-500";
  };

  // Filter folders and documents by search
  const filteredFolders = folders.filter(folder => {
    const folderDocs = getDocumentsByFolder(folder.id);
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folderDocs.some(doc =>
        doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  const isLoading = foldersLoading || documentsLoading;

  // Build folder tree
  const buildFolderTree = () => {
    const rootFolders = filteredFolders.filter(f => !f.parent_folder_id);
    const getChildren = (parentId: string) => filteredFolders.filter(f => f.parent_folder_id === parentId);

    return rootFolders.map(folder => ({
      ...folder,
      children: getChildren(folder.id),
    }));
  };

  const folderTree = buildFolderTree();

  const renderFolder = (folder: AdminFolder & { children?: AdminFolder[] }, depth: number = 0) => {
    const folderDocs = getDocumentsByFolder(folder.id);
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    // Filter docs by search
    const filteredDocs = folderDocs.filter(doc =>
      !searchQuery ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Skip if no docs match search and no matching folder name
    if (searchQuery && filteredDocs.length === 0 && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }

    return (
      <Collapsible
        key={folder.id}
        open={isExpanded}
        onOpenChange={() => toggleFolder(folder.id)}
      >
        <Card className="overflow-hidden" style={{ marginLeft: depth * 16 }}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(folder.color)}`}>
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {folder.name}
                    <Badge variant="secondary" className="ml-2">
                      {folderDocs.length} dokumenter
                    </Badge>
                  </CardTitle>
                  {folder.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{folder.description}</p>
                  )}
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
            <CardContent className="pt-0 pb-4">
              {filteredDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Ingen dokumenter i denne mappen</p>
              ) : (
                <div className="grid gap-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{doc.document_name}</h4>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.file_path)}
                        className="shrink-0"
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Last ned</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Render child folders */}
              {hasChildren && (
                <div className="mt-4 space-y-2">
                  {folder.children!.map(child => renderFolder(child as AdminFolder & { children?: AdminFolder[] }, 1))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Dokumentsenter</h1>
          <p className="text-muted-foreground mt-1">
            Last ned maler og dokumenter for IK-Mat
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i dokumenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2" />
            Laster dokumenter...
          </div>
        ) : folderTree.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium text-lg">Ingen dokumenter tilgjengelig ennå</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Dokumenter vil bli lagt til av systemadministrator
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {folderTree.map(folder => renderFolder(folder))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}