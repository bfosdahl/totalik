
-- Create separate table for sensitive next-of-kin data
CREATE TABLE public.profiles_next_of_kin (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_next_of_kin TO authenticated;
GRANT ALL ON public.profiles_next_of_kin TO service_role;

ALTER TABLE public.profiles_next_of_kin ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their own
CREATE POLICY "Users view own next of kin"
ON public.profiles_next_of_kin FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
);

CREATE POLICY "Users insert own next of kin"
ON public.profiles_next_of_kin FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
);

CREATE POLICY "Users update own next of kin"
ON public.profiles_next_of_kin FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
);

-- Admins (company/system) can read/write within company
CREATE POLICY "Admins view next of kin in company"
ON public.profiles_next_of_kin FOR SELECT TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
);

CREATE POLICY "Admins write next of kin in company"
ON public.profiles_next_of_kin FOR ALL TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
)
WITH CHECK (
  public.is_system_admin(auth.uid())
  OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
);

-- Migrate existing data
INSERT INTO public.profiles_next_of_kin (profile_id, company_id, next_of_kin_name, next_of_kin_phone, next_of_kin_relation)
SELECT id, company_id, next_of_kin_name, next_of_kin_phone, next_of_kin_relation
FROM public.profiles
WHERE company_id IS NOT NULL
  AND (next_of_kin_name IS NOT NULL OR next_of_kin_phone IS NOT NULL OR next_of_kin_relation IS NOT NULL);

-- Drop the columns from profiles so they are no longer exposed by the broad SELECT policy
ALTER TABLE public.profiles DROP COLUMN next_of_kin_name;
ALTER TABLE public.profiles DROP COLUMN next_of_kin_phone;
ALTER TABLE public.profiles DROP COLUMN next_of_kin_relation;

-- Trigger to keep company_id synced + updated_at
CREATE TRIGGER trg_profiles_next_of_kin_updated
BEFORE UPDATE ON public.profiles_next_of_kin
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
