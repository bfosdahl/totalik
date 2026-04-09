ALTER TABLE public.ks_module2_projects DROP CONSTRAINT IF EXISTS ks_module2_projects_project_type_check;

UPDATE public.ks_module2_projects SET project_type = 'standard' WHERE project_type = 'full';
UPDATE public.ks_module2_projects SET project_type = 'small' WHERE project_type = 'simple';

ALTER TABLE public.ks_module2_projects ADD CONSTRAINT ks_module2_projects_project_type_check
  CHECK (project_type = ANY (ARRAY['standard'::text, 'small'::text, 'mini'::text]));