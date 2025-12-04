import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KsModule2Routine {
  id: string;
  project_id: string;
  company_id: string;
  routine_number: string;
  name: string;
  description: string | null;
  content: string | null;
  document_path: string | null;
  document_name: string | null;
  category: string;
  responsible_role: string | null;
  is_document: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineChecklistLink {
  id: string;
  routine_id: string;
  template_id: string;
  created_at: string;
}

export interface NewRoutineInput {
  project_id: string;
  name: string;
  description?: string;
  content?: string;
  document_path?: string;
  document_name?: string;
  category?: string;
  responsible_role?: string;
  is_document?: boolean;
}

export function useKsModule2Routines(projectId?: string) {
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<KsModule2Routine[]>([]);
  const [links, setLinks] = useState<RoutineChecklistLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoutines = async () => {
    if (!profile?.company_id || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('ks_module2_routines')
        .select('*')
        .eq('project_id', projectId)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines((data as KsModule2Routine[]) || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      toast.error('Kunne ikke hente rutiner');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinks = async () => {
    if (!profile?.company_id || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('ks_module2_routine_checklist_links')
        .select('*');

      if (error) throw error;
      setLinks((data as RoutineChecklistLink[]) || []);
    } catch (error) {
      console.error('Error fetching routine links:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRoutines();
      fetchLinks();
    }
  }, [profile?.company_id, projectId]);

  const createRoutine = async (input: NewRoutineInput) => {
    if (!profile?.company_id) return null;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('ks_module2_routines')
        .insert([{
          project_id: input.project_id,
          company_id: profile.company_id,
          name: input.name,
          description: input.description || null,
          content: input.content || null,
          document_path: input.document_path || null,
          document_name: input.document_name || null,
          category: input.category || 'general',
          responsible_role: input.responsible_role || null,
          is_document: input.is_document || false,
          routine_number: '',
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Rutine opprettet');
      fetchRoutines();
      return data as KsModule2Routine;
    } catch (error) {
      console.error('Error creating routine:', error);
      toast.error('Kunne ikke opprette rutine');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRoutine = async (id: string, updates: Partial<KsModule2Routine>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ks_module2_routines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Rutine oppdatert');
      fetchRoutines();
    } catch (error) {
      console.error('Error updating routine:', error);
      toast.error('Kunne ikke oppdatere rutine');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      // First delete the document if exists
      const routine = routines.find(r => r.id === id);
      if (routine?.document_path) {
        await supabase.storage
          .from('ks-module2-routines')
          .remove([routine.document_path]);
      }

      const { error } = await supabase
        .from('ks_module2_routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Rutine slettet');
      fetchRoutines();
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast.error('Kunne ikke slette rutine');
    }
  };

  const uploadDocument = async (file: File, projectId: string): Promise<{ path: string; name: string } | null> => {
    if (!profile?.company_id) return null;

    try {
      const sanitizedName = file.name
        .replace(/[^\w\s.-æøåÆØÅ]/g, '')
        .replace(/\s+/g, '_');
      
      const filePath = `${profile.company_id}/${projectId}/${Date.now()}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from('ks-module2-routines')
        .upload(filePath, file);

      if (error) throw error;

      return { path: filePath, name: file.name };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Kunne ikke laste opp dokument');
      return null;
    }
  };

  const getDocumentUrl = async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('ks-module2-routines')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const linkRoutineToTemplate = async (routineId: string, templateId: string) => {
    try {
      const { error } = await supabase
        .from('ks_module2_routine_checklist_links')
        .insert({ routine_id: routineId, template_id: templateId });

      if (error) throw error;
      
      toast.success('Rutine koblet til sjekkliste');
      fetchLinks();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Denne koblingen finnes allerede');
      } else {
        console.error('Error linking routine:', error);
        toast.error('Kunne ikke koble rutine');
      }
    }
  };

  const unlinkRoutineFromTemplate = async (routineId: string, templateId: string) => {
    try {
      const { error } = await supabase
        .from('ks_module2_routine_checklist_links')
        .delete()
        .eq('routine_id', routineId)
        .eq('template_id', templateId);

      if (error) throw error;
      
      toast.success('Kobling fjernet');
      fetchLinks();
    } catch (error) {
      console.error('Error unlinking routine:', error);
      toast.error('Kunne ikke fjerne kobling');
    }
  };

  const getLinkedTemplates = (routineId: string): string[] => {
    return links.filter(l => l.routine_id === routineId).map(l => l.template_id);
  };

  const getLinkedRoutines = (templateId: string): string[] => {
    return links.filter(l => l.template_id === templateId).map(l => l.routine_id);
  };

  return {
    routines,
    links,
    isLoading,
    isSaving,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    uploadDocument,
    getDocumentUrl,
    linkRoutineToTemplate,
    unlinkRoutineFromTemplate,
    getLinkedTemplates,
    getLinkedRoutines,
    refetch: fetchRoutines,
  };
}
