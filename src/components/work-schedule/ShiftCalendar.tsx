import { useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Star, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { WorkSchedule } from "@/hooks/useWorkSchedules";

interface ShiftCalendarProps {
  selectedWeek: Date;
  schedules: WorkSchedule[];
  onScheduleClick?: (schedule: WorkSchedule) => void;
  tasksMap?: Record<string, { total: number; completed: number }>;
}

const LOCATIONS: Record<string, { label: string; color: string }> = {
  kitchen: { label: "Kjøkken", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  service: { label: "Servering", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  takeaway: { label: "Gatekjøkken", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  storage: { label: "Lager", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  office: { label: "Kontor", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

const ROLES: Record<string, string> = {
  chef: "Kokk",
  shift_leader: "Skiftleder",
  server: "Servitør",
  cleaner: "Renholder",
  cashier: "Kasserer",
  prep: "Forberedelse",
};

export function ShiftCalendar({ selectedWeek, schedules, onScheduleClick, tasksMap = {} }: ShiftCalendarProps) {
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));
  }, [selectedWeek]);

  const schedulesByDay = useMemo(() => {
    const map: Record<string, WorkSchedule[]> = {};
    weekDays.forEach(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      map[dayStr] = schedules.filter(s => s.schedule_date === dayStr);
    });
    return map;
  }, [schedules, weekDays]);

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "p-2 sm:p-3 text-center border-r last:border-r-0",
              isToday(day) && "bg-primary/10"
            )}
          >
            <div className="text-xs text-muted-foreground hidden sm:block">
              {format(day, "EEEE", { locale: nb })}
            </div>
            <div className="text-xs text-muted-foreground sm:hidden">
              {format(day, "EEE", { locale: nb })}
            </div>
            <div className={cn(
              "text-sm sm:text-lg font-semibold",
              isToday(day) && "text-primary"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-7 min-h-[300px] sm:min-h-[400px]">
        {weekDays.map((day, index) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const daySchedules = schedulesByDay[dayStr] || [];
          
          return (
            <div
              key={index}
              className={cn(
                "border-r last:border-r-0 p-1 sm:p-2 space-y-1 sm:space-y-2",
                isToday(day) && "bg-primary/5"
              )}
            >
              {daySchedules.map((schedule) => {
                const taskInfo = tasksMap[schedule.id];
                const hasOpenTasks = taskInfo && taskInfo.completed < taskInfo.total;
                const location = schedule.location ? LOCATIONS[schedule.location] : null;
                
                return (
                  <div
                    key={schedule.id}
                    onClick={() => onScheduleClick?.(schedule)}
                    className={cn(
                      "p-1.5 sm:p-2 rounded-md text-xs cursor-pointer transition-all hover:shadow-md",
                      schedule.schedule_type === "planned" 
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800" 
                        : "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                    )}
                  >
                    {/* Employee name */}
                    <div className="font-medium truncate text-[10px] sm:text-xs">
                      {schedule.employee_name.split(" ")[0]}
                    </div>
                    
                    {/* Time */}
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="text-[9px] sm:text-[10px]">
                        {schedule.start_time.substring(0, 5)}-{schedule.end_time.substring(0, 5)}
                      </span>
                    </div>

                    {/* Location & Role - hidden on very small screens */}
                    <div className="hidden sm:flex flex-wrap gap-1 mt-1">
                      {location && (
                        <Badge variant="secondary" className={cn("text-[9px] px-1 py-0", location.color)}>
                          <MapPin className="w-2 h-2 mr-0.5" />
                          {location.label}
                        </Badge>
                      )}
                      {schedule.shift_role && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {ROLES[schedule.shift_role] || schedule.shift_role}
                        </Badge>
                      )}
                    </div>

                    {/* Indicators */}
                    <div className="flex items-center gap-1 mt-1">
                      {schedule.is_responsible && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                      {taskInfo && (
                        hasOpenTasks ? (
                          <div className="flex items-center gap-0.5 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[9px]">{taskInfo.total - taskInfo.completed}</span>
                          </div>
                        ) : taskInfo.total > 0 && (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
              
              {daySchedules.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
                  -
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { LOCATIONS, ROLES };
