ALTER TABLE public.ks_module2_checklists 
ADD COLUMN IF NOT EXISTS include_in_report boolean NOT NULL DEFAULT true;