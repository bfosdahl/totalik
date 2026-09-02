CREATE POLICY "verneombud_docs_select_own_company"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verneombud-documents' AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text);

CREATE POLICY "verneombud_docs_insert_own_company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verneombud-documents' AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text);

CREATE POLICY "verneombud_docs_update_own_company"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'verneombud-documents' AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text)
WITH CHECK (bucket_id = 'verneombud-documents' AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text);

CREATE POLICY "verneombud_docs_delete_admin"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verneombud-documents' AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text AND public.is_company_admin(auth.uid()));