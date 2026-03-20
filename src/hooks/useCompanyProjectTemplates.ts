import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CompanyProjectTemplate {
  id: string;
  company_id: string;
  template_name: string;
  description: string | null;
  contractor_type: string | null;
  default_description: string | null;
  default_checklists: any[];
  default_routines: any[];
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewProjectTemplateInput {
  template_name: string;
  description?: string;
  contractor_type?: string;
  default_description?: string;
  default_checklists?: any[];
  default_routines?: any[];
  icon?: string;
}

export function useCompanyProjectTemplates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<CompanyProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from("company_project_templates" as any)
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("sort_order") as any);

      if (error) throw error;
      setTemplates((data || []) as CompanyProjectTemplate[]);
    } catch (error) {
      console.error("Error fetching project templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (input: NewProjectTemplateInput) => {
    if (!profile?.company_id || !profile?.id) return null;

    try {
      const { data, error } = await (supabase
        .from("company_project_templates" as any)
        .insert([{
          company_id: profile.company_id,
          created_by: profile.id,
          template_name: input.template_name,
          description: input.description || null,
          contractor_type: input.contractor_type || null,
          default_description: input.default_description || null,
          default_checklists: input.default_checklists || [],
          default_routines: input.default_routines || [],
          icon: input.icon || null,
        }])
        .select()
        .single() as any);

      if (error) throw error;
      toast.success("Prosjektmal opprettet");
      await fetchTemplates();
      return data as CompanyProjectTemplate;
    } catch (error) {
      console.error("Error creating project template:", error);
      toast.error("Kunne ikke opprette prosjektmal");
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("company_project_templates" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;
      toast.success("Prosjektmal slettet");
      await fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Kunne ikke slette prosjektmal");
    }
  };

  return { templates, isLoading, createTemplate, deleteTemplate, refetch: fetchTemplates };
}
