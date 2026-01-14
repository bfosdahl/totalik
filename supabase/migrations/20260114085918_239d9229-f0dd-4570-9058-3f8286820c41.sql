-- Create scheduled tasks table for cleaning and other recurring tasks
CREATE TABLE public.ik_mat_scheduled_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'cleaning', -- 'cleaning', 'temperature', 'inspection', 'other'
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'periodisk'
  day_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc. for weekly tasks
  day_of_month INTEGER[], -- for monthly tasks
  time_of_day TIME, -- optional specific time
  responsible TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task completions table to track when tasks are done
CREATE TABLE public.ik_mat_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.ik_mat_scheduled_tasks(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped', 'overdue'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ik_mat_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ik_mat_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_tasks
CREATE POLICY "Users can view their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create scheduled tasks for their company"
  ON public.ik_mat_scheduled_tasks FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS policies for task_completions
CREATE POLICY "Users can view their company's task completions"
  ON public.ik_mat_task_completions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create task completions for their company"
  ON public.ik_mat_task_completions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's task completions"
  ON public.ik_mat_task_completions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's task completions"
  ON public.ik_mat_task_completions FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_scheduled_tasks_company ON public.ik_mat_scheduled_tasks(company_id);
CREATE INDEX idx_task_completions_company ON public.ik_mat_task_completions(company_id);
CREATE INDEX idx_task_completions_task ON public.ik_mat_task_completions(task_id);
CREATE INDEX idx_task_completions_date ON public.ik_mat_task_completions(scheduled_date);

-- Update trigger for updated_at
CREATE TRIGGER update_ik_mat_scheduled_tasks_updated_at
  BEFORE UPDATE ON public.ik_mat_scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ik_mat_task_completions_updated_at
  BEFORE UPDATE ON public.ik_mat_task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();