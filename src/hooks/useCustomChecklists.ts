import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartmentContext } from '@/contexts/DepartmentContext';
import { toast } from 'sonner';

export interface CustomChecklist {
  id: string;
  company_id: string;
  checklist_name: string;
  checklist_type: string;
  description: string | null;
  checkpoints: string[];
  created_at: string;
  updated_at: string;
}

export const useCustomChecklists = () => {
  const { company } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['custom-checklists', company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];

      let q = supabase
        .from('ik_mat_custom_checklists')
        .select('*')
        .eq('company_id', company.id);
      q = filterDepartmentId
        ? q.eq('department_id', filterDepartmentId)
        : q.is('department_id', null);
      const { data, error } = await q.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CustomChecklist[];
    },
    enabled: !!company?.id,
  });

  const createChecklist = useMutation({
    mutationFn: async (newChecklist: {
      checklist_name: string;
      description?: string;
      checkpoints: string[];
    }) => {
      if (!company?.id) throw new Error('Mangler bedriftsinfo');

      const { data, error } = await supabase
        .from('ik_mat_custom_checklists')
        .insert({
          company_id: company.id,
          department_id: filterDepartmentId,
          checklist_name: newChecklist.checklist_name,
          description: newChecklist.description || null,
          checkpoints: newChecklist.checkpoints as any,
          checklist_type: 'custom',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-checklists'] });
      toast.success('Sjekkliste opprettet');
    },
    onError: (error: Error) => {
      console.error('Error creating checklist:', error);
      toast.error('Kunne ikke opprette sjekkliste');
    },
  });

  const updateChecklist = useMutation({
    mutationFn: async ({
      id,
      checklist_name,
      description,
      checkpoints,
    }: {
      id: string;
      checklist_name?: string;
      description?: string;
      checkpoints?: string[];
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (checklist_name) updates.checklist_name = checklist_name;
      if (description !== undefined) updates.description = description;
      if (checkpoints) updates.checkpoints = checkpoints;

      const { data, error } = await supabase
        .from('ik_mat_custom_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-checklists'] });
      toast.success('Sjekkliste oppdatert');
    },
    onError: (error: Error) => {
      console.error('Error updating checklist:', error);
      toast.error('Kunne ikke oppdatere sjekkliste');
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_custom_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-checklists'] });
      toast.success('Sjekkliste slettet');
    },
    onError: (error: Error) => {
      console.error('Error deleting checklist:', error);
      toast.error('Kunne ikke slette sjekkliste');
    },
  });

  return {
    checklists,
    isLoading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
  };
};
