
CREATE TABLE public.hr_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'medarbeidersamtale',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hr_meetings in their company"
  ON public.hr_meetings FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can insert hr_meetings"
  ON public.hr_meetings FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update hr_meetings"
  ON public.hr_meetings FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete hr_meetings"
  ON public.hr_meetings FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
