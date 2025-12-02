import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InspectionTemplate {
  id: string;
  company_id: string;
  template_name: string;
  inspection_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionTemplateItem {
  id: string;
  template_id: string;
  checkpoint_text: string;
  help_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface InspectionResult {
  id: string;
  inspection_id: string;
  template_id: string | null;
  checkpoint_results: any[];
  completed_at: string;
  completed_by_user_id: string | null;
  completed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export function useInspectionTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["inspection-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_inspection_templates")
        .select("*")
        .order("template_name");

      if (error) throw error;
      return data as InspectionTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<InspectionTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("ks_inspection_templates")
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-templates"] });
      toast.success("Mal opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette mal");
      console.error(error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InspectionTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("ks_inspection_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-templates"] });
      toast.success("Mal oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere mal");
      console.error(error);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_inspection_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-templates"] });
      toast.success("Mal slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette mal");
      console.error(error);
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

export function useInspectionTemplateItems(templateId: string | null) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inspection-template-items", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from("ks_inspection_template_items")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order");

      if (error) throw error;
      return data as InspectionTemplateItem[];
    },
    enabled: !!templateId,
  });

  const saveItems = useMutation({
    mutationFn: async ({ templateId, items }: { templateId: string; items: Array<Omit<InspectionTemplateItem, 'id' | 'created_at'>> }) => {
      // Delete existing items
      await supabase
        .from("ks_inspection_template_items")
        .delete()
        .eq("template_id", templateId);

      // Insert new items
      if (items.length > 0) {
        const { error } = await supabase
          .from("ks_inspection_template_items")
          .insert(items);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-template-items"] });
      toast.success("Sjekkliste lagret");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre sjekkliste");
      console.error(error);
    },
  });

  return {
    items,
    isLoading,
    saveItems,
  };
}

export function useInspectionResults(inspectionId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["inspection-result", inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      
      const { data, error } = await supabase
        .from("ks_inspection_results")
        .select("*")
        .eq("inspection_id", inspectionId)
        .maybeSingle();

      if (error) throw error;
      return data as InspectionResult | null;
    },
    enabled: !!inspectionId,
  });

  const saveResult = useMutation({
    mutationFn: async (resultData: Omit<InspectionResult, 'id' | 'created_at'>) => {
      if (result?.id) {
        // Update existing
        const { error } = await supabase
          .from("ks_inspection_results")
          .update(resultData)
          .eq("id", result.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("ks_inspection_results")
          .insert([resultData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-result"] });
      queryClient.invalidateQueries({ queryKey: ["ks-inspections"] });
      toast.success("Inspeksjon fullført");
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre inspeksjon");
      console.error(error);
    },
  });

  return {
    result,
    isLoading,
    saveResult,
  };
}
