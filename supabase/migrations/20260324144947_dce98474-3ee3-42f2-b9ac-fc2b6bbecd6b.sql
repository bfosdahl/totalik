-- Fix company document access for non-admin company members and tighten storage read access

-- Public table: company_ks_documents
CREATE POLICY "Company members can upload KS documents"
ON public.company_ks_documents
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND uploaded_by_id = (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can update own KS documents"
ON public.company_ks_documents
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND uploaded_by_id = (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND uploaded_by_id = (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Company members can delete own KS documents"
ON public.company_ks_documents
FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND uploaded_by_id = (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Storage: restrict reads to same company only (current SELECT policy is too broad)
DROP POLICY IF EXISTS "Company members can view documents" ON storage.objects;

CREATE POLICY "Company members can view own company documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-documents'
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Keep insert/delete company-scoped; create update policy for completeness
CREATE POLICY "Company members can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-documents'
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM public.profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'company-documents'
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);