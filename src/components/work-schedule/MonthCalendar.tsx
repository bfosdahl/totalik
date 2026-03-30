import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { nb } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { LOCATIONS, ROLES } from "./ShiftCalendar";

interface MonthCalendarProps {
  selectedMonth: Date;
  schedules: WorkSchedule[];
  onScheduleClick?: (schedule: WorkSchedule) => void;
  onDayClick?: (date: Date) => void;
}

export function MonthCalendar({ selectedMonth, schedules, onScheduleClick, onDayClick }: MonthCalendarProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let current = calStart;
    while (current <= calEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [selectedMonth]);

  const schedulesByDay = useMemo(() => {
    const map: Record<string, WorkSchedule[]> = {};
    schedules.forEach(s => {
      if (!map[s.schedule_date]) map[s.schedule_date] = [];
      map[s.schedule_date].push(s);
    });
    return map;
  }, [schedules]);

  const weekDayHeaders = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {weekDayHeaders.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const daySchedules = schedulesByDay[dayStr] || [];
          const inMonth = isSameMonth(day, selectedMonth);
          const today = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                "border-b border-r min-h-[80px] sm:min-h-[110px] p-1",
                !inMonth && "bg-muted/30",
                today && "bg-primary/5"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1 text-right pr-1",
                !inMonth && "text-muted-foreground/50",
                today && "text-primary font-bold"
              )}>
                {format(day, "d")}
              </div>

              <div className="space-y-0.5 overflow-y-auto max-h-[60px] sm:max-h-[90px]">
                {daySchedules.map((schedule) => {
                  const location = schedule.location ? LOCATIONS[schedule.location] : null;
                  return (
                    <div
                      key={schedule.id}
                      onClick={() => onScheduleClick?.(schedule)}
                      className={cn(
                        "px-1 py-0.5 rounded text-[9px] sm:text-[10px] cursor-pointer truncate transition-all hover:shadow-sm",
                        schedule.schedule_type === "planned"
                          ? "bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                          : "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                      )}
                    >
                      <div className="font-medium truncate">{schedule.employee_name.split(" ")[0]}</div>
                      <div className="text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2 h-2 shrink-0" />
                        {schedule.start_time.substring(0, 5)}-{schedule.end_time.substring(0, 5)}
                      </div>
                      {location && (
                        <div className="hidden sm:block">
                          <Badge variant="secondary" className={cn("text-[8px] px-0.5 py-0", location.color)}>
                            {location.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
