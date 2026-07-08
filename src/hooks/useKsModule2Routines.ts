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
  source_routine_id: string | null;
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
        .eq('is_deleted', false)
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
      // First get routine IDs for this project, then fetch their links
      const routineIds = routines.map(r => r.id);
      if (routineIds.length === 0) {
        setLinks([]);
        return;
      }

      const { data, error } = await supabase
        .from('ks_module2_routine_checklist_links')
        .select('*')
        .in('routine_id', routineIds);

      if (error) throw error;
      setLinks((data as RoutineChecklistLink[]) || []);
    } catch (error) {
      console.error('Error fetching routine links:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRoutines();
    }
  }, [profile?.company_id, projectId]);

  // Fetch links after routines are loaded
  useEffect(() => {
    if (routines.length > 0) {
      fetchLinks();
    } else {
      setLinks([]);
    }
  }, [routines]);

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

      // Mirror content changes back to firmabiblioteket so ALL projects get the update.
      const source = routines.find(r => r.id === id);
      if (source?.source_routine_id) {
        const mirror: {
          routine_name?: string;
          description?: string | null;
          content?: string;
          category?: string;
        } = {};
        if (updates.name !== undefined) mirror.routine_name = updates.name;
        if (updates.description !== undefined) mirror.description = updates.description;
        if (updates.content !== undefined) mirror.content = updates.content ?? '';
        if (updates.category !== undefined) mirror.category = updates.category;
        if (Object.keys(mirror).length > 0) {
          await supabase
            .from('company_ks_routines')
            .update(mirror)
            .eq('id', source.source_routine_id);
        }
      }

      toast.success('Rutine oppdatert i firmabiblioteket – gjelder alle prosjekter');
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
      const { error } = await supabase
        .from('ks_module2_routines')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: (profile as any)?.user_id || null,
        })
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
      // Allow word chars, spaces, dot, hyphen, underscore, and Norwegian letters.
      // The hyphen is escaped so it isn't interpreted as a range.
      const sanitizedName = file.name
        .replace(/[^\w\s.\-æøåÆØÅ]/g, '')
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

  const importFromCompanyLibrary = async (
    companyRoutineIds: string[],
    targetProjectId: string,
  ): Promise<number> => {
    if (!profile?.company_id || companyRoutineIds.length === 0) return 0;
    setIsSaving(true);
    try {
      // Fetch source routines
      const { data: sources, error: srcError } = await supabase
        .from('company_ks_routines')
        .select('id, routine_name, description, content, category')
        .in('id', companyRoutineIds)
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false);
      if (srcError) throw srcError;

      // Already-imported source ids (avoid duplicates in same project)
      const { data: existing } = await supabase
        .from('ks_module2_routines')
        .select('source_routine_id')
        .eq('project_id', targetProjectId)
        .eq('is_deleted', false)
        .in('source_routine_id', companyRoutineIds);
      const existingIds = new Set((existing || []).map((r: any) => r.source_routine_id));

      const inserts = (sources || [])
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({
          project_id: targetProjectId,
          company_id: profile.company_id,
          name: s.routine_name,
          description: s.description,
          content: s.content,
          category: s.category || 'general',
          source_routine_id: s.id,
          routine_number: '',
        }));

      if (inserts.length === 0) {
        toast.info('Rutinene er allerede importert til dette prosjektet');
        return 0;
      }

      const { error: insError } = await supabase
        .from('ks_module2_routines')
        .insert(inserts);
      if (insError) throw insError;

      toast.success(`${inserts.length} rutine${inserts.length === 1 ? '' : 'r'} importert til prosjektet`);
      await fetchRoutines();
      return inserts.length;
    } catch (error) {
      console.error('Error importing routines:', error);
      toast.error('Kunne ikke importere rutiner');
      return 0;
    } finally {
      setIsSaving(false);
    }
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
    importFromCompanyLibrary,
    refetch: fetchRoutines,
  };
}
