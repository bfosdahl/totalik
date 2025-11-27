-- Create deviations table
CREATE TABLE public.deviations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deviation_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('HMS', 'MAT', 'BYGG')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  assignee_id UUID REFERENCES public.profiles(id),
  assignee_name TEXT,
  reporter_id UUID REFERENCES public.profiles(id),
  reporter_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for deviation number per company
ALTER TABLE public.deviations ADD CONSTRAINT unique_deviation_number_per_company UNIQUE (company_id, deviation_number);

-- Enable Row Level Security
ALTER TABLE public.deviations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company deviations"
ON public.deviations
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create deviations in their company"
ON public.deviations
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their company deviations"
ON public.deviations
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete their company deviations"
ON public.deviations
FOR DELETE
USING ((company_id = get_user_company_id(auth.uid())) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all deviations"
ON public.deviations
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deviations_updated_at
BEFORE UPDATE ON public.deviations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_deviations_company_id ON public.deviations(company_id);
CREATE INDEX idx_deviations_status ON public.deviations(status);
CREATE INDEX idx_deviations_assignee_id ON public.deviations(assignee_id);