
-- 1. user_departments: remove privilege-escalation policy
DROP POLICY IF EXISTS "Company members can manage department assignments" ON public.user_departments;

-- 2. ik_mat_daily_task_settings: restrict ALL to admins only
DROP POLICY IF EXISTS "Company admins can manage task settings" ON public.ik_mat_daily_task_settings;
CREATE POLICY "Company admins can manage task settings"
  ON public.ik_mat_daily_task_settings
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- 3. ks_module2_finances: add missing UPDATE / DELETE policies
CREATE POLICY "Users can update finances for their company"
  ON public.ks_module2_finances
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can delete finances for their company"
  ON public.ks_module2_finances
  FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

-- 4. Fix broken policies using profiles.id = auth.uid() across many tables.

-- admin_checklist_templates
DROP POLICY IF EXISTS "Users with company profile can view admin checklist templates" ON public.admin_checklist_templates;
CREATE POLICY "Users with company profile can view admin checklist templates"
  ON public.admin_checklist_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND get_user_company_id(auth.uid()) IS NOT NULL);

-- admin_project_type_templates
DROP POLICY IF EXISTS "Users with company profile can view admin project type template" ON public.admin_project_type_templates;
CREATE POLICY "Users with company profile can view admin project type template"
  ON public.admin_project_type_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND get_user_company_id(auth.uid()) IS NOT NULL);

-- admin_routine_templates
DROP POLICY IF EXISTS "Users with company profile can view admin routine templates" ON public.admin_routine_templates;
CREATE POLICY "Users with company profile can view admin routine templates"
  ON public.admin_routine_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND get_user_company_id(auth.uid()) IS NOT NULL);

-- content_translations
DROP POLICY IF EXISTS "Users can view translations for their company" ON public.content_translations;
DROP POLICY IF EXISTS "Users can create translations for their company" ON public.content_translations;
CREATE POLICY "Users can view translations for their company"
  ON public.content_translations FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create translations for their company"
  ON public.content_translations FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- customer_routine_instances
DROP POLICY IF EXISTS "Users can view own company routine instances" ON public.customer_routine_instances;
CREATE POLICY "Users can view own company routine instances"
  ON public.customer_routine_instances FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- hms_vernerunde_templates
DROP POLICY IF EXISTS "Company admins can create templates" ON public.hms_vernerunde_templates;
DROP POLICY IF EXISTS "Company admins can delete their templates" ON public.hms_vernerunde_templates;
DROP POLICY IF EXISTS "Company admins can update their templates" ON public.hms_vernerunde_templates;
DROP POLICY IF EXISTS "Users can view system templates and company templates" ON public.hms_vernerunde_templates;
CREATE POLICY "Company admins can create templates"
  ON public.hms_vernerunde_templates FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));
CREATE POLICY "Company admins can delete their templates"
  ON public.hms_vernerunde_templates FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND is_system_template = false AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));
CREATE POLICY "Company admins can update their templates"
  ON public.hms_vernerunde_templates FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));
CREATE POLICY "Users can view system templates and company templates"
  ON public.hms_vernerunde_templates FOR SELECT
  USING (is_system_template = true OR company_id = get_user_company_id(auth.uid()));

