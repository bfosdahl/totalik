import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileText, CheckSquare, Loader2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SimpleProjectTemplatesProps {
  projectId: string;
}

const CHECKLIST_CATEGORIES: Record<string, string> = {
  tomrerarbeid: "Tømrerarbeid",
  vatrom: "Våtrom",
  betong: "Betong",
  tak: "Tak",
  fasade: "Fasade",
  grunn: "Grunn og fundamenter",
  sluttkontroll: "Sluttkontroll",
  forprosjekt: "Førprosjekt",
  underentreprenor: "Underentreprenør",
  uk: "Uavhengig kontroll",
  general: "Generelt",
};

const ROUTINE_CATEGORIES: Record<string, string> = {
  kvalitetssikring: "Kvalitetssikring - Generelt",
  avvikshåndtering: "Avvikshåndtering",
  dokumentstyring: "Dokumentstyring",
  underentreprenor: "Underentreprenørkontroll",
  hms: "HMS på byggeplass",
  opplæring: "Opplæring",
  kontroll: "Kontroll",
  general: "Generelt",
};

const DOCUMENT_CATEGORIES: Record<string, string> = {
  checklist: "Sjekkliste-mal",
  form: "Skjema",
  routine: "Rutine",
  building_case: "Byggesak",
  contract: "Kontrakt",
  samsvar: "Samsvarserklæring",
  nabovarsel: "Nabovarsel",
  fdv: "FDV",
  other: "Annet",
};

export function SimpleProjectTemplates({ projectId }: SimpleProjectTemplatesProps) {
  const { checklistTemplates, routineTemplates, documents, isLoading, getDocumentUrl } = useAdminTemplatesForCustomers();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  // Group templates by category
  const groupedChecklists = checklistTemplates.reduce((acc, template) => {
    const category = template.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof checklistTemplates>);

  const groupedRoutines = routineTemplates.reduce((acc, template) => {
    const category = template.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof routineTemplates>);

  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = doc.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderCategorySection = (
    category: string,
    categoryLabel: string,
    items: any[],
    type: 'checklist' | 'routine' | 'document'
  ) => {
    const isExpanded = expandedCategories[`${type}-${category}`] ?? true;
    
    return (
      <Collapsible
        key={category}
        open={isExpanded}
        onOpenChange={() => toggleCategory(`${type}-${category}`)}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="font-medium flex-1">{categoryLabel}</span>
            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 mt-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {type === 'checklist' ? item.template_name : 
                   type === 'routine' ? item.routine_name : 
                   item.document_name}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{item.description}</p>
                )}
              </div>
              {type === 'document' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadDocument(item.file_path, item.document_name, item.id)}
                  disabled={downloadingId === item.id}
                >
                  {downloadingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  {type === 'checklist' ? 'Bruk' : 'Vis'}
                </Button>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

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
              <Badge variant="secondary" className="ml-1 hidden sm:inline">{checklistTemplates.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Rutiner</span>
              <Badge variant="secondary" className="ml-1 hidden sm:inline">{routineTemplates.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Dokumenter</span>
              <Badge variant="secondary" className="ml-1 hidden sm:inline">{documents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklists" className="space-y-3">
            {Object.keys(groupedChecklists).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen sjekkliste-maler tilgjengelig</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedChecklists)
                  .sort(([a], [b]) => (CHECKLIST_CATEGORIES[a] || a).localeCompare(CHECKLIST_CATEGORIES[b] || b))
                  .map(([category, items]) => 
                    renderCategorySection(
                      category,
                      CHECKLIST_CATEGORIES[category] || category,
                      items,
                      'checklist'
                    )
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routines" className="space-y-3">
            {Object.keys(groupedRoutines).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen rutine-maler tilgjengelig</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedRoutines)
                  .sort(([a], [b]) => (ROUTINE_CATEGORIES[a] || a).localeCompare(ROUTINE_CATEGORIES[b] || b))
                  .map(([category, items]) => 
                    renderCategorySection(
                      category,
                      ROUTINE_CATEGORIES[category] || category,
                      items,
                      'routine'
                    )
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            {Object.keys(groupedDocuments).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen dokumenter tilgjengelig</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedDocuments)
                  .sort(([a], [b]) => (DOCUMENT_CATEGORIES[a] || a).localeCompare(DOCUMENT_CATEGORIES[b] || b))
                  .map(([category, items]) => 
                    renderCategorySection(
                      category,
                      DOCUMENT_CATEGORIES[category] || category,
                      items,
                      'document'
                    )
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
