import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  SprayCan, 
  Thermometer, 
  ClipboardCheck,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { useIkMatScheduledTasks, ScheduledTask, CalendarEvent } from "@/hooks/useIkMatScheduledTasks";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { useCustomCleaningTasks } from "@/hooks/useCustomCleaningTasks";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EQUIPMENT_TYPE_DEFAULTS } from "@/lib/temperatureGuidelines";
import { t } from "@/i18n/t";

interface TaskListViewProps {
  tasks: ScheduledTask[];
  onCreateTask: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  monthly: 'Månedlig',
  periodisk: 'Periodisk',
};

const TASK_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  cleaning: { label: 'Renhold', icon: <SprayCan className="h-4 w-4" /> },
  temperature: { label: 'Temperatur', icon: <Thermometer className="h-4 w-4" /> },
  inspection: { label: 'Inspeksjon', icon: <ClipboardCheck className="h-4 w-4" /> },
  other: { label: 'Annet', icon: <MoreHorizontal className="h-4 w-4" /> },
};

const DAYS_OF_WEEK_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

export const TaskListView = ({ tasks, onCreateTask }: TaskListViewProps) => {
  const navigate = useNavigate();
  const { deleteTask } = useIkMatScheduledTasks();
  const { equipment } = useIkMatTemperature();
  const { tasks: cleaningTasks } = useCustomCleaningTasks();
  const { modules } = useCompanyModules();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ScheduledTask | null>(null);

  // Get generated cleaning plan from module settings
  const generatedCleaningPlan = (() => {
    const ikMatModule = modules?.find(m => m.module_type === 'IK_MAT');
    if (ikMatModule?.settings) {
      const settings = ikMatModule.settings as any;
      return settings.generatedContent?.cleaningPlan || [];
    }
    return [];
  })();

  const allCleaningTasks = [...(cleaningTasks || []), ...generatedCleaningPlan];

  // Group scheduled tasks by frequency
  const dailyTasks = tasks.filter(t => t.frequency === 'daily');
  const weeklyTasks = tasks.filter(t => t.frequency === 'weekly');
  const monthlyTasks = tasks.filter(t => t.frequency === 'monthly' || t.frequency === 'periodisk');

  const handleDeleteClick = (task: ScheduledTask) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete.id);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const getScheduleDescription = (task: ScheduledTask) => {
    if (task.frequency === 'daily') return 'Hver dag';
    if (task.frequency === 'weekly' && task.day_of_week) {
      const days = task.day_of_week.map(d => DAYS_OF_WEEK_SHORT[d]).join(', ');
      return `Hver ${days}`;
    }
    if ((task.frequency === 'monthly' || task.frequency === 'periodisk') && task.day_of_month) {
      return `Den ${task.day_of_month.join(', ')}. hver måned`;
    }
    return FREQUENCY_LABELS[task.frequency];
  };

  const renderScheduledTaskCard = (task: ScheduledTask) => {
    const typeInfo = TASK_TYPE_LABELS[task.task_type] || TASK_TYPE_LABELS.other;
    return (
      <div key={task.id} className="p-3 rounded-lg border bg-card">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {typeInfo.icon}
              <p className="font-medium text-sm">{task.title}</p>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getScheduleDescription(task)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => handleDeleteClick(task)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  const hasAnyContent = tasks.length > 0 || (equipment && equipment.length > 0) || allCleaningTasks.length > 0;

  if (!hasAnyContent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("auto.ingen_planlagte_oppgaver")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("auto.opprett_oppgaver_for_daglig_ukentlig_ell")}
          </p>
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            {t("auto.opprett_foerste_oppgave")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Temperature Equipment - Auto-generated tasks */}
      {equipment && equipment.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              Temperaturlogging
            </CardTitle>
            <CardDescription>
              {t("auto.automatisk_generert_fra_registrert_utsty")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {equipment.map((equip) => {
              const typeLabel = EQUIPMENT_TYPE_DEFAULTS[equip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equip.equipment_type;
              const freqLabel = equip.measurement_frequency === 'daily' ? 'Daglig' : 
                                equip.measurement_frequency === 'twice_daily' ? '2x daglig' :
                                equip.measurement_frequency === 'monthly' ? 'Månedlig' :
                                equip.measurement_frequency === 'on_demand' ? 'Ved behov' : 'Ukentlig';
              return (
                <div key={equip.id} role="button" tabIndex={0} onClick={() => navigate('/ik-mat/kontroll?tab=temperatur')} className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{equip.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel} • {freqLabel} • {equip.min_temp}°C – {equip.max_temp}°C
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{freqLabel}</Badge>
                  </div>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/ik-mat/kontroll?tab=temperatur')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Administrer utstyr
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cleaning Tasks - Auto-generated */}
      {allCleaningTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <SprayCan className="h-5 w-5 text-green-500" />
              Renholdsoppgaver
            </CardTitle>
            <CardDescription>
              Fra renholdsplanen ({allCleaningTasks.length} oppgaver)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Group by frequency */}
            {['daglig', 'ukentlig', 'månedlig'].map((freq) => {
              const tasksForFreq = allCleaningTasks.filter((t: any) => 
                (t.frequency || 'daglig').toLowerCase() === freq
              );
              if (tasksForFreq.length === 0) return null;
              
              return (
                <div key={freq} role="button" tabIndex={0} onClick={() => navigate('/ik-mat/kontroll?tab=renholdsplan')} className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{freq} renhold</p>
                      <p className="text-xs text-muted-foreground">
                        {tasksForFreq.length} oppgaver
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">{freq}</Badge>
                  </div>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/ik-mat/kontroll?tab=renholdsplan')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Se renholdsplan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manually Created Scheduled Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-orange-500" />
              Egendefinerte oppgaver
            </CardTitle>
            <CardDescription>
              {t("auto.manuelt_opprettede_planlagte_oppgaver")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dailyTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("auto.daglig")}</p>
                {dailyTasks.map(renderScheduledTaskCard)}
              </div>
            )}
            {weeklyTasks.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("auto.ukentlig")}</p>
                {weeklyTasks.map(renderScheduledTaskCard)}
              </div>
            )}
            {monthlyTasks.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("auto.maanedlig")}</p>
                {monthlyTasks.map(renderScheduledTaskCard)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add task button */}
      <Button onClick={onCreateTask} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {t("auto.legg_til_ny_oppgave")}
      </Button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auto.slett_oppgave")}</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{taskToDelete?.title}"? 
              Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t("auto.slett")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