-- ik_alkohol_risk_control_history
DROP POLICY IF EXISTS "Users can insert history for their company" ON public.ik_alkohol_risk_control_history;
DROP POLICY IF EXISTS "Users can view history from their company" ON public.ik_alkohol_risk_control_history;
CREATE POLICY "Users can insert history for their company"
  ON public.ik_alkohol_risk_control_history FOR INSERT
  WITH CHECK (risk_control_id IN (SELECT id FROM ik_alkohol_risk_controls WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can view history from their company"
  ON public.ik_alkohol_risk_control_history FOR SELECT
  USING (risk_control_id IN (SELECT id FROM ik_alkohol_risk_controls WHERE company_id = get_user_company_id(auth.uid())));

-- ik_mat_scheduled_tasks
DROP POLICY IF EXISTS "Users can create scheduled tasks for their company" ON public.ik_mat_scheduled_tasks;
DROP POLICY IF EXISTS "Users can delete their company's scheduled tasks" ON public.ik_mat_scheduled_tasks;
DROP POLICY IF EXISTS "Users can update their company's scheduled tasks" ON public.ik_mat_scheduled_tasks;
DROP POLICY IF EXISTS "Users can view their company's scheduled tasks" ON public.ik_mat_scheduled_tasks;
CREATE POLICY "Users can create scheduled tasks for their company"
  ON public.ik_mat_scheduled_tasks FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view their company's scheduled tasks"
  ON public.ik_mat_scheduled_tasks FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- ik_mat_task_completions
DROP POLICY IF EXISTS "Users can create task completions for their company" ON public.ik_mat_task_completions;
DROP POLICY IF EXISTS "Users can delete their company's task completions" ON public.ik_mat_task_completions;
DROP POLICY IF EXISTS "Users can update their company's task completions" ON public.ik_mat_task_completions;
DROP POLICY IF EXISTS "Users can view their company's task completions" ON public.ik_mat_task_completions;
CREATE POLICY "Users can create task completions for their company"
  ON public.ik_mat_task_completions FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete their company's task completions"
  ON public.ik_mat_task_completions FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their company's task completions"
  ON public.ik_mat_task_completions FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view their company's task completions"
  ON public.ik_mat_task_completions FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- ks_calculation_items: dead duplicate policies — drop, correct ones already exist
DROP POLICY IF EXISTS "Users can create calculation items" ON public.ks_calculation_items;
DROP POLICY IF EXISTS "Users can delete calculation items" ON public.ks_calculation_items;
DROP POLICY IF EXISTS "Users can update calculation items" ON public.ks_calculation_items;
DROP POLICY IF EXISTS "Users can view calculation items" ON public.ks_calculation_items;

-- ks_module2_checklists
DROP POLICY IF EXISTS "Users can delete their company's custom checklists" ON public.ks_module2_checklists;
DROP POLICY IF EXISTS "Users can update their company's custom checklists" ON public.ks_module2_checklists;
DROP POLICY IF EXISTS "Users can view their company's custom checklists" ON public.ks_module2_checklists;
CREATE POLICY "Users can delete their company's custom checklists"
  ON public.ks_module2_checklists FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their company's custom checklists"
  ON public.ks_module2_checklists FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view their company's custom checklists"
  ON public.ks_module2_checklists FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- ks_module2_meetings
DROP POLICY IF EXISTS "Users can create meetings in their company" ON public.ks_module2_meetings;
DROP POLICY IF EXISTS "Users can delete meetings in their company" ON public.ks_module2_meetings;
DROP POLICY IF EXISTS "Users can update meetings in their company" ON public.ks_module2_meetings;
DROP POLICY IF EXISTS "Users can view meetings in their company" ON public.ks_module2_meetings;
CREATE POLICY "Users can create meetings in their company"
  ON public.ks_module2_meetings FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete meetings in their company"
  ON public.ks_module2_meetings FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update meetings in their company"
  ON public.ks_module2_meetings FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view meetings in their company"
  ON public.ks_module2_meetings FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- ks_safety_round_results
DROP POLICY IF EXISTS "Users can delete safety round results from their company" ON public.ks_safety_round_results;
DROP POLICY IF EXISTS "Users can update safety round results from their company" ON public.ks_safety_round_results;
DROP POLICY IF EXISTS "Users can view safety round results from their company" ON public.ks_safety_round_results;
CREATE POLICY "Users can delete safety round results from their company"
  ON public.ks_safety_round_results FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update safety round results from their company"
  ON public.ks_safety_round_results FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view safety round results from their company"
  ON public.ks_safety_round_results FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- ks_subcontractor_evaluations
DROP POLICY IF EXISTS "Company admins can delete evaluations" ON public.ks_subcontractor_evaluations;
DROP POLICY IF EXISTS "Users can create evaluations in their company" ON public.ks_subcontractor_evaluations;
DROP POLICY IF EXISTS "Users can update evaluations in their company" ON public.ks_subcontractor_evaluations;
DROP POLICY IF EXISTS "Users can view evaluations in their company" ON public.ks_subcontractor_evaluations;
CREATE POLICY "Company admins can delete evaluations"
  ON public.ks_subcontractor_evaluations FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));
CREATE POLICY "Users can create evaluations in their company"
  ON public.ks_subcontractor_evaluations FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update evaluations in their company"
  ON public.ks_subcontractor_evaluations FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can view evaluations in their company"
  ON public.ks_subcontractor_evaluations FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));
