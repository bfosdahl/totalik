import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfDay, endOfDay, format, addDays, subDays, isToday, isBefore, parseISO, isSameDay } from 'date-fns';
import { useCompanyModules } from './useCompanyModules';

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
  actionUrl?: string;
}

export const useIkMatScheduledTasks = () => {
  const { company, profile } = useAuth();
  const { modules } = useCompanyModules();
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

  // Fetch temperature equipment for generating pending tasks
  const { data: temperatureEquipment } = useQuery({
    queryKey: ['ik-mat-temperature-equipment-for-calendar', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('ik_mat_temperature_equipment')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Fetch custom cleaning tasks
  const { data: cleaningTasks } = useQuery({
    queryKey: ['custom-cleaning-tasks-for-calendar', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('ik_mat_custom_cleaning_tasks')
        .select('*')
        .eq('company_id', company.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Get generated cleaning plan from module settings
  const generatedCleaningPlan = (() => {
    const ikMatModule = modules?.find(m => m.module_type === 'IK_MAT');
    if (ikMatModule?.settings) {
      const settings = ikMatModule.settings as any;
      return settings.generatedContent?.cleaningPlan || [];
    }
    return [];
  })();

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
      queryKey: ['ik-mat-calendar-events', company?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), temperatureEquipment?.length, cleaningTasks?.length, generatedCleaningPlan?.length],
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

        // Add temperature logs (completed measurements)
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

        // Generate pending temperature tasks for equipment that hasn't been logged
        if (temperatureEquipment && temperatureEquipment.length > 0) {
          let currentDate = startOfDay(startDate);
          const end = startOfDay(endDate);

          while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            const dateStr = format(currentDate, 'yyyy-MM-dd');

            temperatureEquipment.forEach((equip: any) => {
              // Only show tasks from the day AFTER equipment was created
              const equipCreatedDate = equip.created_at ? startOfDay(addDays(new Date(equip.created_at), 1)) : null;
              if (equipCreatedDate && isBefore(currentDate, equipCreatedDate)) return;

              let shouldShow = false;

              // Check frequency
              if (equip.measurement_frequency === 'daily' || equip.measurement_frequency === 'twice_daily') {
                shouldShow = true;
              } else if (equip.measurement_frequency === 'weekly') {
                // Show on Mondays for weekly
                shouldShow = dayOfWeek === 1;
              }

              if (shouldShow) {
                // Check if already logged this day
                const alreadyLogged = tempLogs.some((log: any) => 
                  log.equipment_id === equip.id && 
                  isSameDay(new Date(log.measured_at), currentDate)
                );

                if (!alreadyLogged) {
                  const isPast = isBefore(startOfDay(currentDate), startOfDay(new Date()));
                  events.push({
                    id: `temp-pending-${equip.id}-${dateStr}`,
                    title: `🌡️ ${equip.name}`,
                    date: new Date(currentDate),
                    type: 'temperature',
                    status: isPast ? 'overdue' : 'pending',
                    sourceId: equip.id,
                    actionUrl: `/ik-mat/kontroll?tab=temperatur&action=log-temp&equipment=${equip.id}`,
                    details: { equipment: equip },
                  });
                }
              }
            });

            currentDate = addDays(currentDate, 1);
          }
        }

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

        // Add cleaning responses (completed)
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

        // Generate pending cleaning tasks
        const allCleaningTasks = [...(cleaningTasks || []), ...generatedCleaningPlan];
        if (allCleaningTasks.length > 0) {
          let currentDate = startOfDay(startDate);
          const end = startOfDay(endDate);

          while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            const dateStr = format(currentDate, 'yyyy-MM-dd');

            // Group by frequency - only show one "cleaning" task per frequency per day
            const frequencies = new Set(allCleaningTasks.map((t: any) => t.frequency || 'daglig'));

            frequencies.forEach((frequency) => {
              let shouldShow = false;

              const freqLower = (frequency as string).toLowerCase();
              if (freqLower === 'daglig' || freqLower === 'daily') {
                shouldShow = true;
              } else if (freqLower === 'ukentlig' || freqLower === 'weekly') {
                shouldShow = dayOfWeek === 1; // Mondays
              } else if (freqLower === 'månedlig' || freqLower === 'monthly') {
                shouldShow = currentDate.getDate() === 1; // 1st of month
              }

              if (shouldShow) {
                // Check if cleaning was logged for this frequency this day
                // Need to normalize frequency comparison (daglig/daily, ukentlig/weekly, etc.)
                const normalizeFreq = (f: string) => {
                  const lower = (f || '').toLowerCase();
                  if (lower === 'daglig' || lower === 'daily') return 'daily';
                  if (lower === 'ukentlig' || lower === 'weekly') return 'weekly';
                  if (lower === 'månedlig' || lower === 'monthly') return 'monthly';
                  return lower;
                };
                
                const alreadyLogged = cleaning.some((c: any) => 
                  isSameDay(new Date(c.created_at), currentDate) &&
                  (normalizeFreq(c.frequency_type) === normalizeFreq(frequency as string) || !c.frequency_type)
                );

                if (!alreadyLogged) {
                  const isPast = isBefore(startOfDay(currentDate), startOfDay(new Date()));
                  const taskCount = allCleaningTasks.filter((t: any) => 
                    (t.frequency || 'daglig').toLowerCase() === freqLower
                  ).length;

                  events.push({
                    id: `clean-pending-${frequency}-${dateStr}`,
                    title: `🧹 Renhold (${taskCount} oppgaver)`,
                    date: new Date(currentDate),
                    type: 'cleaning',
                    status: isPast ? 'overdue' : 'pending',
                    actionUrl: `/ik-mat/kontroll?tab=renholdsplan`,
                    details: { frequency, taskCount },
                  });
                }
              }
            });

            currentDate = addDays(currentDate, 1);
          }
        }

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
          // Only show tasks from the day AFTER task was created
          const taskCreatedDate = task.created_at ? startOfDay(addDays(new Date(task.created_at), 1)) : null;
          if (taskCreatedDate && isBefore(currentDate, taskCreatedDate)) return;

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
