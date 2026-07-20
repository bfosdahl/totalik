-- Storage RLS for ks-module2-documents: allow project-scoped access via project_id prefix.
-- Existing policies require folder[1] == company_id, but all app code uses project_id/folderCode/... .

-- Allow company members to upload documents into projects belonging to their company.
CREATE POLICY "Company members can upload docs to their company projects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ks-module2-documents'
    AND EXISTS (
      SELECT 1 FROM public.ks_module2_projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- Allow company members to view documents for their company projects.
CREATE POLICY "Company members can view docs for their company projects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ks-module2-documents'
    AND EXISTS (
      SELECT 1 FROM public.ks_module2_projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- Allow company admins to delete via project prefix too.
CREATE POLICY "Company admins can delete docs for their company projects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ks-module2-documents'
    AND public.is_company_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ks_module2_projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.company_id = public.get_user_company_id(auth.uid())
    )
  );