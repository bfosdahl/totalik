-- 1) Prevent users from changing their own company_id (tenant escape)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND company_id IS NOT DISTINCT FROM (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 2) Restrict global-sds-files bucket uploads to system admins only
DROP POLICY IF EXISTS "Authenticated users can upload global SDS files" ON storage.objects;

CREATE POLICY "System admins can upload global SDS files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'global-sds-files'
  AND public.is_system_admin(auth.uid())
);

-- 3) Add company-folder scope to admin policies on employee-documents
DROP POLICY IF EXISTS "Company admins can view all employee documents in their company" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can upload employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can delete employee documents" ON storage.objects;

CREATE POLICY "Company admins can view employee documents in their company"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

CREATE POLICY "Company admins can upload employee documents in their company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

CREATE POLICY "Company admins can delete employee documents in their company"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

-- 4) ks-module2-documents — add folder check to admin INSERT/DELETE
DROP POLICY IF EXISTS "Company admins can upload ks module2 documents" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can delete ks module2 documents" ON storage.objects;

CREATE POLICY "Company admins can upload ks module2 documents in their company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ks-module2-documents'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

CREATE POLICY "Company admins can delete ks module2 documents in their company"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ks-module2-documents'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

-- 5) deviation-attachments — add folder check to admin DELETE
DROP POLICY IF EXISTS "Company admins can delete deviation attachments" ON storage.objects;

CREATE POLICY "Company admins can delete deviation attachments in their company"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'deviation-attachments'
  AND public.is_company_admin(auth.uid())
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);