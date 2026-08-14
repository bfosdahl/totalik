CREATE OR REPLACE FUNCTION public.profile_self_update_columns_ok(_id uuid, _company_id uuid, _is_verneombud boolean, _is_hms_responsible boolean, _hourly_rate numeric, _is_active boolean)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _id
      AND p.company_id IS NOT DISTINCT FROM _company_id
      AND COALESCE(p.is_verneombud,false) IS NOT DISTINCT FROM COALESCE(_is_verneombud,false)
      AND COALESCE(p.is_hms_responsible,false) IS NOT DISTINCT FROM COALESCE(_is_hms_responsible,false)
      AND p.hourly_rate IS NOT DISTINCT FROM _hourly_rate
      AND COALESCE(p.is_active,true) IS NOT DISTINCT FROM COALESCE(_is_active,true)
  )
$$;

REVOKE ALL ON FUNCTION public.profile_self_update_columns_ok(uuid, uuid, boolean, boolean, numeric, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_self_update_columns_ok(uuid, uuid, boolean, boolean, numeric, boolean) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.profile_self_update_columns_ok(id, company_id, is_verneombud, is_hms_responsible, hourly_rate, is_active)
);