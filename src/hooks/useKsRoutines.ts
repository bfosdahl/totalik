import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KsRoutine {
  id: string;
  company_id: string;
  routine_number: string;
  name: string;
  category: string | null;
  purpose: string | null;
  responsibility: string | null;
  procedure: string | null;
  examples: string | null;
  notes: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewKsRoutineInput {
  routine_number: string;
  name: string;
  category?: string;
  purpose?: string;
  responsibility?: string;
  procedure?: string;
  examples?: string;
  notes?: string;
}

export function useKsRoutines() {
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<KsRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoutines = useCallback(async () => {
    if (!profile?.company_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ks_routines')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('routine_number', { ascending: true });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching KS routines:', error);
      toast.error('Kunne ikke hente rutiner');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchRoutines();
    }
  }, [fetchRoutines, profile?.company_id]);

  const createRoutine = useCallback(async (input: NewKsRoutineInput) => {
    if (!profile?.company_id) {
      toast.error('Du må være logget inn');
      return null;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('ks_routines')
        .insert({
          company_id: profile.company_id,
          routine_number: input.routine_number,
          name: input.name,
          category: input.category || null,
          purpose: input.purpose || null,
          responsibility: input.responsibility || null,
          procedure: input.procedure || null,
          examples: input.examples || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRoutines(prev => [...prev, data]);
      toast.success('Rutine opprettet');
      return data;
    } catch (error) {
      console.error('Error creating KS routine:', error);
      toast.error('Kunne ikke opprette rutine');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.company_id]);

  const updateRoutine = useCallback(async (id: string, updates: Partial<KsRoutine>) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('ks_routines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRoutines(prev => prev.map(r => r.id === id ? data : r));
      toast.success('Rutine oppdatert');
      return data;
    } catch (error) {
      console.error('Error updating KS routine:', error);
      toast.error('Kunne ikke oppdatere rutine');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    try {
      // Find the routine to get file path
      const routine = routines.find(r => r.id === id);
      
      // Delete file from storage if it exists
      if (routine?.file_path) {
        await supabase.storage
          .from('ks-routine-documents')
          .remove([routine.file_path]);
      }

      const { error } = await supabase
        .from('ks_routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRoutines(prev => prev.filter(r => r.id !== id));
      toast.success('Rutine slettet');
      return true;
    } catch (error) {
      console.error('Error deleting KS routine:', error);
      toast.error('Kunne ikke slette rutine');
      return false;
    }
  }, [routines]);

  const uploadRoutineDocument = useCallback(async (
    file: File,
    routineNumber: string,
    name: string,
    category?: string
  ) => {
    if (!profile?.company_id) {
      toast.error('Du må være logget inn');
      return null;
    }

    setIsSaving(true);
    try {
      // Sanitize filename - remove emojis and special characters
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name
        .replace(/[^\w\s.-]/gi, '') // Remove emojis and special chars
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/[æÆ]/g, 'ae')
        .replace(/[øØ]/g, 'o')
        .replace(/[åÅ]/g, 'a')
        .substring(0, 100); // Limit length
      
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${profile.company_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ks-routine-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create routine record with file path
      const { data, error } = await supabase
        .from('ks_routines')
        .insert({
          company_id: profile.company_id,
          routine_number: routineNumber,
          name: name,
          category: category || null,
          file_path: filePath,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRoutines(prev => [...prev, data]);
      toast.success('Rutinedokument lastet opp');
      return data;
    } catch (error) {
      console.error('Error uploading routine document:', error);
      toast.error('Kunne ikke laste opp dokument');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.company_id]);

  const downloadRoutineDocument = useCallback(async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('ks-routine-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dokument lastet ned');
    } catch (error) {
      console.error('Error downloading routine document:', error);
      toast.error('Kunne ikke laste ned dokument');
    }
  }, []);

  return {
    routines,
    isLoading,
    isSaving,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    uploadRoutineDocument,
    downloadRoutineDocument,
    refetch: fetchRoutines,
  };
}
