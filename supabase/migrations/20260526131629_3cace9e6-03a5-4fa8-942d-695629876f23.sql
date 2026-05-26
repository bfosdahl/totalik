-- 1. Fix storage policies for project-documents bucket (broken join)
DROP POLICY IF EXISTS "Authenticated users can delete project documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project documents" ON storage.objects;

CREATE POLICY "Company members can delete project-documents objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1
    FROM public.ks_project_documents kpd
    JOIN public.ks_projects kp ON kp.id = kpd.project_id
    WHERE kpd.file_path = objects.name
      AND kp.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Company members can update project-documents objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1
    FROM public.ks_project_documents kpd
    JOIN public.ks_projects kp ON kp.id = kpd.project_id
    WHERE kpd.file_path = objects.name
      AND kp.company_id = public.get_user_company_id(auth.uid())
  )
);

-- 2. Fix user_can_manage_fdv to require company scope for admins
CREATE OR REPLACE FUNCTION public.user_can_manage_fdv(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- HMS-responsible in the same company
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.company_id = _company_id
      AND p.is_hms_responsible = true
  )
  -- System admins (cross-company)
  OR public.is_system_admin(_user_id)
  -- Company admins ONLY when their profile is in the same company as the resource
  OR (
    public.is_company_admin(_user_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.user_id = _user_id
        AND p2.company_id = _company_id
    )
  )
$function$;

-- 3. Restrict verneombud_agreements writes to company admins / system admins
DROP POLICY IF EXISTS "Company admins can insert verneombud agreements" ON public.verneombud_agreements;
DROP POLICY IF EXISTS "Company admins can update verneombud agreements" ON public.verneombud_agreements;
DROP POLICY IF EXISTS "Company admins can delete verneombud agreements" ON public.verneombud_agreements;

CREATE POLICY "Company admins can insert verneombud agreements"
ON public.verneombud_agreements
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.is_system_admin(auth.uid())
    OR (
      public.is_company_admin(auth.uid())
      AND company_id = public.get_user_company_id(auth.uid())
    )
  )
);

CREATE POLICY "Company admins can update verneombud agreements"
ON public.verneombud_agreements
FOR UPDATE
TO authenticated
USING (
  (
    public.is_system_admin(auth.uid())
    OR (
      public.is_company_admin(auth.uid())
      AND company_id = public.get_user_company_id(auth.uid())
    )
  )
)
WITH CHECK (
  (
    public.is_system_admin(auth.uid())
    OR (
      public.is_company_admin(auth.uid())
      AND company_id = public.get_user_company_id(auth.uid())
    )
  )
);

CREATE POLICY "Company admins can delete verneombud agreements"
ON public.verneombud_agreements
FOR DELETE
TO authenticated
USING (
  (
    public.is_system_admin(auth.uid())
    OR (
      public.is_company_admin(auth.uid())
      AND company_id = public.get_user_company_id(auth.uid())
    )
  )
);