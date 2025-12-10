-- Add project_type column to ks_module2_projects table
-- 'full' = standard KS Bygg project with all features
-- 'simple' = simplified project for small jobs (Mine prosjekter)
ALTER TABLE public.ks_module2_projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'full' CHECK (project_type IN ('full', 'simple'));

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_ks_module2_projects_type ON public.ks_module2_projects(project_type);

-- Comment for documentation
COMMENT ON COLUMN public.ks_module2_projects.project_type IS 'Project type: full = standard KS Bygg, simple = simplified Mine prosjekter';