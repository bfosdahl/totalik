-- 1. Restrict ks_module2_access_log SELECT to authenticated role
DROP POLICY IF EXISTS "Users can view access logs for their company projects" ON public.ks_module2_access_log;

CREATE POLICY "Users can view access logs for their company projects"
ON public.ks_module2_access_log
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT p.id
    FROM public.ks_module2_projects p
    WHERE p.company_id = public.get_user_company_id(auth.uid())
  )
);

-- 2. Tighten project-documents INSERT to require folder = a project owned by user's company
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.ks_projects kp
    WHERE kp.id::text = (storage.foldername(name))[1]
      AND kp.company_id = public.get_user_company_id(auth.uid())
  )
);