import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useIkMatDeviation } from "./useIkMatDeviation";

export interface CheckpointResponse {
  checkpoint: string;
  status: 'ok' | 'not_ok' | 'na';
  comment?: string;
}

export interface ChecklistResponse {
  id: string;
  company_id: string;
  checklist_type: string;
  checklist_name: string;
  completed_by_id: string | null;
  completed_by_name: string;
  completed_at: string;
  status: 'draft' | 'completed';
  responses: CheckpointResponse[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useIkMatChecklistResponses() {
  const { profile } = useAuth();
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const { createChecklistDeviation } = useIkMatDeviation();
  const [isLoading, setIsLoading] = useState(true);

  const fetchResponses = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('ik_mat_checklist_responses')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setResponses((data || []) as unknown as ChecklistResponse[]);
    } catch (error) {
      console.error('Error fetching checklist responses:', error);
      toast.error('Kunne ikke laste sjekklisteresponser');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [profile?.company_id]);

  const createResponse = async (
    checklistType: string,
    checklistName: string,
    checkpoints: string[]
  ) => {
    if (!profile?.company_id || !profile?.id) {
      toast.error('Du må være logget inn');
      return null;
    }

    try {
      const initialResponses: CheckpointResponse[] = checkpoints.map(cp => ({
        checkpoint: cp,
        status: 'na' as const,
        comment: ''
      }));

      const { data, error } = await supabase
        .from('ik_mat_checklist_responses')
        .insert({
          company_id: profile.company_id,
          checklist_type: checklistType,
          checklist_name: checklistName,
          completed_by_id: profile.id,
          completed_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          status: 'draft' as const,
          responses: initialResponses as any
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Sjekkliste startet');
      await fetchResponses();
      return data as unknown as ChecklistResponse;
    } catch (error) {
      console.error('Error creating checklist response:', error);
      toast.error('Kunne ikke starte sjekkliste');
      return null;
    }
  };

  const updateResponse = async (
    id: string,
    checkpointResponses: CheckpointResponse[],
    status: 'draft' | 'completed',
    notes?: string,
    checklistName?: string
  ) => {
    try {
      const { error } = await supabase
        .from('ik_mat_checklist_responses')
        .update({
          responses: checkpointResponses as any,
          status,
          notes,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('id', id);

      if (error) throw error;

      // Auto-create deviation if completed with failed checkpoints
      if (status === 'completed') {
        const failedCheckpoints = checkpointResponses
          .filter(r => r.status === 'not_ok')
          .map(r => ({ checkpoint: r.checkpoint, comment: r.comment }));
        
        if (failedCheckpoints.length > 0 && checklistName) {
          await createChecklistDeviation(checklistName, failedCheckpoints);
        }
      }

      toast.success(status === 'completed' ? 'Sjekkliste fullført' : 'Sjekkliste lagret');
      await fetchResponses();
      return true;
    } catch (error) {
      console.error('Error updating checklist response:', error);
      toast.error('Kunne ikke lagre sjekkliste');
      return false;
    }
  };

  const deleteResponse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ik_mat_checklist_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Sjekkliste slettet');
      await fetchResponses();
      return true;
    } catch (error) {
      console.error('Error deleting checklist response:', error);
      toast.error('Kunne ikke slette sjekkliste');
      return false;
    }
  };

  return {
    responses,
    isLoading,
    createResponse,
    updateResponse,
    deleteResponse,
    refetch: fetchResponses
  };
}