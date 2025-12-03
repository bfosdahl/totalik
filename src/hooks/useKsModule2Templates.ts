import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChecklistTemplate {
  id: string;
  company_id: string | null;
  template_name: string;
  category: string;
  description: string | null;
  checkpoints: any[];
  is_system_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewTemplateInput {
  template_name: string;
  category: string;
  description?: string;
  checkpoints: any[];
}

export function useKsModule2Templates() {
  const { company } = useAuth();
  const companyId = company?.id;
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["ks-module2-templates", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_module2_checklist_templates" as any)
        .select("*")
        .or(`is_system_template.eq.true,company_id.eq.${companyId}`)
        .eq("is_active", true)
        .order("category")
        .order("template_name");

      if (error) throw error;
      return (data || []) as unknown as ChecklistTemplate[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: NewTemplateInput) => {
      const { data, error } = await supabase
        .from("ks_module2_checklist_templates" as any)
        .insert({
          company_id: companyId,
          template_name: input.template_name,
          category: input.category,
          description: input.description,
          checkpoints: input.checkpoints,
          is_system_template: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-templates"] });
      toast.success("Mal opprettet");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Kunne ikke opprette mal");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<NewTemplateInput>) => {
      const { data, error } = await supabase
        .from("ks_module2_checklist_templates" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-templates"] });
      toast.success("Mal oppdatert");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Kunne ikke oppdatere mal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_checklist_templates" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-templates"] });
      toast.success("Mal slettet");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Kunne ikke slette mal");
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
