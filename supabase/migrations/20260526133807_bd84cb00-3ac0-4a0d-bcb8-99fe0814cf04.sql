
-- 1. Fix storage INSERT policy for project-documents bucket: join on stable project_id
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.ks_project_documents kpd
    JOIN public.ks_projects kp ON kp.id = kpd.project_id
    WHERE kpd.file_path = storage.objects.name
      AND kp.company_id = public.get_user_company_id(auth.uid())
  )
);

-- 2. Tighten ks_module2_access_log INSERT: require non-null auth user matching user_id
DROP POLICY IF EXISTS "Authenticated users can insert access logs" ON public.ks_module2_access_log;

CREATE POLICY "Authenticated users can insert access logs"
ON public.ks_module2_access_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND auth.uid() = user_id
);

-- 3. Restrict user_roles: company admins can only assign 'user' role; admin roles require system admin
DROP POLICY IF EXISTS "Company admins can manage roles in their company" ON public.user_roles;

CREATE POLICY "Company admins can assign user role in their company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.check_company_admin_role(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid()
      AND p2.user_id = user_roles.user_id
      AND p1.company_id = p2.company_id
      AND p1.company_id IS NOT NULL
  )
  AND role = 'user'::app_role
)
WITH CHECK (
  public.check_company_admin_role(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid()
      AND p2.user_id = user_roles.user_id
      AND p1.company_id = p2.company_id
      AND p1.company_id IS NOT NULL
  )
  AND role = 'user'::app_role
);
