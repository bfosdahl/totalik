import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Claim {
  id: string;
  project_id: string;
  company_id: string;
  claim_number: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  reported_by: string | null;
  reported_date: string;
  deadline: string | null;
  responsible_name: string | null;
  responsible_id: string | null;
  resolution: string | null;
  resolved_at: string | null;
  cost_estimate: number | null;
  actual_cost: number | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useKsModule2Claims(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["ks-module2-claims", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_claims")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Claim[];
    },
    enabled: !!projectId,
  });

  const createClaim = useMutation({
    mutationFn: async (claim: Omit<Claim, "id" | "claim_number" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ks_module2_claims")
        .insert({ ...claim, claim_number: "" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-claims", projectId] });
      toast({ title: "Reklamasjon opprettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved opprettelse", description: error.message, variant: "destructive" });
    },
  });

  const updateClaim = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Claim> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_claims")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-claims", projectId] });
      toast({ title: "Reklamasjon oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved oppdatering", description: error.message, variant: "destructive" });
    },
  });

  const deleteClaim = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_claims")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-claims", projectId] });
      toast({ title: "Reklamasjon slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
    },
  });

  const resolveClaim = useMutation({
    mutationFn: async ({ id, resolution, actual_cost }: { id: string; resolution: string; actual_cost?: number }) => {
      const { data, error } = await supabase
        .from("ks_module2_claims")
        .update({
          status: "resolved",
          resolution,
          actual_cost,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-claims", projectId] });
      toast({ title: "Reklamasjon lukket" });
    },
    onError: (error) => {
      toast({ title: "Feil ved lukking", description: error.message, variant: "destructive" });
    },
  });

  return {
    claims,
    isLoading,
    createClaim,
    updateClaim,
    deleteClaim,
    resolveClaim,
  };
}
