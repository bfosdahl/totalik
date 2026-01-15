import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { 
  Clock, 
  MapPin, 
  User, 
  Star, 
  Calendar,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftDetailsDialogProps {
  schedule: WorkSchedule | null;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function ShiftDetailsDialog({ 
  schedule, 
  onClose, 
  onUpdate,
  onDelete,
  isAdmin = false 
}: ShiftDetailsDialogProps) {
  if (!schedule) return null;

  const location = schedule.location ? LOCATIONS[schedule.location] : null;

  return (
    <Dialog open={!!schedule} onOpenChange={(open) => !open && onClose()}>
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
                    onClose();
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
