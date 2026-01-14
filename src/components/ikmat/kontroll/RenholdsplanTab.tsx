import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ClipboardCheck, Download, FileText, Trash2, Plus, Pencil, Calendar, CalendarDays, CalendarRange } from "lucide-react";
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

type FrequencyType = 'daily' | 'weekly' | 'monthly';

const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig/Periodisk',
};

const FREQUENCY_ICONS: Record<FrequencyType, typeof Calendar> = {
  daily: Calendar,
  weekly: CalendarDays,
  monthly: CalendarRange,
};

const normalizeFrequency = (freq: string): FrequencyType => {
  const lower = freq.toLowerCase();
  if (lower.includes('daglig') || lower.includes('daily') || lower.includes('hver dag')) {
    return 'daily';
  }
  if (lower.includes('ukentlig') || lower.includes('weekly') || lower.includes('hver uke')) {
    return 'weekly';
  }
  return 'monthly'; // månedlig, periodisk, etc.
};

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
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyType | null>(null);

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

  // Group tasks by frequency
  const tasksByFrequency = useMemo(() => {
    const grouped: Record<FrequencyType, CleaningTask[]> = {
      daily: [],
      weekly: [],
      monthly: [],
    };

    allTasks.forEach(task => {
      const freq = normalizeFrequency(task.frequency);
      grouped[freq].push(task);
    });

    return grouped;
  }, [allTasks]);

  const handleStartCleaning = (frequency: FrequencyType) => {
    setEditingResponse(null);
    setSelectedFrequency(frequency);
    setFillDialogOpen(true);
  };

  const handleEditResponse = (response: any) => {
    setEditingResponse(response);
    setSelectedFrequency(null); // Show all tasks when viewing existing response
    setFillDialogOpen(true);
  };

  const handleSaveCleaningPlan = async (data: {
    cleaning_records: any[];
    notes?: string;
    status: string;
    frequency_type?: string;
  }) => {
    if (editingResponse) {
      await updateResponse.mutateAsync({
        id: editingResponse.id,
        ...data,
      });
    } else {
      await createResponse.mutateAsync({
        ...data,
        frequency_type: selectedFrequency || undefined,
      });
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
        frequencyType: response.frequency_type,
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

  // Get tasks for the dialog based on selected frequency
  const getTasksForDialog = () => {
    if (editingResponse) {
      return allTasks;
    }
    if (selectedFrequency) {
      return tasksByFrequency[selectedFrequency];
    }
    return allTasks;
  };

  const getFrequencyLabel = (freqType: string | null | undefined): string => {
    if (!freqType) return '';
    return FREQUENCY_LABELS[freqType as FrequencyType] || freqType;
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

  const renderTaskTable = (tasks: CleaningTask[], frequency: FrequencyType) => {
    const Icon = FREQUENCY_ICONS[frequency];
    
    if (tasks.length === 0) {
      return null;
    }

    return (
      <Card key={frequency}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{FREQUENCY_LABELS[frequency]} renhold</CardTitle>
                <CardDescription>{tasks.length} oppgave{tasks.length !== 1 ? 'r' : ''}</CardDescription>
              </div>
            </div>
            <Button onClick={() => handleStartCleaning(frequency)}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Utfør {FREQUENCY_LABELS[frequency].toLowerCase()} renhold
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Område</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Ansvarlig</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task, idx) => {
                const isCustom = 'id' in task;
                return (
                  <TableRow key={isCustom ? (task as any).id : `${frequency}-${idx}`}>
                    <TableCell className="font-medium">{task.area}</TableCell>
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
    );
  };

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
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til oppgave
            </Button>
          </div>

          <div className="space-y-4">
            {renderTaskTable(tasksByFrequency.daily, 'daily')}
            {renderTaskTable(tasksByFrequency.weekly, 'weekly')}
            {renderTaskTable(tasksByFrequency.monthly, 'monthly')}
          </div>
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
                              {response.frequency_type 
                                ? `${getFrequencyLabel(response.frequency_type)} renhold`
                                : 'Renhold'
                              } - {format(new Date(response.completed_at || response.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
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
                            {response.frequency_type && (
                              <Badge variant="outline">
                                {getFrequencyLabel(response.frequency_type)}
                              </Badge>
                            )}
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
        cleaningTasks={getTasksForDialog()}
        existingResponse={editingResponse}
        onSave={handleSaveCleaningPlan}
        frequencyType={selectedFrequency}
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
