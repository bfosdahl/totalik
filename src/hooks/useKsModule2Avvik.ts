import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsModule2Avvik {
  id: string;
  project_id: string;
  company_id: string;
  avvik_number: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  location: string | null;
  discovered_date: string;
  deadline: string | null;
  responsible_name: string | null;
  responsible_user_id: string | null;
  reported_by_name: string;
  reported_by_user_id: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  closed_at: string | null;
  closed_by_name: string | null;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
}

export type NewKsModule2Avvik = Omit<KsModule2Avvik, "id" | "avvik_number" | "created_at" | "updated_at" | "closed_at" | "closed_by_name">;

export const useKsModule2Avvik = (projectId: string | null) => {
  const queryClient = useQueryClient();
  const { profile, company } = useAuth();

  const { data: avvikList = [], isLoading } = useQuery({
    queryKey: ["ks-module2-avvik", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_avvik" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown) as KsModule2Avvik[];
    },
    enabled: !!projectId,
  });

  const createAvvik = useMutation({
    mutationFn: async (input: Omit<NewKsModule2Avvik, "company_id" | "reported_by_user_id">) => {
      if (!company?.id) throw new Error("Ingen bedrift funnet");
      
      const { data, error } = await supabase
        .from("ks_module2_avvik" as any)
        .insert({
          ...input,
          company_id: company.id,
          reported_by_user_id: profile?.user_id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-avvik", projectId] });
      toast.success("Avvik opprettet");
    },
    onError: () => {
      toast.error("Kunne ikke opprette avvik");
    },
  });

  const updateAvvik = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2Avvik> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_avvik" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-avvik", projectId] });
      toast.success("Avvik oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere avvik");
    },
  });

  const deleteAvvik = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_avvik" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-avvik", projectId] });
      toast.success("Avvik slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette avvik");
    },
  });

  const closeAvvik = useMutation({
    mutationFn: async ({ id, closedByName }: { id: string; closedByName: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_avvik" as any)
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by_name: closedByName,
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-avvik", projectId] });
      toast.success("Avvik lukket");
    },
    onError: () => {
      toast.error("Kunne ikke lukke avvik");
    },
  });

  return {
    avvikList,
    isLoading,
    createAvvik: createAvvik.mutate,
    updateAvvik: updateAvvik.mutate,
    deleteAvvik: deleteAvvik.mutate,
    closeAvvik: closeAvvik.mutate,
    isCreating: createAvvik.isPending,
    isUpdating: updateAvvik.isPending,
  };
};
