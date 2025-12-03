import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsModule2Uk {
  id: string;
  project_id: string;
  company_id: string;
  uk_number: string;
  control_area: string;
  description: string | null;
  controller_name: string | null;
  controller_company: string | null;
  status: string;
  control_date: string | null;
  deadline: string | null;
  comments: string | null;
  result: string | null;
  document_paths: string[] | null;
  created_by_name: string;
  created_by_user_id: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export type NewKsModule2Uk = Omit<KsModule2Uk, "id" | "uk_number" | "created_at" | "updated_at" | "approved_at" | "approved_by_name">;

export const useKsModule2Uk = (projectId: string | null) => {
  const queryClient = useQueryClient();
  const { profile, company } = useAuth();

  const { data: ukList = [], isLoading } = useQuery({
    queryKey: ["ks-module2-uk", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_uk" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown) as KsModule2Uk[];
    },
    enabled: !!projectId,
  });

  const createUk = useMutation({
    mutationFn: async (input: Omit<NewKsModule2Uk, "company_id" | "created_by_user_id">) => {
      if (!company?.id) throw new Error("Ingen bedrift funnet");
      
      const { data, error } = await supabase
        .from("ks_module2_uk" as any)
        .insert({
          ...input,
          company_id: company.id,
          created_by_user_id: profile?.user_id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk", projectId] });
      toast.success("Uavhengig kontroll opprettet");
    },
    onError: () => {
      toast.error("Kunne ikke opprette uavhengig kontroll");
    },
  });

  const updateUk = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2Uk> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_uk" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk", projectId] });
      toast.success("Uavhengig kontroll oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere uavhengig kontroll");
    },
  });

  const deleteUk = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_uk" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk", projectId] });
      toast.success("Uavhengig kontroll slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette uavhengig kontroll");
    },
  });

  const approveUk = useMutation({
    mutationFn: async ({ id, approvedByName, result }: { id: string; approvedByName: string; result: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_uk" as any)
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by_name: approvedByName,
          result: result,
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk", projectId] });
      toast.success("Uavhengig kontroll godkjent");
    },
    onError: () => {
      toast.error("Kunne ikke godkjenne uavhengig kontroll");
    },
  });

  return {
    ukList,
    isLoading,
    createUk: createUk.mutate,
    updateUk: updateUk.mutate,
    deleteUk: deleteUk.mutate,
    approveUk: approveUk.mutate,
    isCreating: createUk.isPending,
    isUpdating: updateUk.isPending,
  };
};
