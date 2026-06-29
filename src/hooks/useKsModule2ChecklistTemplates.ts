import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ChecklistCheckpoint {
  checkpoint_text: string;
  help_text?: string;
}

export interface KsModule2ChecklistTemplate {
  id: string;
  project_id: string | null;
  company_id: string;
  template_name: string;
  description: string | null;
  category: string;
  checkpoints: ChecklistCheckpoint[];
  is_active: boolean;
  is_system_template: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewChecklistTemplateInput {
  project_id: string;
  template_name: string;
  description?: string;
  category: string;
  checkpoints: ChecklistCheckpoint[];
}

export function useKsModule2ChecklistTemplates(projectId?: string) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<KsModule2ChecklistTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    if (!profile?.company_id || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('ks_module2_checklist_templates')
        .select('*')
        .eq('project_id', projectId)
        .eq('company_id', profile.company_id)
        .eq('is_system_template', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse checkpoints from JSON
      const parsed = (data || []).map(item => ({
        ...item,
        checkpoints: Array.isArray(item.checkpoints) ? item.checkpoints as unknown as ChecklistCheckpoint[] : []
      })) as KsModule2ChecklistTemplate[];
      
      setTemplates(parsed);
    } catch (error) {
      console.error('Error fetching checklist templates:', error);
      toast.error('Kunne ikke hente sjekkliste-maler');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTemplates();
    }
  }, [profile?.company_id, projectId]);

  const createTemplate = async (input: NewChecklistTemplateInput) => {
    if (!profile?.company_id) return null;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('ks_module2_checklist_templates')
        .insert([{
          project_id: input.project_id,
          company_id: profile.company_id,
          template_name: input.template_name,
          description: input.description || null,
          category: input.category,
          checkpoints: input.checkpoints as unknown as Json[],
          is_system_template: false,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Sjekkliste-mal opprettet');
      fetchTemplates();
      return {
        ...data,
        checkpoints: Array.isArray(data.checkpoints) ? data.checkpoints as unknown as ChecklistCheckpoint[] : []
      } as KsModule2ChecklistTemplate;
    } catch (error) {
      console.error('Error creating checklist template:', error);
      toast.error('Kunne ikke opprette sjekkliste-mal');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Pick<KsModule2ChecklistTemplate, 'template_name' | 'description' | 'category' | 'checkpoints' | 'approved_by' | 'approved_at'>>) => {
    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.template_name !== undefined) updateData.template_name = updates.template_name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.checkpoints !== undefined) updateData.checkpoints = updates.checkpoints as unknown as Json[];
      if (updates.approved_by !== undefined) updateData.approved_by = updates.approved_by;
      if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;

      const { error } = await supabase
        .from('ks_module2_checklist_templates')
        .update(updateData as any)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Sjekkliste-mal oppdatert');
      fetchTemplates();
    } catch (error) {
      console.error('Error updating checklist template:', error);
      toast.error('Kunne ikke oppdatere sjekkliste-mal');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ks_module2_checklist_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Sjekkliste-mal slettet');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting checklist template:', error);
      toast.error('Kunne ikke slette sjekkliste-mal');
    }
  };

  // Get unique custom categories from existing templates
  const customCategories = [...new Set(templates.map(t => t.category))];

  return {
    templates,
    customCategories,
    isLoading,
    isSaving,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
