CREATE POLICY "Company members can update ik_hms documents"
ON public.ik_hms_company_documents
FOR UPDATE
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));