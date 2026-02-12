import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RoutineTemplate {
  id: string;
  title: string;
  description: string | null;
  module: string;
  subcategory: string | null;
  frequency: string | null;
  purpose: string | null;
  steps: any[] | null;
  legal_refs: any[] | null;
  target_roles: string[] | null;
  tags: string[] | null;
  status: string;
  version: number;
  is_global_default: boolean;
  created_at: string;
}

export interface CustomerRoutineInstance {
  id: string;
  company_id: string;
  template_id: string | null;
  template_version: number | null;
  title: string;
  module: string;
  content: any;
  status: string;
  last_reviewed: string | null;
  next_due: string | null;
  update_available: boolean;
  created_at: string;
}

export type RoutineLibraryModule = "ik_hms" | "ik_mat" | "ik_alkohol" | "ks_ik_bygg";

export function useRoutineLibrary(module: RoutineLibraryModule) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  // Fetch published templates for this module
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["routine-library-templates", module],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_routine_templates_v2")
        .select("*")
        .eq("module", module)
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return (data || []) as RoutineTemplate[];
    },
  });

  // Fetch customer's adopted instances for this module
  const { data: instances = [], isLoading: instancesLoading } = useQuery({
    queryKey: ["customer-routine-instances", companyId, module],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("customer_routine_instances")
        .select("*")
        .eq("company_id", companyId)
        .eq("module", module)
        .order("title");

      if (error) throw error;
      return (data || []) as CustomerRoutineInstance[];
    },
    enabled: !!companyId,
  });

  // Adopt a template
  const adoptTemplate = useMutation({
    mutationFn: async (template: RoutineTemplate) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("customer_routine_instances")
        .insert([{
          company_id: companyId,
          template_id: template.id,
          template_version: template.version,
          title: template.title,
          module: template.module,
          content: {
            description: template.description,
            purpose: template.purpose,
            steps: template.steps,
            frequency: template.frequency,
            legal_refs: template.legal_refs,
            target_roles: template.target_roles,
            tags: template.tags,
          },
          status: "active",
          update_available: false,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-routine-instances", companyId, module] });
      toast.success("Rutine lagt til fra biblioteket");
    },
    onError: () => {
      toast.error("Kunne ikke legge til rutine");
    },
  });

  // Delete an adopted instance
  const deleteInstance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_routine_instances")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-routine-instances", companyId, module] });
      toast.success("Rutine fjernet");
    },
  });

  // Check which templates are already adopted
  const adoptedTemplateIds = new Set(instances.filter(i => i.template_id).map(i => i.template_id));

  return {
    templates,
    instances,
    isLoading: templatesLoading || instancesLoading,
    adoptTemplate,
    deleteInstance,
    adoptedTemplateIds,
  };
}
