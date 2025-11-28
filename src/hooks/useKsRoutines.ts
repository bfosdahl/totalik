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
  }, []);

  return {
    routines,
    isLoading,
    isSaving,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    refetch: fetchRoutines,
  };
}
