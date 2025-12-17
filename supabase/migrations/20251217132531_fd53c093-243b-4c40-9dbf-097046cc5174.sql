-- Create table for storing company laws and regulations
CREATE TABLE public.company_laws_regulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  law_name TEXT NOT NULL,
  description TEXT,
  link TEXT,
  category TEXT DEFAULT 'general',
  is_employee_based BOOLEAN DEFAULT false,
  employee_threshold INTEGER,
  is_manually_added BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_laws_regulations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company laws" 
ON public.company_laws_regulations 
FOR SELECT 
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their company laws" 
ON public.company_laws_regulations 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company laws" 
ON public.company_laws_regulations 
FOR UPDATE 
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company laws" 
ON public.company_laws_regulations 
FOR DELETE 
USING (
  company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_company_laws_company_id ON public.company_laws_regulations(company_id);

-- Create trigger for updated_at
CREATE TRIGGER update_company_laws_regulations_updated_at
BEFORE UPDATE ON public.company_laws_regulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();