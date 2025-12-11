import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileText, CheckSquare, Loader2 } from "lucide-react";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SimpleProjectTemplatesProps {
  projectId: string;
}

export function SimpleProjectTemplates({ projectId }: SimpleProjectTemplatesProps) {
  const { checklistTemplates, routineTemplates, documents, isLoading, getDocumentUrl } = useAdminTemplatesForCustomers();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadDocument = async (filePath: string, fileName: string, docId: string) => {
    try {
      setDownloadingId(docId);
      const url = await getDocumentUrl(filePath);
      if (url) {
        window.open(url, "_blank");
        toast.success("Dokument åpnet");
      } else {
        toast.error("Kunne ikke hente dokument");
      }
    } catch (error) {
      toast.error("Kunne ikke laste ned dokument");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Malbank
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="checklists" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklists" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Sjekklister</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Rutiner</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Dokumenter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklists" className="space-y-3">
            {checklistTemplates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen sjekkliste-maler tilgjengelig</p>
            ) : (
              <div className="grid gap-3">
                {checklistTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{template.template_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                        {template.description && (
                          <span className="text-xs text-muted-foreground truncate">{template.description}</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Bruk
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routines" className="space-y-3">
            {routineTemplates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen rutine-maler tilgjengelig</p>
            ) : (
              <div className="grid gap-3">
                {routineTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{template.routine_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                        {template.description && (
                          <span className="text-xs text-muted-foreground truncate">{template.description}</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Vis
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen dokumenter tilgjengelig</p>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.document_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.category && <Badge variant="secondary" className="text-xs">{doc.category}</Badge>}
                        {doc.description && (
                          <span className="text-xs text-muted-foreground truncate">{doc.description}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.file_path, doc.document_name, doc.id)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
