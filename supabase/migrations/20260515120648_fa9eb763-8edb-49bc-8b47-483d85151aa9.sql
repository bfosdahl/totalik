
-- 1. Drop overly permissive storage policies on ks-module2-files
DROP POLICY IF EXISTS "Authenticated users can delete their files in ks-module2-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their files in ks-module2-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to ks-module2-files" ON storage.objects;

-- 2. Replace broad SELECT on ks-module2-documents with company-scoped policy
DROP POLICY IF EXISTS "Authenticated users can view ks module2 documents" ON storage.objects;

CREATE POLICY "Company users can view ks-module2-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ks-module2-documents'
  AND (
    (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
    OR public.is_system_admin(auth.uid())
  )
);

-- 3. Restrict deviation-attachments uploads to user's company folder
DROP POLICY IF EXISTS "Users can upload deviation attachments" ON storage.objects;

CREATE POLICY "Users can upload deviation attachments to own company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deviation-attachments'
  AND (storage.foldername(name))[1] = (public.get_user_company_id(auth.uid()))::text
);

-- 4. Remove privilege escalation: self-assign company_admin
DROP POLICY IF EXISTS "Users can add company_admin role to themselves during signup" ON public.user_roles;

-- 5. Restrict global chemicals INSERT to system admins
DROP POLICY IF EXISTS "Authenticated users can add global chemicals" ON public.global_chemicals;
DROP POLICY IF EXISTS "Authenticated users can add SDS versions" ON public.global_chemical_sds_versions;

CREATE POLICY "Only system admins can add global chemicals"
ON public.global_chemicals FOR INSERT TO authenticated
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Only system admins can add SDS versions"
ON public.global_chemical_sds_versions FOR INSERT TO authenticated
WITH CHECK (public.is_system_admin(auth.uid()));

-- 6. Tighten companies SELECT — remove orphan company exposure.
-- Keep only "own company" + system admin visibility.
DROP POLICY IF EXISTS "Users can view companies they just created" ON public.companies;
