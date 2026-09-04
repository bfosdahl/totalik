ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS project_number text,
  ADD COLUMN IF NOT EXISTS subproject text,
  ADD COLUMN IF NOT EXISTS tags text[];

UPDATE public.time_entries te
SET project_number = p.project_number
FROM public.ks_module2_projects p
WHERE te.ks_project_id = p.id
  AND te.project_number IS NULL
  AND p.project_number IS NOT NULL;