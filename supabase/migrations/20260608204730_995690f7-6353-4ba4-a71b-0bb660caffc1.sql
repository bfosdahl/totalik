ALTER TABLE public.company_ks_routines
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_company_ks_routines_company_hidden
  ON public.company_ks_routines (company_id, is_hidden)
  WHERE is_deleted IS NOT TRUE;