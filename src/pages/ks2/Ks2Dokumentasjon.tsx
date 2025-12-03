import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

interface ProjectDocument {
  id: string;
  folder_code?: string;
  folder_name?: string;
  file_name?: string;
  file_path: string;
  file_size?: number | null;
  file_type?: string | null;
  source_type?: string;
  created_at: string;
  uploaded_by_name?: string | null;
  document_name?: string;
  folder_path?: string;
}

interface Folder {
  code: string;
  name: string;
  expanded: boolean;
  documents: ProjectDocument[];
}

const DEFAULT_FOLDERS = [
  { code: "30", name: "KS – Egenkontroller" },
  { code: "31", name: "KS – Uavhengig kontroll" },
  { code: "80", name: "FDV-dokumentasjon" },
];

export default function Ks2Dokumentasjon() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const [folders, setFolders] = useState<Folder[]>(
    DEFAULT_FOLDERS.map((f) => ({ ...f, expanded: f.code === "30", documents: [] }))
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        })) as ProjectDocument[];
        setFolders((prev) =>
          prev.map((folder) => ({
            ...folder,
            documents: docs.filter((d) => d.folder_code === folder.code),
          }))
        );
      } catch (error) {
        console.error("Error fetching documents:", error);
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

  const filteredFolders = folders.map((folder) => ({
    ...folder,
    documents: search
      ? folder.documents.filter((d) =>
          d.file_name.toLowerCase().includes(search.toLowerCase())
        )
      : folder.documents,
  }));

  const totalDocuments = folders.reduce((acc, f) => acc + f.documents.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dokumentasjon & FDV</h1>
          <p className="text-muted-foreground">{totalDocuments} dokumenter totalt</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Last opp dokument
        </Button>
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

      {/* Folder Tree */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFolders.map((folder) => (
            <Card key={folder.code}>
              <CardContent className="p-0">
                {/* Folder Header */}
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFolder(folder.code)}
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
                  <Badge variant="secondary">{folder.documents.length}</Badge>
                </button>

                {/* Folder Contents */}
                {folder.expanded && (
                  <div className="border-t">
                    {folder.documents.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Ingen dokumenter i denne mappen
                      </div>
                    ) : (
                      <div className="divide-y">
                        {folder.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 pl-12 hover:bg-muted/30"
                          >
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.created_at && format(parseISO(doc.created_at), "d. MMM yyyy", { locale: nb })}
                                {doc.source_type === "checklist" && " • Fra egenkontroll"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
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
    </div>
  );
}
