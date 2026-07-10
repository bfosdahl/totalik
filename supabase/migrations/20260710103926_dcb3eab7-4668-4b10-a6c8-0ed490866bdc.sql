
-- 1. notification_log: require user_id = auth.uid() on INSERT (admins can still insert to others)
DROP POLICY IF EXISTS "Users can insert notifications for same company" ON public.notification_log;
CREATE POLICY "Users can insert notifications for self or by admin"
ON public.notification_log
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
  )
);

-- 2a. hr_meetings: restrict write to admins or meeting creator/completed_by
DROP POLICY IF EXISTS "Company admins can insert hr_meetings" ON public.hr_meetings;
DROP POLICY IF EXISTS "Company admins can update hr_meetings" ON public.hr_meetings;
DROP POLICY IF EXISTS "Company admins can delete hr_meetings" ON public.hr_meetings;

CREATE POLICY "Admins or leaders can insert hr_meetings"
ON public.hr_meetings
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR created_by = auth.uid()
  )
);

CREATE POLICY "Admins or leaders can update hr_meetings"
ON public.hr_meetings
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR created_by = auth.uid()
    OR completed_by_id = auth.uid()
  )
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR created_by = auth.uid()
    OR completed_by_id = auth.uid()
  )
);

CREATE POLICY "Admins or creators can delete hr_meetings"
ON public.hr_meetings
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.is_company_admin(auth.uid())
    OR public.is_system_admin(auth.uid())
    OR created_by = auth.uid()
  )
);

-- 2b. hr_meeting_responses: restrict write to admins, meeting leader/creator, or the employee involved
DROP POLICY IF EXISTS "Users can insert responses via meeting" ON public.hr_meeting_responses;
DROP POLICY IF EXISTS "Users can update responses via meeting" ON public.hr_meeting_responses;
DROP POLICY IF EXISTS "Users can delete responses via meeting" ON public.hr_meeting_responses;

CREATE POLICY "Restricted insert on hr_meeting_responses"
ON public.hr_meeting_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hr_meetings m
    WHERE m.id = hr_meeting_responses.meeting_id
      AND m.company_id = public.get_user_company_id(auth.uid())
      AND (
        public.is_company_admin(auth.uid())
        OR public.is_system_admin(auth.uid())
        OR m.created_by = auth.uid()
        OR m.completed_by_id = auth.uid()
        OR m.employee_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
      )
  )
);

CREATE POLICY "Restricted update on hr_meeting_responses"
ON public.hr_meeting_responses
FOR UPDATE
TO authenticated
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
        OR m.employee_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hr_meetings m
    WHERE m.id = hr_meeting_responses.meeting_id
      AND m.company_id = public.get_user_company_id(auth.uid())
      AND (
        public.is_company_admin(auth.uid())
        OR public.is_system_admin(auth.uid())
        OR m.created_by = auth.uid()
        OR m.completed_by_id = auth.uid()
        OR m.employee_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
      )
  )
);

CREATE POLICY "Restricted delete on hr_meeting_responses"
ON public.hr_meeting_responses
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hr_meetings m
    WHERE m.id = hr_meeting_responses.meeting_id
      AND m.company_id = public.get_user_company_id(auth.uid())
      AND (
        public.is_company_admin(auth.uid())
        OR public.is_system_admin(auth.uid())
        OR m.created_by = auth.uid()
      )
  )
);

-- 3. Helper: user has access to a ks_projects project (admin OR team member)
CREATE OR REPLACE FUNCTION public.user_has_ks_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ks_projects pr
    WHERE pr.id = _project_id
      AND pr.company_id = public.get_user_company_id(_user_id)
      AND (
        public.is_company_admin(_user_id)
        OR public.is_system_admin(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.ks_project_team_members tm
          JOIN public.profiles p ON p.id = tm.employee_id
          WHERE tm.project_id = _project_id
            AND p.user_id = _user_id
        )
      )
  )
$$;

-- 4a. ks_project_client_checklist: scope by project membership
DROP POLICY IF EXISTS "Users can manage checklist for their company projects" ON public.ks_project_client_checklist;
CREATE POLICY "Project members can manage client checklist"
ON public.ks_project_client_checklist
FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
);

-- 4b. ks_project_client_approvals: scope by project membership
DROP POLICY IF EXISTS "Users can view approvals for their company projects" ON public.ks_project_client_approvals;
DROP POLICY IF EXISTS "Users can create approvals for their company projects" ON public.ks_project_client_approvals;

CREATE POLICY "Project members can view client approvals"
ON public.ks_project_client_approvals
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
);

CREATE POLICY "Project members can create client approvals"
ON public.ks_project_client_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
);

-- 4c. ks_project_client_messages: scope by project membership
DROP POLICY IF EXISTS "Users can manage messages for their company projects" ON public.ks_project_client_messages;
CREATE POLICY "Project members can manage client messages"
ON public.ks_project_client_messages
FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.user_has_ks_project_access(auth.uid(), project_id)
);
