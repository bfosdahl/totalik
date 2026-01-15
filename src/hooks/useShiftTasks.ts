import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ShiftTask {
  id: string;
  company_id: string;
  schedule_id: string;
  task_name: string;
  task_type: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by_id: string | null;
  completed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SHIFT_TASKS = [
  { name: "Temperaturkontroll kjøl", type: "temperature" },
  { name: "Temperaturkontroll frys", type: "temperature" },
  { name: "Renhold kjøkken", type: "cleaning" },
  { name: "Stenging/rutiner ved stenging", type: "closing" },
  { name: "Ta ut søppel/avfall", type: "waste" },
  { name: "Kontroll av såpe/papir/håndvaskstasjon", type: "hygiene" },
  { name: "Åpningsrutiner", type: "opening" },
  { name: "Slå av/på alarm", type: "security" },
];

export function useShiftTasks(scheduleId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    if (!profile?.company_id || !scheduleId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shift_tasks")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTasks((data as ShiftTask[]) || []);
    } catch (error) {
      console.error("Error fetching shift tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [scheduleId, profile?.company_id]);

  const createTask = async (taskName: string, taskType: string = "custom"): Promise<boolean> => {
    if (!profile?.company_id || !scheduleId) {
      toast.error("Mangler informasjon");
      return false;
    }

    try {
      const { error } = await supabase.from("shift_tasks").insert({
        company_id: profile.company_id,
        schedule_id: scheduleId,
        task_name: taskName,
        task_type: taskType,
      });

      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error creating shift task:", error);
      toast.error("Kunne ikke opprette oppgave");
      return false;
    }
  };

  const createMultipleTasks = async (taskNames: { name: string; type: string }[]): Promise<boolean> => {
    if (!profile?.company_id || !scheduleId) {
      toast.error("Mangler informasjon");
      return false;
    }

    try {
      const tasksToInsert = taskNames.map(task => ({
        company_id: profile.company_id,
        schedule_id: scheduleId,
        task_name: task.name,
        task_type: task.type,
      }));

      const { error } = await supabase.from("shift_tasks").insert(tasksToInsert);

      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error creating shift tasks:", error);
      toast.error("Kunne ikke opprette oppgaver");
      return false;
    }
  };

  const completeTask = async (taskId: string): Promise<boolean> => {
    if (!profile) {
      toast.error("Må være logget inn");
      return false;
    }

    try {
      const task = tasks.find(t => t.id === taskId);
      const newCompletedState = !task?.is_completed;

      const { error } = await supabase
        .from("shift_tasks")
        .update({
          is_completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
          completed_by_id: newCompletedState ? profile.id : null,
          completed_by_name: newCompletedState 
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent"
            : null,
        })
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success(newCompletedState ? "Oppgave fullført" : "Oppgave åpnet igjen");
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error updating shift task:", error);
      toast.error("Kunne ikke oppdatere oppgave");
      return false;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("shift_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (error) {
      console.error("Error deleting shift task:", error);
      toast.error("Kunne ikke slette oppgave");
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    createTask,
    createMultipleTasks,
    completeTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
