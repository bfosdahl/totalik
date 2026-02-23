import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UkChecklistItem {
  id: string;
  uk_id: string;
  company_id: string;
  sort_order: number;
  checkpoint_text: string;
  status: string;
  notes: string | null;
  photo_paths: string[];
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export const useKsModule2UkChecklist = (ukId: string | null) => {
  const queryClient = useQueryClient();
  const { profile, company } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["ks-module2-uk-checklist", ukId],
    queryFn: async () => {
      if (!ukId) return [];
      const { data, error } = await supabase
        .from("ks_module2_uk_checklist_items" as any)
        .select("*")
        .eq("uk_id", ukId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown) as UkChecklistItem[];
    },
    enabled: !!ukId,
  });

  const addItem = useMutation({
    mutationFn: async (checkpoint_text: string) => {
      if (!ukId || !company?.id) throw new Error("Mangler data");
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      const createdByName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}` : profile?.email || "Ukjent";
      const { data, error } = await supabase
        .from("ks_module2_uk_checklist_items" as any)
        .insert({
          uk_id: ukId,
          company_id: company.id,
          sort_order: maxOrder,
          checkpoint_text,
          status: "pending",
          created_by_name: createdByName,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk-checklist", ukId] });
    },
    onError: () => toast.error("Kunne ikke legge til punkt"),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UkChecklistItem> & { id: string }) => {
      const { error } = await supabase
        .from("ks_module2_uk_checklist_items" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk-checklist", ukId] });
    },
    onError: () => toast.error("Kunne ikke oppdatere punkt"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_uk_checklist_items" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-uk-checklist", ukId] });
      toast.success("Punkt slettet");
    },
    onError: () => toast.error("Kunne ikke slette punkt"),
  });

  return {
    items,
    isLoading,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
    isAdding: addItem.isPending,
  };
};
