
CREATE TABLE public.company_aarshjul_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-gray-500 text-white',
  responsible TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_aarshjul_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company aarshjul activities"
  ON public.company_aarshjul_activities FOR SELECT
  USING (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can insert aarshjul activities for their company"
  ON public.company_aarshjul_activities FOR INSERT
  WITH CHECK (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can update their company aarshjul activities"
  ON public.company_aarshjul_activities FOR UPDATE
  USING (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can delete their company aarshjul activities"
  ON public.company_aarshjul_activities FOR DELETE
  USING (company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()));
