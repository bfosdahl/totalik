
CREATE TABLE public.ik_mat_dismissed_auto_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deviation_title TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dismissed_by_id UUID REFERENCES auth.users(id),
  UNIQUE(company_id, deviation_title)
);

ALTER TABLE public.ik_mat_dismissed_auto_deviations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dismissed items for their company"
ON public.ik_mat_dismissed_auto_deviations FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert dismissed items for their company"
ON public.ik_mat_dismissed_auto_deviations FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));
