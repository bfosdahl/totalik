import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkSchedule {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: "planned" | "actual";
  notes: string | null;
  location: string | null;
  shift_role: string | null;
  is_responsible: boolean;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkSchedule {
  employee_id: string;
  employee_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: "planned" | "actual";
  notes?: string;
  location?: string;
  shift_role?: string;
  is_responsible?: boolean;
}

export function useWorkSchedules() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("work_schedules")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("schedule_date", { ascending: false });

      // If not admin, only show own schedules
      if (!isCompanyAdmin && !isSystemAdmin) {
        query = query.eq("employee_id", profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules((data as WorkSchedule[]) || []);
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      toast.error("Kunne ikke hente arbeidsplaner");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [profile?.company_id, isCompanyAdmin, isSystemAdmin]);

  const createSchedule = async (scheduleData: CreateWorkSchedule): Promise<boolean> => {
    if (!profile?.company_id) {
      toast.error("Mangler brukerinformasjon");
      return false;
    }

    try {
      const { error } = await supabase.from("work_schedules").insert({
        company_id: profile.company_id,
        created_by_id: profile.id,
        created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        ...scheduleData,
      });

      if (error) throw error;

      toast.success(
        scheduleData.schedule_type === "planned" 
          ? "Arbeidsplan opprettet" 
          : "Arbeidstimer registrert"
      );

      // Send notification if it's a planned schedule
      if (scheduleData.schedule_type === "planned") {
        await supabase.functions.invoke("notify-work-schedule", {
          body: {
            employeeName: scheduleData.employee_name,
            scheduleDate: scheduleData.schedule_date,
            startTime: scheduleData.start_time,
            endTime: scheduleData.end_time,
          },
        });
      }

      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error creating work schedule:", error);
      toast.error("Kunne ikke opprette arbeidsplan");
      return false;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<CreateWorkSchedule>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("work_schedules")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Arbeidsplan oppdatert");
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error updating work schedule:", error);
      toast.error("Kunne ikke oppdatere arbeidsplan");
      return false;
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("work_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Arbeidsplan slettet");
      await fetchSchedules();
      return true;
    } catch (error) {
      console.error("Error deleting work schedule:", error);
      toast.error("Kunne ikke slette arbeidsplan");
      return false;
    }
  };

  const getSchedulesByWeek = (weekStart: Date): WorkSchedule[] => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.schedule_date);
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    });
  };

  return {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByWeek,
    refetch: fetchSchedules,
  };
}
