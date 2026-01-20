-- Create table for KS organization/project management structure
CREATE TABLE public.company_ks_organization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  custom_content TEXT NOT NULL DEFAULT '{}',
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable Row Level Security
ALTER TABLE public.company_ks_organization ENABLE ROW LEVEL SECURITY;

-- Create policies for company access
CREATE POLICY "Users can view their company's KS organization" 
ON public.company_ks_organization 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can insert KS organization" 
ON public.company_ks_organization 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can update their KS organization" 
ON public.company_ks_organization 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can delete their KS organization" 
ON public.company_ks_organization 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_ks_organization_updated_at
BEFORE UPDATE ON public.company_ks_organization
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for KS system goals/målsetting (different from quality goals)
CREATE TABLE public.company_ks_system_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'ks_handbook',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_ks_system_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for company access
CREATE POLICY "Users can view their company's KS system goals" 
ON public.company_ks_system_goals 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can insert KS system goals" 
ON public.company_ks_system_goals 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can update their KS system goals" 
ON public.company_ks_system_goals 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can delete their KS system goals" 
ON public.company_ks_system_goals 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR public.is_system_admin(auth.uid())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_ks_system_goals_updated_at
BEFORE UPDATE ON public.company_ks_system_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();