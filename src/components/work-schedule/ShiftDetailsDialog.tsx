import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { useShiftTasks, DEFAULT_SHIFT_TASKS, ShiftTask } from "@/hooks/useShiftTasks";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { 
  Clock, 
  MapPin, 
  User, 
  Star, 
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftDetailsDialogProps {
  schedule: WorkSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ShiftDetailsDialog({ 
  schedule, 
  open, 
  onOpenChange, 
  onDelete,
  isAdmin = false 
}: ShiftDetailsDialogProps) {
  const { tasks, isLoading, createMultipleTasks, completeTask, deleteTask } = useShiftTasks(schedule?.id);
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  const handleAddDefaultTasks = async () => {
    setIsAddingTasks(true);
    // Filter out tasks that already exist
    const existingNames = tasks.map(t => t.task_name);
    const newTasks = DEFAULT_SHIFT_TASKS.filter(t => !existingNames.includes(t.name));
    
    if (newTasks.length > 0) {
      await createMultipleTasks(newTasks);
    }
    setIsAddingTasks(false);
  };

  if (!schedule) return null;

  const location = schedule.location ? LOCATIONS[schedule.location] : null;
  const completedTasks = tasks.filter(t => t.is_completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {schedule.employee_name}
            {schedule.is_responsible && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Schedule info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(schedule.schedule_date), "EEEE d. MMMM", { locale: nb })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
            </div>
          </div>

          {/* Location & Role badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={schedule.schedule_type === "planned" ? "default" : "secondary"}>
              {schedule.schedule_type === "planned" ? "Planlagt" : "Faktisk"}
            </Badge>
            {location && (
              <Badge variant="outline" className={cn("gap-1", location.color)}>
                <MapPin className="w-3 h-3" />
                {location.label}
              </Badge>
            )}
            {schedule.shift_role && (
              <Badge variant="outline">
                {ROLES[schedule.shift_role] || schedule.shift_role}
              </Badge>
            )}
            {schedule.is_responsible && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Star className="w-3 h-3 mr-1" />
                Ansvarsvakt
              </Badge>
            )}
          </div>

          {/* Notes */}
          {schedule.notes && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <span className="text-muted-foreground">Notater:</span>
              <p className="mt-1">{schedule.notes}</p>
            </div>
          )}

          <Separator />

          {/* Tasks section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Oppgaver ({completedTasks}/{tasks.length})</h4>
              {isAdmin && tasks.length === 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddDefaultTasks}
                  disabled={isAddingTasks}
                >
                  {isAddingTasks ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  Legg til standardoppgaver
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen oppgaver på denne vakten
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {tasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => completeTask(task.id)}
                      onDelete={isAdmin ? () => deleteTask(task.id) : undefined}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          {isAdmin && onDelete && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    onDelete(schedule.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Slett vakt
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskItem({ 
  task, 
  onToggle, 
  onDelete 
}: { 
  task: ShiftTask; 
  onToggle: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-2 rounded-lg border transition-colors",
      task.is_completed ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-card"
    )}>
      <Checkbox 
        checked={task.is_completed} 
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          task.is_completed && "line-through text-muted-foreground"
        )}>
          {task.task_name}
        </p>
        {task.is_completed && task.completed_by_name && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Utført av {task.completed_by_name}
            {task.completed_at && (
              <span> kl. {format(new Date(task.completed_at), "HH:mm")}</span>
            )}
          </p>
        )}
      </div>
      {onDelete && !task.is_completed && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
