import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ClipboardCheck, Download, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIkMatCleaningPlan } from "@/hooks/useIkMatCleaningPlan";
import { FillCleaningPlanDialog } from "@/components/ikmat/FillCleaningPlanDialog";
import { generateCleaningPlanPdf } from "@/utils/ikMatCleaningPlanPdf";
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { toast } from 'sonner';

interface CleaningTask {
  area: string;
  frequency: string;
  method: string;
  responsible: string;
}

const IkMatRenholdsplan = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [cleaningPlan, setCleaningPlan] = useState<CleaningTask[]>([]);
  const { responses, isLoading: isLoadingResponses, createResponse, updateResponse, deleteResponse } = useIkMatCleaningPlan();
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent generert renholdsplan fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.cleaningPlan) {
          setCleaningPlan(settings.generatedContent.cleaningPlan);
        }
      }
    }
  }, [hasModule, isLoading, navigate, modules]);

  const handleStartCleaning = () => {
    setEditingResponse(null);
    setFillDialogOpen(true);
  };

  const handleEditResponse = (response: any) => {
    setEditingResponse(response);
    setFillDialogOpen(true);
  };

  const handleSaveCleaningPlan = async (data: {
    cleaning_records: any[];
    notes?: string;
    status: string;
  }) => {
    if (editingResponse) {
      await updateResponse.mutateAsync({
        id: editingResponse.id,
        ...data,
      });
    } else {
      await createResponse.mutateAsync(data);
    }
  };

  const handleDownloadPdf = async (response: any) => {
    try {
      await generateCleaningPlanPdf({
        completedByName: response.completed_by_name,
        completedAt: response.completed_at || response.created_at,
        status: response.status,
        cleaningRecords: response.cleaning_records,
        notes: response.notes,
        companyName: company?.name,
      });
      toast.success('PDF lastet ned');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Kunne ikke generere PDF');
    }
  };

  const handleDeleteResponse = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne renholdsplanen?')) {
      await deleteResponse.mutateAsync(id);
    }
  };

  if (isLoading || isLoadingResponses) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Renholdsplan</h1>
          <p className="text-muted-foreground">
            Systematisk renhold og hygiene for matsikkerhet
          </p>
        </div>

        {cleaningPlan.length === 0 ? (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Ingen renholdsplan funnet. Kjør IK/MAT oppsettet først for å generere en skreddersydd renholdsplan.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="template">Renholdsplan</TabsTrigger>
              <TabsTrigger value="history">
                Historikk ({responses?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Renholdsplan for {company?.name}</CardTitle>
                      <CardDescription>
                        Oversikt over alle renholdsoppgaver og ansvar
                      </CardDescription>
                    </div>
                    <Button onClick={handleStartCleaning}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Utfør renhold
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Område</TableHead>
                        <TableHead>Frekvens</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Ansvarlig</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cleaningPlan.map((task, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{task.area}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.frequency}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{task.method}</TableCell>
                          <TableCell>{task.responsible}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {!responses || responses.length === 0 ? (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Ingen utført renhold ennå. Start ved å klikke "Utfør renhold" under Renholdsplan-fanen.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => {
                    const completedCount = response.cleaning_records.filter(
                      (r: any) => r.completed
                    ).length;
                    const totalCount = response.cleaning_records.length;

                    return (
                      <Card key={response.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">
                                  Renhold utført {format(new Date(response.completed_at || response.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                                </CardTitle>
                                <Badge
                                  variant={
                                    response.status === 'completed'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {response.status === 'completed'
                                    ? 'Fullført'
                                    : 'Utkast'}
                                </Badge>
                              </div>
                              <CardDescription>
                                Utført av {response.completed_by_name} • {completedCount} av {totalCount} oppgaver fullført
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResponse(response)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Se detaljer
                              </Button>
                              {response.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPdf(response)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteResponse(response.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <FillCleaningPlanDialog
          open={fillDialogOpen}
          onOpenChange={setFillDialogOpen}
          cleaningTasks={cleaningPlan}
          existingResponse={editingResponse}
          onSave={handleSaveCleaningPlan}
        />
      </div>
    </AppLayout>
  );
};

export default IkMatRenholdsplan;
