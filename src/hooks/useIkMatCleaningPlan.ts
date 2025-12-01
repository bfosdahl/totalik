import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CleaningRecord {
  area: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

export interface CleaningPlanResponse {
  id: string;
  company_id: string;
  completed_by_id: string | null;
  completed_by_name: string;
  completed_at: string | null;
  status: string;
  cleaning_records: CleaningRecord[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useIkMatCleaningPlan = () => {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useQuery({
    queryKey: ['ik-mat-cleaning-plan-responses', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('ik_mat_cleaning_plan_responses')
        .select('*')
        .eq('company_id', company.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CleaningPlanResponse[];
    },
    enabled: !!company?.id,
  });

  const createResponse = useMutation({
    mutationFn: async (newResponse: {
      cleaning_records: CleaningRecord[];
      notes?: string;
      status: string;
    }) => {
      if (!company?.id || !user) {
        throw new Error('Mangler bruker eller bedriftsinfo');
      }

      const { data, error } = await supabase
        .from('ik_mat_cleaning_plan_responses')
        .insert({
          company_id: company.id,
          completed_by_id: user.id,
          completed_by_name: user.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
            : user.email || 'Ukjent bruker',
          cleaning_records: newResponse.cleaning_records as any,
          notes: newResponse.notes || null,
          status: newResponse.status,
          completed_at: newResponse.status === 'completed' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-cleaning-plan-responses'] });
      toast.success('Renholdsplan lagret!');
    },
    onError: (error: Error) => {
      console.error('Error creating cleaning plan response:', error);
      toast.error('Kunne ikke lagre renholdsplan');
    },
  });

  const updateResponse = useMutation({
    mutationFn: async ({
      id,
      cleaning_records,
      notes,
      status,
    }: {
      id: string;
      cleaning_records: CleaningRecord[];
      notes?: string;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('ik_mat_cleaning_plan_responses')
        .update({
          cleaning_records: cleaning_records as any,
          notes: notes || null,
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-cleaning-plan-responses'] });
      toast.success('Renholdsplan oppdatert!');
    },
    onError: (error: Error) => {
      console.error('Error updating cleaning plan response:', error);
      toast.error('Kunne ikke oppdatere renholdsplan');
    },
  });

  const deleteResponse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_cleaning_plan_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-cleaning-plan-responses'] });
      toast.success('Renholdsplan slettet');
    },
    onError: (error: Error) => {
      console.error('Error deleting cleaning plan response:', error);
      toast.error('Kunne ikke slette renholdsplan');
    },
  });

  return {
    responses,
    isLoading,
    createResponse,
    updateResponse,
    deleteResponse,
  };
};
