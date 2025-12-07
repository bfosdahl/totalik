import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Milestone {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  responsible_name: string | null;
  responsible_id: string | null;
  color: string;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useKsModule2Milestones(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["ks-module2-milestones", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!projectId,
  });

  const createMilestone = useMutation({
    mutationFn: async (milestone: Omit<Milestone, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ks_module2_milestones")
        .insert(milestone)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-milestones", projectId] });
      toast({ title: "Milepæl opprettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved opprettelse", description: error.message, variant: "destructive" });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Milestone> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_milestones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-milestones", projectId] });
      toast({ title: "Milepæl oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved oppdatering", description: error.message, variant: "destructive" });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_milestones")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-milestones", projectId] });
      toast({ title: "Milepæl slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
    },
  });

  return {
    milestones,
    isLoading,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
