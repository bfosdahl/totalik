ALTER TABLE public.work_schedules
  ADD COLUMN IF NOT EXISTS project_id uuid NULL REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_name text NULL;

CREATE INDEX IF NOT EXISTS idx_work_schedules_project_id ON public.work_schedules(project_id);