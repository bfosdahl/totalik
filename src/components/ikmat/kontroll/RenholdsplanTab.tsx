import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ClipboardCheck, Download, FileText, Trash2, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIkMatCleaningPlan } from "@/hooks/useIkMatCleaningPlan";
import { useCustomCleaningTasks } from "@/hooks/useCustomCleaningTasks";
import { FillCleaningPlanDialog } from "@/components/ikmat/FillCleaningPlanDialog";
import { EditCleaningTaskDialog } from "@/components/ikmat/EditCleaningTaskDialog";
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

export const RenholdsplanTab = () => {
  const { company } = useAuth();
  const { modules, isLoading } = useCompanyModules();
  const [cleaningPlan, setCleaningPlan] = useState<CleaningTask[]>([]);
  const { responses, isLoading: isLoadingResponses, createResponse, updateResponse, deleteResponse } = useIkMatCleaningPlan();
  const { tasks: customTasks, isLoading: customTasksLoading, createTask, updateTask, deleteTask } = useCustomCleaningTasks();
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.cleaningPlan) {
          setCleaningPlan(settings.generatedContent.cleaningPlan);
        }
      }
    }
  }, [isLoading, modules]);

  const allTasks = [...cleaningPlan, ...(customTasks || [])];

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

  const handleAddTask = () => {
    setEditingTask(null);
    setEditTaskDialogOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: {
    area: string;
    frequency: string;
    method: string;
    responsible: string;
  }) => {
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, ...taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne oppgaven?')) {
      await deleteTask.mutateAsync(id);
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cleaningPlan.length === 0 && (!customTasks || customTasks.length === 0)) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Legg til oppgave
          </Button>
        </div>
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Ingen renholdsplan funnet. Kjør IK/MAT oppsettet først eller legg til egne oppgaver.
          </AlertDescription>
        </Alert>
        <EditCleaningTaskDialog
          open={editTaskDialogOpen}
          onOpenChange={setEditTaskDialogOpen}
          task={editingTask}
          onSave={handleSaveTask}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="template">
        <TabsList>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAddTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til oppgave
                  </Button>
                  <Button onClick={handleStartCleaning}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Utfør renhold
                  </Button>
                </div>
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
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTasks.map((task, idx) => {
                    const isCustom = 'id' in task;
                    return (
                      <TableRow key={isCustom ? (task as any).id : idx}>
                        <TableCell className="font-medium">{task.area}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.frequency}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {task.method}
                        </TableCell>
                        <TableCell>{task.responsible}</TableCell>
                        <TableCell>
                          {isCustom && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTask(task)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask((task as any).id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                Ingen utført renhold ennå.
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

      <FillCleaningPlanDialog
        open={fillDialogOpen}
        onOpenChange={setFillDialogOpen}
        cleaningTasks={allTasks}
        existingResponse={editingResponse}
        onSave={handleSaveCleaningPlan}
      />

      <EditCleaningTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};
