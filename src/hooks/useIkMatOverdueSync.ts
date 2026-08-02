import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIkMatScheduledTasks } from './useIkMatScheduledTasks';
import { useDeviations } from './useDeviations';
import { format, subDays, startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';

type CleaningTaskLike = { created_at?: string; frequency?: string | null };

/**
 * Syncs overdue Kontroll tasks to the deviations table as ik_mat deviations.
 * Runs once per page load, creates deviations for overdue tasks that don't already have one.
 */
export function useIkMatOverdueSync() {
  const { company, profile } = useAuth();
  const { deviations, refetch } = useDeviations();
  const hasSynced = useRef(false);

  const syncOverdueToDeviations = useCallback(async () => {
    if (!company?.id || !profile || hasSynced.current) return;
    hasSynced.current = true;

    try {
      // Fetch overdue data: temperature equipment not logged, cleaning not done, task completions missed
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      const lookbackStart = subDays(today, 30); // Check last 30 days
      const lookbackStr = format(lookbackStart, "yyyy-MM-dd'T'HH:mm:ss");
      const todayEndStr = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");

      // 1. Get temperature equipment
      const { data: equipment } = await supabase
        .from('ik_mat_temperature_equipment')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);

      // 2. Get temperature logs for the period (using local time strings)
      const { data: tempLogs } = await supabase
        .from('ik_mat_temperature_logs')
        .select('equipment_id, measured_at')
        .eq('company_id', company.id)
        .gte('measured_at', lookbackStr)
        .lte('measured_at', todayEndStr);

      // 3. Get existing ik_mat deviations to avoid duplicates
      const { data: existingDeviations } = await supabase
        .from('deviations')
        .select('title, created_at, category')
        .eq('company_id', company.id)
        .eq('type', 'ik_mat')
        .gte('created_at', lookbackStr);

      // 3b. Get dismissed auto-deviations (deleted by user, should not be re-created)
      const { data: dismissedItems } = await supabase
        .from('ik_mat_dismissed_auto_deviations')
        .select('deviation_title')
        .eq('company_id', company.id);

      const dismissedTitles = new Set(
        (dismissedItems || []).map(d => d.deviation_title)
      );

      const existingTitles = new Set(
        (existingDeviations || []).map(d => `${d.title}__${format(new Date(d.created_at), 'yyyy-MM-dd')}`)
      );

      const reporterName = [profile.first_name, profile.last_name]
        .filter(Boolean).join(' ') || profile.email || 'System';

      type NewDeviation = {
        company_id: string;
        title: string;
        description: string;
        category: string;
        type: string;
        priority: string;
        status: string;
        reporter_id: string;
        reporter_name: string;
        due_date: string;
        department_id: string | null;
        additional_info: string;
      };
      const newDeviations: NewDeviation[] = [];

      // Check for missed temperature logs
      if (equipment && equipment.length > 0) {
        const tempLogSet = new Set(
          (tempLogs || []).map((l: { equipment_id: string | null; measured_at: string }) => `${l.equipment_id}__${format(new Date(l.measured_at), 'yyyy-MM-dd')}`)
        );

        let currentDate = new Date(lookbackStart);
        while (currentDate < today) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const dayOfWeek = currentDate.getDay();

          for (const equip of equipment) {
            // Only check from the day AFTER equipment was created
            const equipCreatedAt = equip.created_at;
            if (equipCreatedAt) {
              const equipStartDate = startOfDay(new Date(new Date(equipCreatedAt).getTime() + 86400000));
              if (currentDate < equipStartDate) continue;
            }

            let shouldCheck = false;
            const freq = equip.measurement_frequency;
            if (freq === 'daily' || freq === 'twice_daily') shouldCheck = true;
            else if (freq === 'weekly') shouldCheck = dayOfWeek === 1;

            if (shouldCheck) {
              const key = `${equip.id}__${dateStr}`;
              if (!tempLogSet.has(key)) {
                const title = `Temperaturlogg ikke utført: ${equip.name} (${dateStr})`;
                const dedupeKey = `${title}__${dateStr}`;
                if (!existingTitles.has(dedupeKey) && !dismissedTitles.has(title)) {
                  existingTitles.add(dedupeKey);
                  const dueDate = new Date(currentDate);
                  dueDate.setDate(dueDate.getDate() + 3);
                  newDeviations.push({
                    company_id: company.id,

                    title,
                    description: `Temperaturlogg for ${equip.name} ble ikke utført ${dateStr}. Dette er et automatisk registrert avvik fra Kontroll-modulen.`,
                    category: 'temperature',
                    type: 'ik_mat',
                    priority: 'medium',
                    status: 'open',
                    reporter_id: profile.id,
                    reporter_name: reporterName,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    department_id: profile.primary_department_id || null,
                    additional_info: 'Automatisk opprettet fra Kontroll',
                  });
                }
              }
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // 5. Check for missed cleaning tasks
      const { data: cleaningResponses } = await supabase
        .from('ik_mat_cleaning_plan_responses')
        .select('created_at, frequency_type')
        .eq('company_id', company.id)
        .gte('created_at', lookbackStart.toISOString());

      const { data: moduleData } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', company.id)
        .eq('module_type', 'IK_MAT')
        .single();

      const cleaningPlan = (moduleData?.settings as { generatedContent?: { cleaningPlan?: CleaningTaskLike[] } } | null)?.generatedContent?.cleaningPlan || [];
      const { data: customCleaningTasks } = await supabase
        .from('ik_mat_custom_cleaning_tasks')
        .select('*')
        .eq('company_id', company.id);

      const allCleaningTasks = [...(customCleaningTasks || []), ...cleaningPlan];
      
      if (allCleaningTasks.length > 0) {
        const cleaningLogSet = new Set(
          (cleaningResponses || []).map((c: { created_at: string }) => format(new Date(c.created_at), 'yyyy-MM-dd'))
        );

        // Determine earliest cleaning task creation date (only check from the day after)
        const earliestCleaningDate = customCleaningTasks && customCleaningTasks.length > 0
          ? startOfDay(new Date(Math.min(...customCleaningTasks.map((t: { created_at: string }) => new Date(t.created_at).getTime())) + 86400000))
          : moduleData?.settings ? startOfDay(new Date()) : lookbackStart;
        
        let currentDate = new Date(Math.max(lookbackStart.getTime(), earliestCleaningDate.getTime()));
        while (currentDate < today) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const dayOfWeek = currentDate.getDay();

          // Check daily cleaning
          const hasDailyTasks = allCleaningTasks.some((t: CleaningTaskLike) => {
            const f = (t.frequency || 'daglig').toLowerCase();
            return f === 'daglig' || f === 'daily';
          });

          if (hasDailyTasks && !cleaningLogSet.has(dateStr)) {
            const title = `Renhold ikke utført (${dateStr})`;
            const dedupeKey = `${title}__${dateStr}`;
            if (!existingTitles.has(dedupeKey) && !dismissedTitles.has(title)) {
              existingTitles.add(dedupeKey);
              const dueDate = new Date(currentDate);
              dueDate.setDate(dueDate.getDate() + 3);
              newDeviations.push({
                company_id: company.id,

                title,
                description: `Daglig renhold ble ikke registrert som utført ${dateStr}. Automatisk registrert fra Kontroll-modulen.`,
                category: 'cleaning',
                type: 'ik_mat',
                priority: 'medium',
                status: 'open',
                reporter_id: profile.id,
                reporter_name: reporterName,
                due_date: format(dueDate, 'yyyy-MM-dd'),
                department_id: profile.primary_department_id || null,
                additional_info: 'Automatisk opprettet fra Kontroll',
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // 6. Check for missed scheduled tasks (from ik_mat_scheduled_tasks)
      const { data: scheduledTasks } = await supabase
        .from('ik_mat_scheduled_tasks')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true);

      if (scheduledTasks && scheduledTasks.length > 0) {
        const { data: completions } = await supabase
          .from('ik_mat_task_completions')
          .select('task_id, scheduled_date, status')
          .eq('company_id', company.id)
          .gte('scheduled_date', format(lookbackStart, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(today, 'yyyy-MM-dd'));

        const completedSet = new Set(
          (completions || [])
            .filter((c: { status: string | null }) => c.status === 'completed')
            .map((c: { task_id: string; scheduled_date: string }) => `${c.task_id}__${c.scheduled_date}`)
        );

        for (const task of scheduledTasks) {
          // Only check from the day AFTER task was created
          const taskCreatedAt = task.created_at;
          const taskStartDate = taskCreatedAt 
            ? startOfDay(new Date(new Date(taskCreatedAt).getTime() + 86400000))
            : lookbackStart;

          let currentDate = new Date(Math.max(lookbackStart.getTime(), taskStartDate.getTime()));
          while (currentDate < today) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const dayOfWeek = currentDate.getDay();
            let shouldCheck = false;

            const freq = (task.frequency || '').toLowerCase();
            if (freq === 'daglig' || freq === 'daily') shouldCheck = true;
            else if (freq === 'ukentlig' || freq === 'weekly') {
              shouldCheck = task.day_of_week?.includes(dayOfWeek) ?? dayOfWeek === 1;
            } else if (freq === 'månedlig' || freq === 'monthly') {
              shouldCheck = task.day_of_month?.includes(currentDate.getDate()) ?? currentDate.getDate() === 1;
            }

            if (shouldCheck) {
              const key = `${task.id}__${dateStr}`;
              if (!completedSet.has(key)) {
                const title = `Oppgave ikke utført: ${task.title} (${dateStr})`;
                const dedupeKey = `${title}__${dateStr}`;
                if (!existingTitles.has(dedupeKey) && !dismissedTitles.has(title)) {
                  existingTitles.add(dedupeKey);
                  const dueDate = new Date(currentDate);
                  dueDate.setDate(dueDate.getDate() + 3);
                  newDeviations.push({
                    company_id: company.id,

                    title,
                    description: `Planlagt oppgave "${task.title}" ble ikke utført ${dateStr}. Automatisk registrert fra Kontroll-modulen.`,
                    category: 'other',
                    type: 'ik_mat',
                    priority: 'medium',
                    status: 'open',
                    reporter_id: profile.id,
                    reporter_name: reporterName,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    department_id: profile.primary_department_id || null,
                    additional_info: 'Automatisk opprettet fra Kontroll',
                  });
                }
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }

      // Batch insert new deviations (max 50 at a time to avoid overload)
      if (newDeviations.length > 0) {
        const batch = newDeviations.slice(0, 50);
        const { error } = await supabase
          .from('deviations')
          // deviation_number genereres av databasetrigger
          .insert(batch as unknown as never[]);

        if (error) {
          console.error('Error syncing overdue tasks to deviations:', error);
        } else {
          await refetch();
        }
      }
    } catch (error) {
      console.error('Error in overdue sync:', error);
    }
  }, [company?.id, profile, refetch]);

  useEffect(() => {
    syncOverdueToDeviations();
  }, [syncOverdueToDeviations]);

  return { syncOverdueToDeviations };
}
