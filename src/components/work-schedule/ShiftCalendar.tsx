import { useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Star, Clock, Briefcase } from "lucide-react";
import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { t } from "@/i18n/t";
import { LOCATIONS, ROLES, getLocationOption, getRoleLabel } from "./shiftOptions";

interface ShiftCalendarProps {
  selectedWeek: Date;
  schedules: WorkSchedule[];
  onScheduleClick?: (schedule: WorkSchedule) => void;
}


export function ShiftCalendar({ selectedWeek, schedules, onScheduleClick }: ShiftCalendarProps) {
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
    <>
    {/* Mobile: readable day-by-day list */}
    <div className="sm:hidden space-y-3">
      {weekDays.map((day, index) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const daySchedules = schedulesByDay[dayStr] || [];
        return (
          <div
            key={index}
            className={cn(
              "bg-card rounded-lg border overflow-hidden",
              isToday(day) && "border-primary"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 border-b bg-muted/40",
                isToday(day) && "bg-primary/10"
              )}
            >
              <span className="text-sm font-semibold capitalize">
                {format(day, "EEEE d. MMMM", { locale: nb })}
              </span>
              <span className="text-xs text-muted-foreground">
                {daySchedules.length > 0 ? `${daySchedules.length} vakt${daySchedules.length > 1 ? "er" : ""}` : "Ingen vakter"}
              </span>
            </div>
            {daySchedules.length > 0 && (
              <div className="divide-y">
                {daySchedules.map((schedule) => {
                  const location = getLocationOption(schedule.location);
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => onScheduleClick?.(schedule)}
                      className="w-full text-left px-3 py-2.5 active:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {schedule.employee_name}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {schedule.start_time.substring(0, 5)}–{schedule.end_time.substring(0, 5)}
                        </span>
                      </div>
                      {schedule.project_name && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm">
                          <Briefcase className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{schedule.project_name}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {location && (
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", location.color)}>
                            <MapPin className="w-2.5 h-2.5 mr-0.5" />
                            {location.label}
                          </Badge>
                        )}
                        {schedule.shift_role && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {getRoleLabel(schedule.shift_role)}
                          </Badge>
                        )}
                        {schedule.is_responsible && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div className="hidden sm:block bg-card rounded-lg border overflow-hidden">
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
                const location = getLocationOption(schedule.location);
                
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

                    {/* Project */}
                    {schedule.project_name && (
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                        <Briefcase className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{schedule.project_name}</span>
                      </div>
                    )}

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
                          {getRoleLabel(schedule.shift_role)}
                        </Badge>
                      )}
                    </div>

                    {/* Indicators */}
                    {schedule.is_responsible && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
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
