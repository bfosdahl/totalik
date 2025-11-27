-- Create audits table
CREATE TABLE public.audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_number TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internal', 'external', 'routine')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'overdue')),
  scheduled_date DATE NOT NULL,
  area TEXT,
  responsible_id UUID REFERENCES public.profiles(id),
  responsible_name TEXT,
  description TEXT,
  checklist_total INTEGER NOT NULL DEFAULT 0,
  checklist_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Create policies for audits
CREATE POLICY "Users can view their company audits"
ON public.audits
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create audits in their company"
ON public.audits
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their company audits"
ON public.audits
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete their company audits"
ON public.audits
FOR DELETE
USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all audits"
ON public.audits
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_audits_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_audits_company_id ON public.audits(company_id);
CREATE INDEX idx_audits_status ON public.audits(status);
CREATE INDEX idx_audits_scheduled_date ON public.audits(scheduled_date);