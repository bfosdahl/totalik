
-- Helper function to check if user's company owns a KS2 project
CREATE OR REPLACE FUNCTION public.user_owns_ks2_project(_user_id uuid, _project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ks_module2_projects
    WHERE id::text = _project_id
    AND company_id = get_user_company_id(_user_id)
  )
$$;

-- ============================================================
-- 1. FIX: ks-module2-files (remove unauthenticated read, add company-scoped)
-- ============================================================
DROP POLICY IF EXISTS "Public read access for ks-module2-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in their company projects" ON storage.objects;

CREATE POLICY "Company users can view ks-module2-files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ks-module2-files' AND (
    -- photos/{projectId}/... pattern
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[2])
    OR
    -- {projectId}/... pattern  
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1])
  ));

CREATE POLICY "Company users can upload ks-module2-files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ks-module2-files' AND (
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[2])
    OR
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1])
  ));

CREATE POLICY "Company users can update ks-module2-files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ks-module2-files' AND (
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[2])
    OR
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1])
  ));

CREATE POLICY "Company users can delete ks-module2-files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ks-module2-files' AND (
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[2])
    OR
    user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1])
  ));

-- ============================================================
-- 2. FIX: project-documents (add auth + company scoping to write ops)
-- ============================================================
DROP POLICY IF EXISTS "Users can upload documents to their company projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company project documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload project documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND EXISTS (
    SELECT 1 FROM ks_project_documents kpd
    JOIN ks_projects kp ON kp.id = kpd.project_id
    WHERE kp.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Authenticated users can update project documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-documents' AND EXISTS (
    SELECT 1 FROM ks_project_documents kpd
    JOIN ks_projects kp ON kp.id = kpd.project_id
    WHERE kpd.file_path = name AND kp.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Authenticated users can delete project documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents' AND EXISTS (
    SELECT 1 FROM ks_project_documents kpd
    JOIN ks_projects kp ON kp.id = kpd.project_id
    WHERE kpd.file_path = name AND kp.company_id = get_user_company_id(auth.uid())
  ));

-- ============================================================
-- 3. FIX: subcontractor-files (add auth + company scoping)
-- ============================================================
DROP POLICY IF EXISTS "Users can upload subcontractor files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update subcontractor files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete subcontractor files" ON storage.objects;

CREATE POLICY "Company users can upload subcontractor files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'subcontractor-files' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can update subcontractor files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'subcontractor-files' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can delete subcontractor files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'subcontractor-files' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- ============================================================
-- 4. FIX: sha-documents (company scope via project ownership)
-- ============================================================
DROP POLICY IF EXISTS "Users can view SHA documents in their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload SHA documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete SHA documents" ON storage.objects;

CREATE POLICY "Company users can view SHA documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sha-documents' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can upload SHA documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sha-documents' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can delete SHA documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sha-documents' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

-- ============================================================
-- 5. FIX: ks-module2-avvik-photos (company scope via project ownership)
-- ============================================================
DROP POLICY IF EXISTS "Users can upload avvik photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avvik photos" ON storage.objects;
-- Keep any existing SELECT that might be company-scoped, add new ones
DROP POLICY IF EXISTS "Authenticated users can view avvik photos" ON storage.objects;

CREATE POLICY "Company users can view avvik photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ks-module2-avvik-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can upload avvik photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ks-module2-avvik-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can delete avvik photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ks-module2-avvik-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

-- ============================================================
-- 6. FIX: ks-module2-checklist-photos (company scope via project ownership)
-- ============================================================
DROP POLICY IF EXISTS "Users can view checklist photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload checklist photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update checklist photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete checklist photos" ON storage.objects;

CREATE POLICY "Company users can view checklist photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ks-module2-checklist-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can upload checklist photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ks-module2-checklist-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can update checklist photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ks-module2-checklist-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

CREATE POLICY "Company users can delete checklist photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ks-module2-checklist-photos' AND user_owns_ks2_project(auth.uid(), (storage.foldername(name))[1]));

-- ============================================================
-- 7. FIX: ks-module2-routines (company scope via folder path)
-- ============================================================
DROP POLICY IF EXISTS "Users can view routine documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload routine documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete routine documents" ON storage.objects;

CREATE POLICY "Company users can view ks2 routine documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ks-module2-routines' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can upload ks2 routine documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ks-module2-routines' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can delete ks2 routine documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ks-module2-routines' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- ============================================================
-- 8. FIX: ik-hms-sds (company scope via folder path)
-- ============================================================
DROP POLICY IF EXISTS "Users can view their company SDS files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload SDS files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete SDS files" ON storage.objects;

CREATE POLICY "Company users can view SDS files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ik-hms-sds' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can upload SDS files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ik-hms-sds' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company users can delete SDS files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ik-hms-sds' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- ============================================================
-- 9. FIX: byggesak-documents (company scope via folder path)
-- ============================================================
DROP POLICY IF EXISTS "Company users can view byggesak docs" ON storage.objects;
DROP POLICY IF EXISTS "Company users can upload byggesak docs" ON storage.objects;
DROP POLICY IF EXISTS "Company users can update byggesak docs" ON storage.objects;
DROP POLICY IF EXISTS "Company users can delete byggesak docs" ON storage.objects;

CREATE POLICY "Company scoped view byggesak docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'byggesak-documents' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company scoped upload byggesak docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'byggesak-documents' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company scoped update byggesak docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'byggesak-documents' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

CREATE POLICY "Company scoped delete byggesak docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'byggesak-documents' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- ============================================================
-- 10. FIX: companies table - remove NOT EXISTS branch from SELECT policy
-- ============================================================
-- First find and drop the existing policy, then recreate without the NOT EXISTS branch
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

-- Recreate: only company members and system admins can see company data
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    OR is_system_admin(auth.uid())
  );
