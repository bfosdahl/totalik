import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InspectionTemplateSeed {
  id: string;
  template_name: string;
  inspection_type: string;
  description: string | null;
  checkpoints: Array<{
    checkpoint_text: string;
    help_text: string;
  }>;
}

export const useInspectionTemplateSeeds = () => {
  const queryClient = useQueryClient();

  const { data: seeds, isLoading } = useQuery({
    queryKey: ["inspection-template-seeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_inspection_template_seeds")
        .select("*")
        .order("template_name");

      if (error) throw error;
      
      return (data || []).map((seed) => ({
        ...seed,
        checkpoints: seed.checkpoints as Array<{
          checkpoint_text: string;
          help_text: string;
        }>,
      })) as InspectionTemplateSeed[];
    },
  });

  const activateSeed = useMutation({
    mutationFn: async (seedId: string) => {
      const seed = seeds?.find((s) => s.id === seedId);
      if (!seed) throw new Error("Seed not found");

      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company found");

      // Create template
      const { data: template, error: templateError } = await supabase
        .from("ks_inspection_templates")
        .insert({
          company_id: profile.company_id,
          template_name: seed.template_name,
          inspection_type: seed.inspection_type,
          description: seed.description,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template items
      const items = seed.checkpoints.map((checkpoint, index) => ({
        template_id: template.id,
        checkpoint_text: checkpoint.checkpoint_text,
        help_text: checkpoint.help_text || null,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("ks_inspection_template_items")
        .insert(items);

      if (itemsError) throw itemsError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-templates"] });
      toast.success("Mal aktivert", {
        description: "Standard malen er nå tilgjengelig i dine maler",
      });
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke aktivere mal", {
        description: error.message,
      });
    },
  });

  return {
    seeds: seeds || [],
    isLoading,
    activateSeed,
  };
};
