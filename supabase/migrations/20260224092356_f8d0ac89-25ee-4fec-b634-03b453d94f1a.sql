
-- Store custom month placements for default activities per company
CREATE TABLE public.company_aarshjul_default_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  custom_months INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, activity_id)
);

ALTER TABLE public.company_aarshjul_default_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view overrides for their company"
  ON public.company_aarshjul_default_overrides FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert overrides for their company"
  ON public.company_aarshjul_default_overrides FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update overrides for their company"
  ON public.company_aarshjul_default_overrides FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete overrides for their company"
  ON public.company_aarshjul_default_overrides FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
