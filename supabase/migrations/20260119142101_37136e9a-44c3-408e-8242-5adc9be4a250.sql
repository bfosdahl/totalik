-- Ensure system admins can activate/deactivate modules for any company (UPDATE)

ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- Allow updating module activation for:
-- 1) system admins (any company)
-- 2) company admins (own company)
-- 3) regular members (own company, but only for IK_HMS/IK_MAT)
DROP POLICY IF EXISTS "Users and admins can update modules" ON public.company_modules;
CREATE POLICY "Users and admins can update modules"
ON public.company_modules
FOR UPDATE
USING (
  public.is_system_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_company_admin(auth.uid())
      OR module_type = ANY (ARRAY['IK_HMS'::text, 'IK_MAT'::text])
    )
  )
)
WITH CHECK (
  public.is_system_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.is_company_admin(auth.uid())
      OR module_type = ANY (ARRAY['IK_HMS'::text, 'IK_MAT'::text])
    )
  )
);
