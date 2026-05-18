import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartmentContext } from '@/contexts/DepartmentContext';
import { toast } from 'sonner';

export interface CustomCleaningTask {
  id: string;
  company_id: string;
  area: string;
  frequency: string;
  method: string;
  responsible: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCustomCleaningTasks = () => {
  const { company } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['custom-cleaning-tasks', company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];

      let q = supabase
        .from('ik_mat_custom_cleaning_tasks')
        .select('*')
        .eq('company_id', company.id);
      q = filterDepartmentId
        ? q.eq('department_id', filterDepartmentId)
        : q.is('department_id', null);
      const { data, error } = await q.order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as CustomCleaningTask[];
    },
    enabled: !!company?.id,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: {
      area: string;
      frequency: string;
      method: string;
      responsible: string;
    }) => {
      if (!company?.id) throw new Error('Mangler bedriftsinfo');

      const { data, error } = await supabase
        .from('ik_mat_custom_cleaning_tasks')
        .insert({
          company_id: company.id,
          department_id: filterDepartmentId,
          ...newTask,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cleaning-tasks'] });
      toast.success('Renholdsoppgave lagt til');
    },
    onError: (error: Error) => {
      console.error('Error creating cleaning task:', error);
      toast.error('Kunne ikke legge til oppgave');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CustomCleaningTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_mat_custom_cleaning_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cleaning-tasks'] });
      toast.success('Oppgave oppdatert');
    },
    onError: (error: Error) => {
      console.error('Error updating cleaning task:', error);
      toast.error('Kunne ikke oppdatere oppgave');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_custom_cleaning_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-cleaning-tasks'] });
      toast.success('Oppgave slettet');
    },
    onError: (error: Error) => {
      console.error('Error deleting cleaning task:', error);
      toast.error('Kunne ikke slette oppgave');
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};
