import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DailyReport {
  id: string;
  company_id: string;
  project_id: string | null;
  report_number: string;
  report_date: string;
  user_id: string;
  user_name: string;
  weather_conditions: string | null;
  temperature_celsius: number | null;
  wind_conditions: string | null;
  precipitation: string | null;
  own_crew_count: number;
  subcontractor_crew: any[];
  total_crew_count: number;
  work_description: string | null;
  work_areas: string | null;
  equipment_used: any[];
  materials_received: any[];
  progress_description: string | null;
  progress_percentage: number | null;
  on_schedule: boolean;
  delay_reason: string | null;
  quality_controls: any[];
  hms_incidents: any[];
  hms_observations: string | null;
  safety_meeting_held: boolean;
  subcontractor_attendance: any[];
  deviations_today: any[];
  photos: any[];
  notes: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDailyReport {
  project_id?: string | null;
  report_date: string;
  weather_conditions?: string;
  temperature_celsius?: number;
  wind_conditions?: string;
  precipitation?: string;
  own_crew_count?: number;
  subcontractor_crew?: any[];
  total_crew_count?: number;
  work_description?: string;
  work_areas?: string;
  equipment_used?: any[];
  materials_received?: any[];
  progress_description?: string;
  progress_percentage?: number;
  on_schedule?: boolean;
  delay_reason?: string;
  quality_controls?: any[];
  hms_incidents?: any[];
  hms_observations?: string;
  safety_meeting_held?: boolean;
  subcontractor_attendance?: any[];
  deviations_today?: any[];
  photos?: any[];
  notes?: string;
  status?: string;
}

export function useKsDailyReports(projectId?: string) {
  const { user, profile, isCompanyAdmin } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const queryKey = ["ks-daily-reports", companyId, projectId];

  const { data: reports = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("ks_daily_reports" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("report_date", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      // Non-admins only see their own reports
      if (!isCompanyAdmin) {
        query = query.eq("user_id", user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DailyReport[];
    },
    enabled: !!companyId && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (report: CreateDailyReport) => {
      const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Ukjent";
      const { data, error } = await supabase
        .from("ks_daily_reports" as any)
        .insert({
          company_id: companyId,
          user_id: user!.id,
          user_name: userName,
          ...report,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Dagsrapport opprettet");
    },
    onError: (error) => {
      console.error("Error creating daily report:", error);
      toast.error("Kunne ikke opprette dagsrapport");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateDailyReport> }) => {
      const { data, error } = await supabase
        .from("ks_daily_reports" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Dagsrapport oppdatert");
    },
    onError: (error) => {
      console.error("Error updating daily report:", error);
      toast.error("Kunne ikke oppdatere dagsrapport");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_daily_reports" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Dagsrapport slettet");
    },
    onError: (error) => {
      console.error("Error deleting daily report:", error);
      toast.error("Kunne ikke slette dagsrapport");
    },
  });

  const submitReport = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      updates: { status: "submitted", submitted_at: new Date().toISOString() } as any,
    });
  };

  return {
    reports,
    isLoading,
    createReport: createMutation.mutateAsync,
    updateReport: updateMutation.mutateAsync,
    deleteReport: deleteMutation.mutateAsync,
    submitReport,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
