-- Fix RLS for company_modules to allow system admins to insert modules for any company
-- The previous policy only allowed inserting for own company

-- First, drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Company members can create IK modules" ON company_modules;

-- Create a comprehensive insert policy that allows:
-- 1. System admins to insert any module for any company
-- 2. Company admins to insert any module for their own company  
-- 3. Regular members to insert IK_HMS/IK_MAT for their own company
CREATE POLICY "Users and admins can create modules"
ON company_modules
FOR INSERT
WITH CHECK (
  is_system_admin(auth.uid()) 
  OR (
    company_id = get_user_company_id(auth.uid()) 
    AND (
      is_company_admin(auth.uid())
      OR module_type = ANY (ARRAY['IK_HMS'::text, 'IK_MAT'::text])
    )
  )
);