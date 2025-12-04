import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectTemplate {
  id: string;
  project_id: string;
  template_type: 'checklist' | 'routine' | 'document';
  admin_checklist_template_id: string | null;
  admin_routine_template_id: string | null;
  admin_document_id: string | null;
  is_implemented: boolean;
  implemented_at: string | null;
  implemented_by_id: string | null;
  implemented_by_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  checklist_template?: {
    id: string;
    template_name: string;
    category: string;
    description: string | null;
    checkpoints: any[];
    is_mandatory: boolean;
    is_locked: boolean;
    version: string;
  };
  routine_template?: {
    id: string;
    routine_name: string;
    category: string;
    description: string | null;
    content: string;
    is_mandatory: boolean;
    is_locked: boolean;
    version: string;
    file_path: string | null;
  };
  document?: {
    id: string;
    document_name: string;
    category: string | null;
    description: string | null;
    file_path: string;
    file_type: string | null;
    is_mandatory: boolean;
    version: string;
  };
}

export function useKsModule2ProjectTemplates(projectId: string | undefined) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ks_module2_project_templates')
        .select(`
          *,
          checklist_template:admin_checklist_templates(
            id, template_name, category, description, checkpoints, is_mandatory, is_locked, version
          ),
          routine_template:admin_routine_templates(
            id, routine_name, category, description, content, is_mandatory, is_locked, version, file_path
          ),
          document:admin_documents(
            id, document_name, category, description, file_path, file_type, is_mandatory, version
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as ProjectTemplate[]);
    } catch (error) {
      console.error('Error fetching project templates:', error);
      toast.error('Kunne ikke laste prosjektmaler');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addChecklistTemplate = async (adminTemplateId: string) => {
    if (!projectId) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .insert({
          project_id: projectId,
          template_type: 'checklist',
          admin_checklist_template_id: adminTemplateId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Denne malen er allerede lagt til i prosjektet');
          return false;
        }
        throw error;
      }
      
      toast.success('Sjekklistemal lagt til i prosjektet');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error adding checklist template:', error);
      toast.error('Kunne ikke legge til mal');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const addRoutineTemplate = async (adminTemplateId: string) => {
    if (!projectId) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .insert({
          project_id: projectId,
          template_type: 'routine',
          admin_routine_template_id: adminTemplateId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Denne rutinen er allerede lagt til i prosjektet');
          return false;
        }
        throw error;
      }
      
      toast.success('Rutinemal lagt til i prosjektet');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error adding routine template:', error);
      toast.error('Kunne ikke legge til rutine');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const addDocument = async (adminDocumentId: string) => {
    if (!projectId) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .insert({
          project_id: projectId,
          template_type: 'document',
          admin_document_id: adminDocumentId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Dette dokumentet er allerede lagt til i prosjektet');
          return false;
        }
        throw error;
      }
      
      toast.success('Dokument lagt til i prosjektet');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Kunne ikke legge til dokument');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeTemplate = async (templateId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Mal fjernet fra prosjektet');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error removing template:', error);
      toast.error('Kunne ikke fjerne mal');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const markAsImplemented = async (templateId: string, notes?: string) => {
    if (!profile) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .update({
          is_implemented: true,
          implemented_at: new Date().toISOString(),
          implemented_by_id: profile.id,
          implemented_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          notes,
        })
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Markert som implementert');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error marking as implemented:', error);
      toast.error('Kunne ikke oppdatere status');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const unmarkAsImplemented = async (templateId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_project_templates')
        .update({
          is_implemented: false,
          implemented_at: null,
          implemented_by_id: null,
          implemented_by_name: null,
        })
        .eq('id', templateId);

      if (error) throw error;
      
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error unmarking as implemented:', error);
      toast.error('Kunne ikke oppdatere status');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Helper getters
  const checklistTemplates = templates.filter(t => t.template_type === 'checklist');
  const routineTemplates = templates.filter(t => t.template_type === 'routine');
  const documentTemplates = templates.filter(t => t.template_type === 'document');

  // Get IDs that are already added
  const addedChecklistIds = checklistTemplates.map(t => t.admin_checklist_template_id).filter(Boolean) as string[];
  const addedRoutineIds = routineTemplates.map(t => t.admin_routine_template_id).filter(Boolean) as string[];
  const addedDocumentIds = documentTemplates.map(t => t.admin_document_id).filter(Boolean) as string[];

  return {
    templates,
    checklistTemplates,
    routineTemplates,
    documentTemplates,
    addedChecklistIds,
    addedRoutineIds,
    addedDocumentIds,
    isLoading,
    isSaving,
    addChecklistTemplate,
    addRoutineTemplate,
    addDocument,
    removeTemplate,
    markAsImplemented,
    unmarkAsImplemented,
    refetch: fetchTemplates,
  };
}
