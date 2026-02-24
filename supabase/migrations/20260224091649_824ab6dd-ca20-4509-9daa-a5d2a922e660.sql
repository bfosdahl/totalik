
CREATE TABLE public.company_aarshjul_hidden_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  hidden_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, activity_id)
);

ALTER TABLE public.company_aarshjul_hidden_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hidden defaults for their company"
  ON public.company_aarshjul_hidden_defaults FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can hide defaults for their company"
  ON public.company_aarshjul_hidden_defaults FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unhide defaults for their company"
  ON public.company_aarshjul_hidden_defaults FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
