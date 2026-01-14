import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  SprayCan, 
  Thermometer, 
  ClipboardCheck,
  MoreHorizontal
} from "lucide-react";
import { useIkMatScheduledTasks, ScheduledTask } from "@/hooks/useIkMatScheduledTasks";
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
  const { deleteTask } = useIkMatScheduledTasks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ScheduledTask | null>(null);

  // Group tasks by frequency
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

  const renderTaskTable = (taskList: ScheduledTask[], title: string, description: string) => {
    if (taskList.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oppgave</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tidspunkt</TableHead>
                <TableHead>Ansvarlig</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task) => {
                const typeInfo = TASK_TYPE_LABELS[task.task_type] || TASK_TYPE_LABELS.other;
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {typeInfo.icon}
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getScheduleDescription(task)}
                    </TableCell>
                    <TableCell>{task.responsible || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Ingen planlagte oppgaver</h3>
          <p className="text-muted-foreground mb-4">
            Opprett oppgaver for daglig, ukentlig eller månedlig renhold og andre gjøremål
          </p>
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Opprett første oppgave
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderTaskTable(dailyTasks, 'Daglige oppgaver', 'Oppgaver som utføres hver dag')}
      {renderTaskTable(weeklyTasks, 'Ukentlige oppgaver', 'Oppgaver som utføres på bestemte ukedager')}
      {renderTaskTable(monthlyTasks, 'Månedlige / Periodiske oppgaver', 'Oppgaver som utføres på bestemte datoer')}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett oppgave?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{taskToDelete?.title}"? 
              Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
