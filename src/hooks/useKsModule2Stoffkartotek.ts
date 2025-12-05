import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsModule2Stoffkartotek {
  id: string;
  project_id: string;
  company_id: string;
  product_name: string;
  manufacturer: string | null;
  danger_classes: string[];
  location: string | null;
  sds_file_path: string | null;
  notes: string | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export type NewKsModule2Stoffkartotek = Omit<KsModule2Stoffkartotek, "id" | "created_at" | "updated_at">;

export const useKsModule2Stoffkartotek = (projectId: string | null) => {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  const { data: stoffkartotekList = [], isLoading } = useQuery({
    queryKey: ["ks-module2-stoffkartotek", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_stoffkartotek" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("product_name", { ascending: true });

      if (error) throw error;
      return (data as unknown) as KsModule2Stoffkartotek[];
    },
    enabled: !!projectId,
  });

  const createStoffkartotek = useMutation({
    mutationFn: async (input: Omit<NewKsModule2Stoffkartotek, "company_id">) => {
      if (!company?.id) throw new Error("Ingen bedrift funnet");
      
      const { data, error } = await supabase
        .from("ks_module2_stoffkartotek" as any)
        .insert({
          ...input,
          company_id: company.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-stoffkartotek", projectId] });
      toast.success("Stoff lagt til");
    },
    onError: () => {
      toast.error("Kunne ikke legge til stoff");
    },
  });

  const updateStoffkartotek = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2Stoffkartotek> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_stoffkartotek" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-stoffkartotek", projectId] });
      toast.success("Stoff oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere stoff");
    },
  });

  const deleteStoffkartotek = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_stoffkartotek" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-stoffkartotek", projectId] });
      toast.success("Stoff slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette stoff");
    },
  });

  return {
    stoffkartotekList,
    isLoading,
    createStoffkartotek: createStoffkartotek.mutate,
    updateStoffkartotek: updateStoffkartotek.mutate,
    deleteStoffkartotek: deleteStoffkartotek.mutate,
    isCreating: createStoffkartotek.isPending,
    isUpdating: updateStoffkartotek.isPending,
  };
};
