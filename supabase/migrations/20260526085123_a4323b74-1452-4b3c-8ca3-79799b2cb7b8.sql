
-- 1. employee_absence
DROP POLICY IF EXISTS "Users can view absence in their company" ON public.employee_absence;
CREATE POLICY "Employees and admins can view absence"
ON public.employee_absence
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR public.is_hms_responsible(auth.uid())
    OR employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 2. employee_meetings (has meeting_leader column)
DROP POLICY IF EXISTS "Users can view meetings in their company" ON public.employee_meetings;
CREATE POLICY "Employees, leaders and admins can view meetings"
ON public.employee_meetings
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR meeting_leader = auth.uid()
    OR employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 3. hr_meetings (uses created_by / completed_by_id instead of meeting_leader)
DROP POLICY IF EXISTS "Users can view hr_meetings in their company" ON public.hr_meetings;
CREATE POLICY "Employees, leaders and admins can view hr_meetings"
ON public.hr_meetings
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR created_by = auth.uid()
    OR completed_by_id = auth.uid()
    OR employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 4. hr_meeting_responses
DROP POLICY IF EXISTS "Users can view responses via meeting" ON public.hr_meeting_responses;
CREATE POLICY "Restricted access to hr_meeting_responses"
ON public.hr_meeting_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hr_meetings m
    WHERE m.id = hr_meeting_responses.meeting_id
      AND m.company_id = public.get_user_company_id(auth.uid())
      AND (
        public.is_company_admin(auth.uid())
        OR public.is_system_admin(auth.uid())
        OR m.created_by = auth.uid()
        OR m.completed_by_id = auth.uid()
        OR m.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
  )
);

-- 5. hms_forsvarlighetsvurderinger
DROP POLICY IF EXISTS "Users can view their company's forsvarlighetsvurderinger" ON public.hms_forsvarlighetsvurderinger;
CREATE POLICY "Admins, HMS-responsible and verneombud can view forsvarlighetsvurderinger"
ON public.hms_forsvarlighetsvurderinger
FOR SELECT
USING (
  public.is_system_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_leader_or_verneombud(auth.uid())
  )
);

-- 6. verneombud_agreements
DROP POLICY IF EXISTS "Users can view verneombud agreements for their company" ON public.verneombud_agreements;
CREATE POLICY "Admins and verneombud can view verneombud agreements"
ON public.verneombud_agreements
FOR SELECT
USING (
  public.is_system_admin(auth.uid())
  OR (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND public.is_leader_or_verneombud(auth.uid())
  )
);

-- 7. ks_module2_nabovarsel_recipients (remove guest access)
DROP POLICY IF EXISTS "Project members can view nabovarsel recipients" ON public.ks_module2_nabovarsel_recipients;
CREATE POLICY "Internal company members can view nabovarsel recipients"
ON public.ks_module2_nabovarsel_recipients
FOR SELECT
USING (
  public.is_system_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_company_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ks_module2_projects p
        WHERE p.id = ks_module2_nabovarsel_recipients.project_id
          AND p.company_id = public.get_user_company_id(auth.uid())
          AND (p.project_leader_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  )
);

-- 8. ks_module2_project_access
DROP POLICY IF EXISTS "Users can view project access for their company projects" ON public.ks_module2_project_access;
CREATE POLICY "Admins, project leaders and invited users can view project access"
ON public.ks_module2_project_access
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_system_admin(auth.uid())
  OR (
    public.is_company_admin(auth.uid())
    AND project_id IN (
      SELECT p.id FROM public.ks_module2_projects p
      WHERE p.company_id = public.get_user_company_id(auth.uid())
    )
  )
  OR project_id IN (
    SELECT p.id FROM public.ks_module2_projects p
    WHERE p.company_id = public.get_user_company_id(auth.uid())
      AND (p.project_leader_id = auth.uid() OR p.created_by = auth.uid())
  )
);

-- 9. ks_module2_template_notifications
DROP POLICY IF EXISTS "All authenticated users can view notifications" ON public.ks_module2_template_notifications;
CREATE POLICY "System admins can view template notifications"
ON public.ks_module2_template_notifications
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- 10. admin_routine_templates
DROP POLICY IF EXISTS "All authenticated users can view active routine templates" ON public.admin_routine_templates;

-- 11. admin-documents storage bucket
DROP POLICY IF EXISTS "Company members can read admin-documents storage" ON storage.objects;
CREATE POLICY "Company members can read admin-documents storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND public.get_user_company_id(auth.uid()) IS NOT NULL
);
