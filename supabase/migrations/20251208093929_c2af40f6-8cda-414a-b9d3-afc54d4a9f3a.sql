-- Fix admin templates RLS policies to require authenticated users with company profile
-- Drop existing overly permissive SELECT policies

DROP POLICY IF EXISTS "Admin templates are viewable by authenticated users" ON admin_checklist_templates;
DROP POLICY IF EXISTS "Admin routine templates are viewable by authenticated users" ON admin_routine_templates;
DROP POLICY IF EXISTS "Admin project type templates are viewable by authenticated users" ON admin_project_type_templates;
DROP POLICY IF EXISTS "Anyone can view active admin checklist templates" ON admin_checklist_templates;
DROP POLICY IF EXISTS "Anyone can view active admin routine templates" ON admin_routine_templates;
DROP POLICY IF EXISTS "Anyone can view active admin project type templates" ON admin_project_type_templates;

-- Create more restrictive SELECT policies requiring user to have a company profile
CREATE POLICY "Users with company profile can view admin checklist templates"
ON admin_checklist_templates
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id IS NOT NULL
  )
);

CREATE POLICY "Users with company profile can view admin routine templates"
ON admin_routine_templates
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id IS NOT NULL
  )
);

CREATE POLICY "Users with company profile can view admin project type templates"
ON admin_project_type_templates
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id IS NOT NULL
  )
);