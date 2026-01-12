-- Fix RLS bug: hms_self_declarations policies referenced profiles.id = auth.uid(),
-- but profiles.id is NOT the auth user id. This caused INSERT/UPDATE to be blocked.

ALTER TABLE public.hms_self_declarations ENABLE ROW LEVEL SECURITY;

-- Update SELECT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='hms_self_declarations'
      AND policyname='Users can view their company''s HMS declarations'
  ) THEN
    EXECUTE 'ALTER POLICY "Users can view their company''s HMS declarations" ON public.hms_self_declarations USING (company_id = public.get_user_company_id(auth.uid()))';
  END IF;
END $$;

-- Update INSERT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='hms_self_declarations'
      AND policyname='Users can create HMS declarations for their company'
  ) THEN
    EXECUTE 'ALTER POLICY "Users can create HMS declarations for their company" ON public.hms_self_declarations WITH CHECK (company_id = public.get_user_company_id(auth.uid()))';
  END IF;
END $$;

-- Update UPDATE policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='hms_self_declarations'
      AND policyname='Users can update their company''s HMS declarations'
  ) THEN
    EXECUTE 'ALTER POLICY "Users can update their company''s HMS declarations" ON public.hms_self_declarations USING (company_id = public.get_user_company_id(auth.uid()))';
  END IF;
END $$;

-- Update DELETE policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='hms_self_declarations'
      AND policyname='Users can delete their company''s HMS declarations'
  ) THEN
    EXECUTE 'ALTER POLICY "Users can delete their company''s HMS declarations" ON public.hms_self_declarations USING (company_id = public.get_user_company_id(auth.uid()))';
  END IF;
END $$;


-- Fix linter: remove WITH CHECK (true) on companies INSERT policy
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='companies'
      AND policyname='Authenticated users can create a company'
  ) THEN
    EXECUTE 'ALTER POLICY "Authenticated users can create a company" ON public.companies WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END $$;
