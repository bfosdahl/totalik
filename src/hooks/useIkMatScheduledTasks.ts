import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfDay, endOfDay, format, addDays, subDays, isToday, isBefore, parseISO } from 'date-fns';

export interface ScheduledTask {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  task_type: string;
  frequency: string;
  day_of_week: number[] | null;
  day_of_month: number[] | null;
  time_of_day: string | null;
  responsible: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  company_id: string;
  task_id: string;
  scheduled_date: string;
  completed_at: string | null;
  completed_by_id: string | null;
  completed_by_name: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  task?: ScheduledTask;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'temperature' | 'varemottak' | 'cleaning';
  status: 'pending' | 'completed' | 'overdue';
  taskId?: string;
  sourceId?: string;
  details?: any;
}

export const useIkMatScheduledTasks = () => {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all scheduled tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['ik-mat-scheduled-tasks', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('ik_mat_scheduled_tasks')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return (data || []) as ScheduledTask[];
    },
    enabled: !!company?.id,
  });

  // Fetch task completions for a date range
  const fetchCompletions = async (startDate: Date, endDate: Date) => {
    if (!company?.id) return [];

    const { data, error } = await supabase
      .from('ik_mat_task_completions')
      .select('*, task:ik_mat_scheduled_tasks(*)')
      .eq('company_id', company.id)
      .gte('scheduled_date', format(startDate, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(endDate, 'yyyy-MM-dd'));

    if (error) throw error;
    return (data || []) as TaskCompletion[];
  };

  // Fetch temperature logs for calendar
  const fetchTemperatureLogs = async (startDate: Date, endDate: Date) => {
    if (!company?.id) return [];

    const { data, error } = await supabase
      .from('ik_mat_temperature_logs')
      .select('*, equipment:ik_mat_temperature_equipment(name)')
      .eq('company_id', company.id)
      .gte('measured_at', startOfDay(startDate).toISOString())
      .lte('measured_at', endOfDay(endDate).toISOString());

    if (error) throw error;
    return data || [];
  };

  // Fetch varemottak for calendar
  const fetchVaremottak = async (startDate: Date, endDate: Date) => {
    if (!company?.id) return [];

    const { data, error } = await supabase
      .from('ik_mat_traceability_records')
      .select('*')
      .eq('company_id', company.id)
      .gte('receipt_date', format(startDate, 'yyyy-MM-dd'))
      .lte('receipt_date', format(endDate, 'yyyy-MM-dd'));

    if (error) throw error;
    return data || [];
  };

  // Fetch cleaning responses for calendar
  const fetchCleaningResponses = async (startDate: Date, endDate: Date) => {
    if (!company?.id) return [];

    const { data, error } = await supabase
      .from('ik_mat_cleaning_plan_responses')
      .select('*')
      .eq('company_id', company.id)
      .gte('created_at', startOfDay(startDate).toISOString())
      .lte('created_at', endOfDay(endDate).toISOString());

    if (error) throw error;
    return data || [];
  };

  // Get all calendar events for a date range
  const useCalendarEvents = (startDate: Date, endDate: Date) => {
    return useQuery({
      queryKey: ['ik-mat-calendar-events', company?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
      queryFn: async (): Promise<CalendarEvent[]> => {
        if (!company?.id) return [];

        const [completions, tempLogs, varemottak, cleaning] = await Promise.all([
          fetchCompletions(startDate, endDate),
          fetchTemperatureLogs(startDate, endDate),
          fetchVaremottak(startDate, endDate),
          fetchCleaningResponses(startDate, endDate),
        ]);

        const events: CalendarEvent[] = [];

        // Add task completions
        completions.forEach((completion) => {
          const scheduledDate = parseISO(completion.scheduled_date);
          events.push({
            id: completion.id,
            title: completion.task?.title || 'Oppgave',
            date: scheduledDate,
            type: 'task',
            status: completion.status === 'completed' ? 'completed' : 
                   (isBefore(scheduledDate, startOfDay(new Date())) ? 'overdue' : 'pending'),
            taskId: completion.task_id,
            sourceId: completion.id,
            details: completion,
          });
        });

        // Add temperature logs
        tempLogs.forEach((log: any) => {
          events.push({
            id: `temp-${log.id}`,
            title: `Temp: ${log.equipment?.name || 'Ukjent'} (${log.temperature}°C)`,
            date: new Date(log.measured_at),
            type: 'temperature',
            status: log.is_acceptable ? 'completed' : 'overdue',
            sourceId: log.id,
            details: log,
          });
        });

        // Add varemottak
        varemottak.forEach((record: any) => {
          events.push({
            id: `vare-${record.id}`,
            title: `Varemottak: ${record.product_name}`,
            date: parseISO(record.receipt_date),
            type: 'varemottak',
            status: 'completed',
            sourceId: record.id,
            details: record,
          });
        });

        // Add cleaning responses
        cleaning.forEach((response: any) => {
          events.push({
            id: `clean-${response.id}`,
            title: 'Renhold utført',
            date: new Date(response.created_at),
            type: 'cleaning',
            status: response.status === 'completed' ? 'completed' : 'pending',
            sourceId: response.id,
            details: response,
          });
        });

        return events;
      },
      enabled: !!company?.id,
    });
  };

  // Create a new scheduled task
  const createTask = useMutation({
    mutationFn: async (newTask: {
      title: string;
      description?: string;
      task_type: string;
      frequency: string;
      day_of_week?: number[];
      day_of_month?: number[];
      time_of_day?: string;
      responsible?: string;
    }) => {
      if (!company?.id) throw new Error('Mangler bedriftsinfo');

      const { data, error } = await supabase
        .from('ik_mat_scheduled_tasks')
        .insert({
          company_id: company.id,
          ...newTask,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-scheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      toast.success('Oppgave opprettet');
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
      toast.error('Kunne ikke opprette oppgave');
    },
  });

  // Update a task
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('ik_mat_scheduled_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-scheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      toast.success('Oppgave oppdatert');
    },
    onError: (error: Error) => {
      console.error('Error updating task:', error);
      toast.error('Kunne ikke oppdatere oppgave');
    },
  });

  // Delete a task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ik_mat_scheduled_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-scheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      toast.success('Oppgave slettet');
    },
    onError: (error: Error) => {
      console.error('Error deleting task:', error);
      toast.error('Kunne ikke slette oppgave');
    },
  });

  // Complete a task for a specific date
  const completeTask = useMutation({
    mutationFn: async ({ taskId, scheduledDate, notes }: { taskId: string; scheduledDate: Date; notes?: string }) => {
      if (!company?.id || !profile) throw new Error('Mangler brukerinfo');

      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Ukjent';

      // Check if completion already exists
      const { data: existing } = await supabase
        .from('ik_mat_task_completions')
        .select('id')
        .eq('task_id', taskId)
        .eq('scheduled_date', format(scheduledDate, 'yyyy-MM-dd'))
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('ik_mat_task_completions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by_id: profile.id,
            completed_by_name: displayName,
            notes,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new completion
        const { data, error } = await supabase
          .from('ik_mat_task_completions')
          .insert({
            company_id: company.id,
            task_id: taskId,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by_id: profile.id,
            completed_by_name: displayName,
            notes,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ik-mat-calendar-events'] });
      toast.success('Oppgave fullført');
    },
    onError: (error: Error) => {
      console.error('Error completing task:', error);
      toast.error('Kunne ikke fullføre oppgave');
    },
  });

  // Generate scheduled task instances for a date range
  const generateTaskInstances = (startDate: Date, endDate: Date, scheduledTasks: ScheduledTask[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dayOfMonth = currentDate.getDate();

      scheduledTasks.forEach((task) => {
        let shouldShow = false;

        switch (task.frequency) {
          case 'daily':
            shouldShow = true;
            break;
          case 'weekly':
            shouldShow = task.day_of_week?.includes(dayOfWeek) || false;
            break;
          case 'monthly':
          case 'periodisk':
            shouldShow = task.day_of_month?.includes(dayOfMonth) || false;
            break;
        }

        if (shouldShow) {
          events.push({
            id: `scheduled-${task.id}-${format(currentDate, 'yyyy-MM-dd')}`,
            title: task.title,
            date: new Date(currentDate),
            type: 'task',
            status: isBefore(currentDate, startOfDay(new Date())) ? 'overdue' : 'pending',
            taskId: task.id,
            details: task,
          });
        }
      });

      currentDate = addDays(currentDate, 1);
    }

    return events;
  };

  return {
    tasks,
    tasksLoading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    useCalendarEvents,
    generateTaskInstances,
  };
};
