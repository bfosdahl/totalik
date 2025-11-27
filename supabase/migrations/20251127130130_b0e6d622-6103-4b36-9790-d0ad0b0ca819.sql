-- Create table for company risk assessments
CREATE TABLE public.company_risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company risk assessments"
ON public.company_risk_assessments
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company risk assessments"
ON public.company_risk_assessments
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all risk assessments"
ON public.company_risk_assessments
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_company_risk_assessments_updated_at
BEFORE UPDATE ON public.company_risk_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();