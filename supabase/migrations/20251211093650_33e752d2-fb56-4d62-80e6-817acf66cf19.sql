-- Drop existing policies for company_modules
DROP POLICY IF EXISTS "System admins can manage all modules" ON public.company_modules;
DROP POLICY IF EXISTS "Company admins can manage their company modules" ON public.company_modules;
DROP POLICY IF EXISTS "Users can view their company modules" ON public.company_modules;

-- Recreate policies with correct logic

-- System admins can do everything on all modules
CREATE POLICY "System admins can manage all modules" 
ON public.company_modules 
FOR ALL 
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Company admins can manage their own company's modules
CREATE POLICY "Company admins can manage their company modules" 
ON public.company_modules 
FOR ALL 
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_company_admin(auth.uid())
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND is_company_admin(auth.uid())
);

-- All users can view their company's modules
CREATE POLICY "Users can view their company modules" 
ON public.company_modules 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));