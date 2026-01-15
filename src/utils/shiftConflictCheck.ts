import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { format, parseISO, areIntervalsOverlapping } from "date-fns";

export interface ShiftConflict {
  schedule: WorkSchedule;
  conflictWith: WorkSchedule;
  type: "overlap" | "double_booking";
}

/**
 * Check for scheduling conflicts
 * - Double booking: Same employee scheduled for overlapping times
 * - Overlap: Multiple people with "responsible" role at same time
 */
export function checkShiftConflicts(schedules: WorkSchedule[]): ShiftConflict[] {
  const conflicts: ShiftConflict[] = [];
  
  // Group by date for efficiency
  const byDate: Record<string, WorkSchedule[]> = {};
  schedules.forEach(schedule => {
    if (!byDate[schedule.schedule_date]) {
      byDate[schedule.schedule_date] = [];
    }
    byDate[schedule.schedule_date].push(schedule);
  });

  // Check each date
  Object.values(byDate).forEach(daySchedules => {
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const a = daySchedules[i];
        const b = daySchedules[j];

        // Parse times for comparison
        const aStart = parseTimeToMinutes(a.start_time);
        const aEnd = parseTimeToMinutes(a.end_time);
        const bStart = parseTimeToMinutes(b.start_time);
        const bEnd = parseTimeToMinutes(b.end_time);

        const overlaps = aStart < bEnd && bStart < aEnd;

        if (overlaps) {
          // Check if same employee
          if (a.employee_id === b.employee_id) {
            conflicts.push({
              schedule: a,
              conflictWith: b,
              type: "double_booking"
            });
          }
        }
      }
    }
  });

  return conflicts;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if adding a new schedule would create a conflict
 */
export function wouldCreateConflict(
  newSchedule: {
    employee_id: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
  },
  existingSchedules: WorkSchedule[]
): WorkSchedule | null {
  const newStart = parseTimeToMinutes(newSchedule.start_time);
  const newEnd = parseTimeToMinutes(newSchedule.end_time);

  const sameDay = existingSchedules.filter(
    s => s.schedule_date === newSchedule.schedule_date
  );

  for (const existing of sameDay) {
    if (existing.employee_id === newSchedule.employee_id) {
      const existingStart = parseTimeToMinutes(existing.start_time);
      const existingEnd = parseTimeToMinutes(existing.end_time);

      if (newStart < existingEnd && existingStart < newEnd) {
        return existing;
      }
    }
  }

  return null;
}

/**
 * Calculate overtime hours
 * Norwegian standard: 7.5 hours/day or 37.5 hours/week
 */
export function calculateOvertime(
  entries: { hours: number; entry_date: string }[],
  dailyLimit = 7.5,
  weeklyLimit = 37.5
): {
  dailyOvertime: Record<string, number>;
  weeklyOvertime: number;
  totalOvertime: number;
} {
  const dailyHours: Record<string, number> = {};
  
  entries.forEach(entry => {
    if (!dailyHours[entry.entry_date]) {
      dailyHours[entry.entry_date] = 0;
    }
    dailyHours[entry.entry_date] += entry.hours;
  });

  const dailyOvertime: Record<string, number> = {};
  let totalDailyOvertime = 0;

  Object.entries(dailyHours).forEach(([date, hours]) => {
    if (hours > dailyLimit) {
      dailyOvertime[date] = hours - dailyLimit;
      totalDailyOvertime += hours - dailyLimit;
    }
  });

  const totalHours = Object.values(dailyHours).reduce((sum, h) => sum + h, 0);
  const weeklyOvertime = Math.max(0, totalHours - weeklyLimit);

  return {
    dailyOvertime,
    weeklyOvertime,
    totalOvertime: Math.max(totalDailyOvertime, weeklyOvertime)
  };
}

/**
 * Calculate net work hours after breaks
 */
export function calculateNetHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const grossMinutes = end - start;
  const netMinutes = grossMinutes - breakMinutes;
  return Math.max(0, netMinutes / 60);
}

/**
 * Suggest automatic break based on Norwegian law
 * - 30 min break if working > 5.5 hours
 * - 15 min break if working 4-5.5 hours
 */
export function suggestBreak(hoursWorked: number): number {
  if (hoursWorked > 5.5) return 30;
  if (hoursWorked >= 4) return 15;
  return 0;
}
