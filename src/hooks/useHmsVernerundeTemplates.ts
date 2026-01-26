import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VernerundeCheckpoint {
  id: string;
  category: string;
  checkpoint: string;
  help_text?: string | null;
}

export interface HmsVernerundeTemplate {
  id: string;
  company_id: string | null;
  template_name: string;
  description: string | null;
  checkpoints: VernerundeCheckpoint[];
  is_system_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useHmsVernerundeTemplates = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["hms-vernerunde-templates", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hms_vernerunde_templates")
        .select("*")
        .eq("is_active", true)
        .order("is_system_template", { ascending: false })
        .order("template_name");

      if (error) throw error;

      return (data || []).map((t) => ({
        ...t,
        checkpoints: (t.checkpoints as unknown as VernerundeCheckpoint[]) || [],
      })) as HmsVernerundeTemplate[];
    },
    enabled: !!profile?.company_id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: { 
      template_name: string; 
      description?: string; 
      checkpoints: VernerundeCheckpoint[] 
    }) => {
      const { data, error } = await supabase
        .from("hms_vernerunde_templates")
        .insert({
          company_id: profile?.company_id,
          template_name: input.template_name,
          description: input.description || null,
          checkpoints: JSON.parse(JSON.stringify(input.checkpoints)),
          is_system_template: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-vernerunde-templates"] });
      toast.success("Mal opprettet");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Kunne ikke opprette mal");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hms_vernerunde_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-vernerunde-templates"] });
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
    createTemplate,
    deleteTemplate,
  };
};
