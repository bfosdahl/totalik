
-- Fix broken RLS policies on ks_module2_hms_plans
-- The old policies use pr.id = auth.uid() but should use pr.user_id = auth.uid()

DROP POLICY IF EXISTS "Users can view HMS plans for their company projects" ON public.ks_module2_hms_plans;
DROP POLICY IF EXISTS "Users can insert HMS plans for their company projects" ON public.ks_module2_hms_plans;
DROP POLICY IF EXISTS "Users can update HMS plans for their company projects" ON public.ks_module2_hms_plans;
DROP POLICY IF EXISTS "Users can delete HMS plans for their company projects" ON public.ks_module2_hms_plans;

CREATE POLICY "Users can view HMS plans for their company projects"
ON public.ks_module2_hms_plans FOR SELECT
USING (project_id IN (
  SELECT p.id FROM ks_module2_projects p
  JOIN profiles pr ON pr.company_id = p.company_id
  WHERE pr.user_id = auth.uid()
));

CREATE POLICY "Users can insert HMS plans for their company projects"
ON public.ks_module2_hms_plans FOR INSERT
WITH CHECK (project_id IN (
  SELECT p.id FROM ks_module2_projects p
  JOIN profiles pr ON pr.company_id = p.company_id
  WHERE pr.user_id = auth.uid()
));

CREATE POLICY "Users can update HMS plans for their company projects"
ON public.ks_module2_hms_plans FOR UPDATE
USING (project_id IN (
  SELECT p.id FROM ks_module2_projects p
  JOIN profiles pr ON pr.company_id = p.company_id
  WHERE pr.user_id = auth.uid()
));

CREATE POLICY "Users can delete HMS plans for their company projects"
ON public.ks_module2_hms_plans FOR DELETE
USING (project_id IN (
  SELECT p.id FROM ks_module2_projects p
  JOIN profiles pr ON pr.company_id = p.company_id
  WHERE pr.user_id = auth.uid()
));
