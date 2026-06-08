
ALTER TABLE public.company_ks_routines 
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.ks_module2_routines 
  ADD COLUMN IF NOT EXISTS source_routine_id uuid REFERENCES public.company_ks_routines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ks_module2_routines_source ON public.ks_module2_routines(source_routine_id);
CREATE INDEX IF NOT EXISTS idx_company_ks_routines_hidden ON public.company_ks_routines(company_id, is_hidden);
