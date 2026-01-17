import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ClipboardList, PlayCircle, History, Trash2, Check, X, Minus, Download, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIkMatChecklistResponses } from "@/hooks/useIkMatChecklistResponses";
import { useCustomChecklists } from "@/hooks/useCustomChecklists";
import { FillChecklistDialog } from "@/components/ikmat/FillChecklistDialog";
import { CreateChecklistDialog } from "@/components/ikmat/CreateChecklistDialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generateChecklistPdf } from "@/utils/ikMatChecklistPdf";
import { toast } from "sonner";

interface Checklist {
  id: string;
  name: string;
  description: string;
  checkpoints: string[];
}

export const SjekklisterTab = () => {
  const { company } = useAuth();
  const { modules, isLoading } = useCompanyModules();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);
  const { responses, isLoading: responsesLoading, createResponse, updateResponse, deleteResponse } = useIkMatChecklistResponses();
  const { checklists: customChecklists, isLoading: customChecklistsLoading, createChecklist, deleteChecklist } = useCustomChecklists();

  useEffect(() => {
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.checklists) {
          setChecklists(settings.generatedContent.checklists);
        }
      }
    }
  }, [isLoading, modules]);

  const allChecklists = [
    ...checklists,
    ...(customChecklists || []).map(c => ({
      id: c.id,
      name: c.checklist_name,
      description: c.description || '',
      checkpoints: c.checkpoints
    }))
  ];

  const handleStartChecklist = async (checklist: Checklist) => {
    const response = await createResponse(checklist.id, checklist.name, checklist.checkpoints);
    if (response) {
      setSelectedChecklist(checklist);
      setEditingResponse(response);
      setFillDialogOpen(true);
    }
  };

  const handleEditResponse = (response: any, checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setEditingResponse(response);
    setFillDialogOpen(true);
  };

  const handleSaveChecklist = async (
    checkpointResponses: any[],
    status: 'draft' | 'completed',
    notes?: string
  ) => {
    if (!editingResponse) return false;
    return await updateResponse(editingResponse.id, checkpointResponses, status, notes);
  };

  const handleCreateChecklist = async (data: {
    checklist_name: string;
    description?: string;
    checkpoints: string[];
  }) => {
    await createChecklist.mutateAsync(data);
  };

  const handleDeleteCustomChecklist = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne sjekklisten?')) {
      await deleteChecklist.mutateAsync(id);
    }
  };

  const getResponsesForChecklist = (checklistId: string) => {
    return responses.filter(r => r.checklist_type === checklistId);
  };

  const handleDownloadPdf = async (response: any) => {
    try {
      await generateChecklistPdf({
        checklistName: response.checklist_name,
        completedByName: response.completed_by_name,
        completedAt: response.completed_at,
        status: response.status,
        responses: response.responses,
        notes: response.notes,
        companyName: company?.name
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Kunne ikke generere PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (checklists.length === 0 && (!customChecklists || customChecklists.length === 0)) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Opprett sjekkliste
          </Button>
        </div>
        <Alert>
          <ClipboardList className="h-4 w-4" />
          <AlertDescription>
            Ingen sjekklister funnet. Kjør IK/MAT oppsettet først eller opprett egne sjekklister.
          </AlertDescription>
        </Alert>
        <CreateChecklistDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSave={handleCreateChecklist}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tilgjengelige
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historikk ({responses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end mb-3 sm:mb-4">
            <Button size="sm" className="sm:size-default" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Opprett</span> sjekkliste
            </Button>
          </div>
          
          <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {allChecklists.map((checklist) => {
              const checklistResponses = getResponsesForChecklist(checklist.id);
              const isCustom = customChecklists?.some(c => c.id === checklist.id);
              
              return (
                <Card key={checklist.id} className="flex flex-col">
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <CardTitle className="text-base sm:text-lg truncate">{checklist.name}</CardTitle>
                          {isCustom && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">Tilpasset</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm line-clamp-2">{checklist.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {checklist.checkpoints?.length || 0}
                        </Badge>
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteCustomChecklist(checklist.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2 flex-1">
                      {checklist.checkpoints?.slice(0, 2).map((point, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground line-clamp-1">{point}</span>
                        </div>
                      ))}
                      {checklist.checkpoints?.length > 2 && (
                        <p className="text-xs sm:text-sm text-muted-foreground italic">
                          +{checklist.checkpoints.length - 2} flere
                        </p>
                      )}
                    </div>

                    {checklistResponses.length > 0 && (
                      <div className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">
                        Utfylt {checklistResponses.length}x
                      </div>
                    )}

                    <Button 
                      className="w-full gap-1.5 mt-3 sm:mt-4" 
                      size="sm"
                      onClick={() => handleStartChecklist(checklist)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {responsesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            </div>
          ) : responses.length === 0 ? (
            <Alert>
              <History className="h-4 w-4" />
              <AlertDescription>
                Ingen utfylte sjekklister ennå.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {responses.map((response) => {
                const checklist = allChecklists.find(c => c.id === response.checklist_type);
                const displayChecklist = checklist || {
                  id: response.checklist_type,
                  name: response.checklist_name,
                  description: '',
                  checkpoints: response.responses.map(r => r.checkpoint)
                };

                const okCount = response.responses.filter(r => r.status === 'ok').length;
                const notOkCount = response.responses.filter(r => r.status === 'not_ok').length;
                const total = response.responses.length;

                return (
                  <Card key={response.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{response.checklist_name}</CardTitle>
                          <CardDescription className="mt-1">
                            Utfylt av {response.completed_by_name} • {format(new Date(response.completed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                          </CardDescription>
                        </div>
                        <Badge variant={response.status === 'completed' ? 'default' : 'secondary'}>
                          {response.status === 'completed' ? 'Fullført' : 'Utkast'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Check className="h-4 w-4 text-success" />
                          <span>{okCount} OK</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <X className="h-4 w-4 text-destructive" />
                          <span>{notOkCount} Ikke OK</span>
                        </div>
                        <div className="text-muted-foreground">
                          {total} totalt
                        </div>
                      </div>

                      {response.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notater:</span>
                          <p className="text-muted-foreground mt-1">{response.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => handleEditResponse(response, displayChecklist)}
                        >
                          <FileText className="h-4 w-4" />
                          Se detaljer
                        </Button>
                        {response.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownloadPdf(response)}
                            title="Last ned PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteResponse(response.id)}
                          title="Slett"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedChecklist && (
        <FillChecklistDialog
          open={fillDialogOpen}
          onOpenChange={setFillDialogOpen}
          checklistName={selectedChecklist.name}
          checkpoints={selectedChecklist.checkpoints}
          existingResponses={editingResponse?.responses}
          onSave={handleSaveChecklist}
        />
      )}

      <CreateChecklistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateChecklist}
      />
    </div>
  );
};
