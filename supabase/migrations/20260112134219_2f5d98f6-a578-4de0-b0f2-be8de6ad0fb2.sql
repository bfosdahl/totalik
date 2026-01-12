-- Fix: allow company members (not only company_admin) to create/activate IK modules needed by setup
-- Existing policies only allow INSERT/UPDATE for company_admin and system_admin, which breaks AI setup for normal users.

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user in the same company to INSERT IK_HMS / IK_MAT module rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_modules' AND policyname='Company members can create IK modules'
  ) THEN
    CREATE POLICY "Company members can create IK modules"
    ON public.company_modules
    FOR INSERT
    WITH CHECK (
      company_id = public.get_user_company_id(auth.uid())
      AND module_type IN ('IK_HMS', 'IK_MAT')
    );
  END IF;
END $$;

-- Allow any authenticated user in the same company to UPDATE IK_HMS / IK_MAT module rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_modules' AND policyname='Company members can update IK modules'
  ) THEN
    CREATE POLICY "Company members can update IK modules"
    ON public.company_modules
    FOR UPDATE
    USING (
      company_id = public.get_user_company_id(auth.uid())
      AND module_type IN ('IK_HMS', 'IK_MAT')
    )
    WITH CHECK (
      company_id = public.get_user_company_id(auth.uid())
      AND module_type IN ('IK_HMS', 'IK_MAT')
    );
  END IF;
END $$;
