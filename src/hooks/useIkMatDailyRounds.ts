import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type RoundStationType = "temperature" | "checklist" | "cleaning" | "custom";

export interface RoundStation {
  type: RoundStationType;
  ref_id: string;
  label?: string;
  /** For custom stations: free-text instruction shown to the operator */
  instructions?: string;
  /** For custom stations: optional checkpoints the operator must tick off */
  checkpoints?: string[];
}

export interface DailyRound {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  stations: RoundStation[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoundStationResult {
  type: RoundStationType;
  ref_id: string;
  label: string;
  status: "done" | "skipped";
  value?: number | null;
  notes?: string | null;
}

export interface RoundCompletion {
  id: string;
  company_id: string;
  round_id: string;
  completed_by_name: string;
  status: string;
  station_results: RoundStationResult[];
  started_at: string;
  completed_at: string;
  created_at: string;
}

export function useIkMatDailyRounds() {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ["ik-mat-daily-rounds", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("ik_mat_daily_rounds")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DailyRound[];
    },
    enabled: !!company?.id,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["ik-mat-daily-round-completions", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("ik_mat_daily_round_completions")
        .select("*")
        .eq("company_id", company.id)
        .order("completed_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as RoundCompletion[];
    },
    enabled: !!company?.id,
  });

  const createRound = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      stations: RoundStation[];
    }) => {
      if (!company?.id) throw new Error("Mangler bedrift");
      const { data, error } = await supabase
        .from("ik_mat_daily_rounds")
        .insert({
          company_id: company.id,
          name: input.name,
          description: input.description || null,
          stations: input.stations as any,
          created_by_id: profile?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-daily-rounds"] });
      toast.success("Runde opprettet");
    },
    onError: (e: Error) => toast.error("Kunne ikke opprette runde: " + e.message),
  });

  const updateRound = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DailyRound> & { id: string }) => {
      const payload: any = { ...updates };
      if (payload.stations) payload.stations = payload.stations as any;
      const { error } = await supabase
        .from("ik_mat_daily_rounds")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-daily-rounds"] });
      toast.success("Runde oppdatert");
    },
    onError: (e: Error) => toast.error("Kunne ikke oppdatere runde: " + e.message),
  });

  const deleteRound = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_mat_daily_rounds")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-daily-rounds"] });
      toast.success("Runde slettet");
    },
    onError: (e: Error) => toast.error("Kunne ikke slette runde: " + e.message),
  });

  const logCompletion = useMutation({
    mutationFn: async (input: {
      round_id: string;
      station_results: RoundStationResult[];
      started_at: string;
      status?: "completed" | "partial";
    }) => {
      if (!company?.id || !profile) throw new Error("Ikke logget inn");
      const completedByName =
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        profile.email ||
        "Ukjent";
      const { data, error } = await supabase
        .from("ik_mat_daily_round_completions")
        .insert({
          company_id: company.id,
          round_id: input.round_id,
          completed_by_id: profile.id,
          completed_by_name: completedByName,
          status: input.status || "completed",
          station_results: input.station_results as any,
          started_at: input.started_at,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ik-mat-daily-round-completions"],
      });
    },
  });

  return {
    rounds,
    completions,
    isLoading,
    createRound,
    updateRound,
    deleteRound,
    logCompletion,
  };
}
