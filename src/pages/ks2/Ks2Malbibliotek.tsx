import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  FileText, 
  ClipboardList, 
  Download, 
  Eye,
  FolderOpen,
  File,
  FileImage,
  BookOpen,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAdminTemplatesForCustomers, AdminChecklistTemplate, AdminRoutineTemplate, AdminDocument } from "@/hooks/useAdminTemplatesForCustomers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

const ROUTINE_CATEGORIES: Record<string, string> = {
  kvalitetssikring: "Kvalitetssikring",
  avvikshåndtering: "Avvikshåndtering",
  dokumentstyring: "Dokumentstyring",
  underentreprenor: "Underentreprenørkontroll",
  hms: "HMS",
  opplæring: "Opplæring",
  kontroll: "Kontroll",
  general: "Generelt",
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
  if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (fileType.includes("image")) return <FileImage className="h-8 w-8 text-blue-500" />;
  if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-8 w-8 text-blue-600" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
};

export default function Ks2Malbibliotek() {
  const { checklistTemplates, routineTemplates, documents, isLoading } = useAdminTemplatesForCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChecklistCategory, setSelectedChecklistCategory] = useState<string>("all");
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>("all");
  const [selectedRoutineCategory, setSelectedRoutineCategory] = useState<string>("all");

  // Dialog states
  const [selectedChecklist, setSelectedChecklist] = useState<AdminChecklistTemplate | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<AdminRoutineTemplate | null>(null);

  // Filter checklist templates
  const filteredChecklists = checklistTemplates.filter(t => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedChecklistCategory === "all" || t.category === selectedChecklistCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter routine templates
  const filteredRoutines = routineTemplates.filter(r => {
    const matchesSearch = r.routine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedRoutineCategory === "all" || r.category === selectedRoutineCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedDocumentCategory === "all" || doc.category === selectedDocumentCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
      toast.success("Dokumentet åpnes i ny fane");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke laste ned dokumentet");
    }
  };

  // Get unique categories that exist in the data
  const checklistCategoriesInUse = [...new Set(checklistTemplates.map(t => t.category))];
  const routineCategoriesInUse = [...new Set(routineTemplates.map(r => r.category))];
  const documentCategoriesInUse = [...new Set(documents.map(d => d.category).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster malbibliotek...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Malbibliotek</h1>
        <p className="text-muted-foreground">
          Bla gjennom og bruk sjekkliste-maler, rutiner og dokumenter fra systemleverandøren
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter maler, rutiner og dokumenter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checklistTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Sjekkliste-maler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{routineTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Rutine-maler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FolderOpen className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Dokumenter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checklists" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklists" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Sjekkliste-maler</span>
            <span className="sm:hidden">Sjekklister</span>
          </TabsTrigger>
          <TabsTrigger value="routines" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Rutine-maler</span>
            <span className="sm:hidden">Rutiner</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumenter</span>
            <span className="sm:hidden">Dok.</span>
          </TabsTrigger>
        </TabsList>

        {/* Checklist Templates Tab */}
        <TabsContent value="checklists" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedChecklistCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChecklistCategory("all")}
            >
              Alle
            </Button>
            {checklistCategoriesInUse.map((cat) => (
              <Button
                key={cat}
                variant={selectedChecklistCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChecklistCategory(cat)}
              >
                {CHECKLIST_CATEGORIES[cat] || cat}
              </Button>
            ))}
          </div>

          {filteredChecklists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen sjekkliste-maler funnet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChecklists.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{template.template_name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary">
                              {CHECKLIST_CATEGORIES[template.category] || template.category}
                            </Badge>
                            {template.is_mandatory && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Obligatorisk
                              </Badge>
                            )}
                            {template.is_locked && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Låst
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {template.checkpoints?.length || 0} sjekkpunkter
                        </span>
                        {template.version && (
                          <span className="text-xs text-muted-foreground">
                            v{template.version}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setSelectedChecklist(template)}
                      >
                        <Eye className="h-3 w-3" />
                        Forhåndsvis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routine Templates Tab */}
        <TabsContent value="routines" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRoutineCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRoutineCategory("all")}
            >
              Alle
            </Button>
            {routineCategoriesInUse.map((cat) => (
              <Button
                key={cat}
                variant={selectedRoutineCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRoutineCategory(cat)}
              >
                {ROUTINE_CATEGORIES[cat] || cat}
              </Button>
            ))}
          </div>

          {filteredRoutines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen rutine-maler funnet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoutines.map((routine) => (
                <Card key={routine.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <BookOpen className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{routine.routine_name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary">
                              {ROUTINE_CATEGORIES[routine.category] || routine.category}
                            </Badge>
                            {routine.is_mandatory && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Obligatorisk
                              </Badge>
                            )}
                            {routine.is_locked && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Låst
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {routine.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {routine.file_path && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <FileText className="h-3 w-3" />
                            Dokument
                          </Badge>
                        )}
                        {routine.version && (
                          <span className="text-xs text-muted-foreground">
                            v{routine.version}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setSelectedRoutine(routine)}
                      >
                        <Eye className="h-3 w-3" />
                        Les rutine
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDocumentCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDocumentCategory("all")}
            >
              Alle
            </Button>
            {documentCategoriesInUse.map((cat) => (
              <Button
                key={cat}
                variant={selectedDocumentCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDocumentCategory(cat)}
              >
                {DOCUMENT_CATEGORIES[cat] || cat}
              </Button>
            ))}
          </div>

          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumenter funnet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{doc.document_name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.category && (
                            <Badge variant="secondary">
                              {DOCUMENT_CATEGORIES[doc.category] || doc.category}
                            </Badge>
                          )}
                          {doc.is_mandatory && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Obligatorisk
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                        </span>
                        {doc.version && (
                          <span className="text-xs text-muted-foreground">
                            v{doc.version}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-3 w-3" />
                        Last ned
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Checklist Preview Dialog */}
      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {selectedChecklist?.template_name}
            </DialogTitle>
            <DialogDescription>
              {selectedChecklist?.description || "Forhåndsvisning av sjekkliste-mal"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {CHECKLIST_CATEGORIES[selectedChecklist?.category || ""] || selectedChecklist?.category}
            </Badge>
            {selectedChecklist?.version && (
              <Badge variant="outline">v{selectedChecklist.version}</Badge>
            )}
            {selectedChecklist?.is_mandatory && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Obligatorisk
              </Badge>
            )}
            {selectedChecklist?.is_locked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Låst
              </Badge>
            )}
          </div>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">
                Sjekkpunkter ({selectedChecklist?.checkpoints?.length || 0})
              </h4>
              {selectedChecklist?.checkpoints?.map((checkpoint: any, index: number) => {
                // Handle different checkpoint structures
                const checkpointText = typeof checkpoint === 'string' 
                  ? checkpoint 
                  : checkpoint.checkpoint_text || checkpoint.text || checkpoint.title || '';
                const helpText = typeof checkpoint === 'object' 
                  ? (checkpoint.help_text || checkpoint.description || '') 
                  : '';

                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{checkpointText}</p>
                      {helpText && (
                        <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
                      )}
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                );
              })}
              {(!selectedChecklist?.checkpoints || selectedChecklist.checkpoints.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen sjekkpunkter definert
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedChecklist(null)}>
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routine Preview Dialog */}
      <Dialog open={!!selectedRoutine} onOpenChange={() => setSelectedRoutine(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              {selectedRoutine?.routine_name}
            </DialogTitle>
            <DialogDescription>
              {selectedRoutine?.description || "Forhåndsvisning av rutine"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {ROUTINE_CATEGORIES[selectedRoutine?.category || ""] || selectedRoutine?.category}
            </Badge>
            {selectedRoutine?.version && (
              <Badge variant="outline">v{selectedRoutine.version}</Badge>
            )}
            {selectedRoutine?.is_mandatory && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Obligatorisk
              </Badge>
            )}
            {selectedRoutine?.is_locked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Låst
              </Badge>
            )}
          </div>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="prose prose-sm max-w-none">
              {selectedRoutine?.content ? (
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedRoutine.content }}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen innhold definert for denne rutinen
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedRoutine(null)}>
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
