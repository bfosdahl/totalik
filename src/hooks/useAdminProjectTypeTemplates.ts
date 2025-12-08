import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminProjectTypeTemplate {
  id: string;
  template_name: string;
  description: string | null;
  icon: string;
  contractor_type: string;
  default_description: string | null;
  checklist_template_ids: string[];
  routine_template_ids: string[];
  document_template_ids: string[];
  include_example_content: boolean;
  example_content_level: string;
  example_client_name: string | null;
  example_client_org_number: string | null;
  example_contract_sum: number | null;
  example_meeting_notes: Record<string, unknown> | null;
  example_subcontractors: Record<string, unknown>[] | null;
  example_deviations: Record<string, unknown>[] | null;
  example_change_orders: Record<string, unknown>[] | null;
  example_milestones: Record<string, unknown>[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewProjectTypeTemplateInput {
  template_name: string;
  description?: string;
  icon?: string;
  contractor_type?: string;
  default_description?: string;
  checklist_template_ids?: string[];
  routine_template_ids?: string[];
  document_template_ids?: string[];
  include_example_content?: boolean;
  example_content_level?: string;
  example_client_name?: string;
  example_client_org_number?: string;
  example_contract_sum?: number;
  sort_order?: number;
}

export function useAdminProjectTypeTemplates() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-project-type-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_project_type_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as AdminProjectTypeTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (input: NewProjectTypeTemplateInput) => {
      const { data, error } = await supabase
        .from('admin_project_type_templates')
        .insert({
          template_name: input.template_name,
          description: input.description || null,
          icon: input.icon || 'building',
          contractor_type: input.contractor_type || 'total',
          default_description: input.default_description || null,
          checklist_template_ids: input.checklist_template_ids || [],
          routine_template_ids: input.routine_template_ids || [],
          document_template_ids: input.document_template_ids || [],
          include_example_content: input.include_example_content || false,
          example_content_level: input.example_content_level || 'minimal',
          example_client_name: input.example_client_name || null,
          example_client_org_number: input.example_client_org_number || null,
          example_contract_sum: input.example_contract_sum || null,
          sort_order: input.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-type-templates'] });
      toast.success('Prosjektmal opprettet');
    },
    onError: (error) => {
      console.error('Error creating project type template:', error);
      toast.error('Kunne ikke opprette prosjektmal');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<AdminProjectTypeTemplate, 'id' | 'created_at' | 'updated_at' | 'example_meeting_notes' | 'example_subcontractors' | 'example_deviations' | 'example_change_orders' | 'example_milestones'>>) => {
      const { error } = await supabase
        .from('admin_project_type_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-type-templates'] });
      toast.success('Prosjektmal oppdatert');
    },
    onError: (error) => {
      console.error('Error updating project type template:', error);
      toast.error('Kunne ikke oppdatere prosjektmal');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_project_type_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-type-templates'] });
      toast.success('Prosjektmal slettet');
    },
    onError: (error) => {
      console.error('Error deleting project type template:', error);
      toast.error('Kunne ikke slette prosjektmal');
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
