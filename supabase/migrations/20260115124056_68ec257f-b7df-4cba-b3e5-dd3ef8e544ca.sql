-- Add new columns to work_schedules table
ALTER TABLE public.work_schedules 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shift_role TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_responsible BOOLEAN DEFAULT false;

-- Create shift_tasks table for tasks linked to shifts
CREATE TABLE public.shift_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.work_schedules(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'custom',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES public.profiles(id),
  completed_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create standard_work_schedules table for recurring/default schedules
CREATE TABLE public.standard_work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  shift_role TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, employee_id, day_of_week)
);

-- Enable RLS for shift_tasks
ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_tasks using is_company_admin function
CREATE POLICY "Users can view shift tasks for their company"
ON public.shift_tasks FOR SELECT
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Company admins can create shift tasks"
ON public.shift_tasks FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  ) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Users can update shift tasks in their company"
ON public.shift_tasks FOR UPDATE
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Company admins can delete shift tasks"
ON public.shift_tasks FOR DELETE
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  ) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Enable RLS for standard_work_schedules
ALTER TABLE public.standard_work_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for standard_work_schedules
CREATE POLICY "Users can view standard schedules for their company"
ON public.standard_work_schedules FOR SELECT
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Company admins can insert standard schedules"
ON public.standard_work_schedules FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  ) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can update standard schedules"
ON public.standard_work_schedules FOR UPDATE
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  ) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can delete standard schedules"
ON public.standard_work_schedules FOR DELETE
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  ) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Create indexes for better performance
CREATE INDEX idx_shift_tasks_schedule_id ON public.shift_tasks(schedule_id);
CREATE INDEX idx_shift_tasks_company_id ON public.shift_tasks(company_id);
CREATE INDEX idx_standard_work_schedules_employee_id ON public.standard_work_schedules(employee_id);
CREATE INDEX idx_standard_work_schedules_company_id ON public.standard_work_schedules(company_id);
CREATE INDEX idx_work_schedules_location ON public.work_schedules(location);

-- Add trigger for updated_at on shift_tasks
CREATE TRIGGER update_shift_tasks_updated_at
BEFORE UPDATE ON public.shift_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on standard_work_schedules
CREATE TRIGGER update_standard_work_schedules_updated_at
BEFORE UPDATE ON public.standard_work_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();