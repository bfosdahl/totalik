
-- 1) admin_project_type_templates: remove the overly-permissive "true" SELECT policy
DROP POLICY IF EXISTS "System admins can view project type templates" ON public.admin_project_type_templates;

-- 2) shift_tasks: replace broken (p.id = auth.uid()) policies with correct (p.user_id = auth.uid())
DROP POLICY IF EXISTS "Company admins can create shift tasks" ON public.shift_tasks;
DROP POLICY IF EXISTS "Company admins can delete shift tasks" ON public.shift_tasks;
DROP POLICY IF EXISTS "Users can update shift tasks in their company" ON public.shift_tasks;
DROP POLICY IF EXISTS "Users can view shift tasks for their company" ON public.shift_tasks;

CREATE POLICY "Company admins can create shift tasks"
ON public.shift_tasks FOR INSERT
WITH CHECK (
  company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can delete shift tasks"
ON public.shift_tasks FOR DELETE
USING (
  company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Users can update shift tasks in their company"
ON public.shift_tasks FOR UPDATE
USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can view shift tasks for their company"
ON public.shift_tasks FOR SELECT
USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- 3) standard_work_schedules: drop the broken duplicates (correct ones already exist)
DROP POLICY IF EXISTS "Company admins can delete standard schedules" ON public.standard_work_schedules;
DROP POLICY IF EXISTS "Company admins can insert standard schedules" ON public.standard_work_schedules;
DROP POLICY IF EXISTS "Company admins can update standard schedules" ON public.standard_work_schedules;
DROP POLICY IF EXISTS "Users can view standard schedules for their company" ON public.standard_work_schedules;

-- 4) ks_module2_project_access: restrict management to company/system admins
DROP POLICY IF EXISTS "Company users can manage project access" ON public.ks_module2_project_access;

CREATE POLICY "Company admins can manage project access"
ON public.ks_module2_project_access FOR ALL
USING (
  project_id IN (
    SELECT p.id FROM ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  project_id IN (
    SELECT p.id FROM ks_module2_projects p
    WHERE p.company_id = get_user_company_id(auth.uid())
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- 5) course-certificates storage: fix broken p.id = auth.uid() checks
DROP POLICY IF EXISTS "Users can view course certificates in their company" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can delete course certificates" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can upload course certificates" ON storage.objects;

CREATE POLICY "Users can view course certificates in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT (p.company_id)::text FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can delete course certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT (p.company_id)::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "Company admins can upload course certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-certificates'
  AND (storage.foldername(name))[1] IN (
    SELECT (p.company_id)::text FROM profiles p WHERE p.user_id = auth.uid()
  )
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- 6) FDV storage: align write policies with user_can_manage_fdv (allow company/system admins too)
DROP POLICY IF EXISTS "fdv_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "fdv_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "fdv_storage_delete" ON storage.objects;

CREATE POLICY "fdv_storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fdv-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT (profiles.company_id)::text FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.is_hms_responsible = true
           OR is_company_admin(auth.uid())
           OR is_system_admin(auth.uid()))
  )
);

CREATE POLICY "fdv_storage_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fdv-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT (profiles.company_id)::text FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.is_hms_responsible = true
           OR is_company_admin(auth.uid())
           OR is_system_admin(auth.uid()))
  )
);

CREATE POLICY "fdv_storage_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fdv-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT (profiles.company_id)::text FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.is_hms_responsible = true
           OR is_company_admin(auth.uid())
           OR is_system_admin(auth.uid()))
  )
);
