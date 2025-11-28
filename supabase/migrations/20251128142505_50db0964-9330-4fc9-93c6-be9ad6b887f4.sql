-- Create table for storing favorite accent colors per company
CREATE TABLE public.company_favorite_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, color)
);

-- Enable RLS
ALTER TABLE public.company_favorite_colors ENABLE ROW LEVEL SECURITY;

-- Users can view their company's favorite colors
CREATE POLICY "Users can view their company favorite colors"
ON public.company_favorite_colors
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Company admins can manage favorite colors
CREATE POLICY "Company admins can manage favorite colors"
ON public.company_favorite_colors
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- System admins can manage all
CREATE POLICY "System admins can manage all favorite colors"
ON public.company_favorite_colors
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));