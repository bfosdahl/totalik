import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addDays, format, startOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";

export interface StandardWorkSchedule {
  id: string;
  company_id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  shift_role: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStandardSchedule {
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  shift_role?: string;
}

const DAY_NAMES = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export function useStandardWorkSchedules() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<StandardWorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("standard_work_schedules")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setSchedules((data as StandardWorkSchedule[]) || []);
    } catch (error) {
      console.error("Error fetching standard work schedules:", error);
      toast.error("Kunne ikke hente faste arbeidstider");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [profile?.company_id]);

  const createSchedule = async (scheduleData: CreateStandardSchedule): Promise<boolean> => {
    if (!profile?.company_id) {
      toast.error("Mangler brukerinformasjon");
      return false;
    }

    try {
      const { error } = await supabase.from("standard_work_schedules").insert({
        company_id: profile.company_id,
        ...scheduleData,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error(`Denne ansatte har allerede en fast arbeidstid for ${DAY_NAMES[scheduleData.day_of_week]}`);
          return false;
        }
        throw error;
      }

      toast.success("Fast arbeidstid opprettet");
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error creating standard work schedule:", error);
      toast.error("Kunne ikke opprette fast arbeidstid");
      return false;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<CreateStandardSchedule>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("standard_work_schedules")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Fast arbeidstid oppdatert");
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error updating standard work schedule:", error);
      toast.error("Kunne ikke oppdatere fast arbeidstid");
      return false;
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("standard_work_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Fast arbeidstid slettet");
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error deleting standard work schedule:", error);
      toast.error("Kunne ikke slette fast arbeidstid");
      return false;
    }
  };

  const getSchedulesByEmployee = (employeeId: string): StandardWorkSchedule[] => {
    return schedules.filter(s => s.employee_id === employeeId);
  };

  const generateWeekSchedules = async (
    weekStart: Date,
    employeeId?: string,
    employeeName?: string
  ): Promise<{ created: number; skipped: number }> => {
    if (!profile?.company_id) {
      toast.error("Mangler brukerinformasjon");
      return { created: 0, skipped: 0 };
    }

    const schedulesToGenerate = employeeId 
      ? schedules.filter(s => s.employee_id === employeeId)
      : schedules;

    if (schedulesToGenerate.length === 0) {
      toast.info("Ingen faste arbeidstider funnet");
      return { created: 0, skipped: 0 };
    }

    let created = 0;
    let skipped = 0;

    // Get employee names for the schedules we need to generate
    const employeeIds = [...new Set(schedulesToGenerate.map(s => s.employee_id))];
    const { data: employees } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", employeeIds);

    const employeeMap = new Map(employees?.map(e => [
      e.id, 
      `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email || "Ukjent"
    ]) || []);

    for (const stdSchedule of schedulesToGenerate) {
      // Calculate the date for this day of week
      const weekStartMonday = startOfWeek(weekStart, { weekStartsOn: 1 });
      // Convert day_of_week (0=Sunday) to Monday-based offset
      const dayOffset = stdSchedule.day_of_week === 0 ? 6 : stdSchedule.day_of_week - 1;
      const scheduleDate = addDays(weekStartMonday, dayOffset);
      const scheduleDateStr = format(scheduleDate, "yyyy-MM-dd");

      // Check if schedule already exists for this date
      const { data: existing } = await supabase
        .from("work_schedules")
        .select("id")
        .eq("company_id", profile.company_id)
        .eq("employee_id", stdSchedule.employee_id)
        .eq("schedule_date", scheduleDateStr)
        .eq("schedule_type", "planned")
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Create the schedule
      const empName = employeeMap.get(stdSchedule.employee_id) || employeeName || "Ukjent";
      
      const { error } = await supabase.from("work_schedules").insert({
        company_id: profile.company_id,
        employee_id: stdSchedule.employee_id,
        employee_name: empName,
        schedule_date: scheduleDateStr,
        start_time: stdSchedule.start_time,
        end_time: stdSchedule.end_time,
        schedule_type: "planned",
        location: stdSchedule.location,
        shift_role: stdSchedule.shift_role,
        created_by_id: profile.id,
        created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
      });

      if (!error) {
        created++;
      }
    }

    if (created > 0) {
      toast.success(`${created} vakter generert`);
    }
    if (skipped > 0) {
      toast.info(`${skipped} vakter hoppet over (finnes allerede)`);
    }

    return { created, skipped };
  };

  const generateMonthSchedules = async (
    monthDate: Date,
    employeeId?: string
  ): Promise<{ created: number; skipped: number }> => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Get all weeks that overlap with this month
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const weekStart of weeks) {
      const { created, skipped } = await generateWeekSchedules(weekStart, employeeId);
      totalCreated += created;
      totalSkipped += skipped;
    }

    if (totalCreated > 0) {
      toast.success(`${totalCreated} vakter generert for måneden`);
    }
    if (totalSkipped > 0) {
      toast.info(`${totalSkipped} vakter hoppet over (finnes allerede)`);
    }

    return { created: totalCreated, skipped: totalSkipped };
  };

  return {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByEmployee,
    generateWeekSchedules,
    generateMonthSchedules,
    refetch: fetchSchedules,
    DAY_NAMES,
  };
}
