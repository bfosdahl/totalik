ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_sent_by uuid;

CREATE OR REPLACE FUNCTION public.get_company_user_login_status(_company_id uuid)
RETURNS TABLE(user_id uuid, last_sign_in_at timestamptz, invitation_sent_at timestamptz, invitation_sent_by_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, u.last_sign_in_at, p.invitation_sent_at,
         NULLIF(TRIM(COALESCE(s.first_name,'') || ' ' || COALESCE(s.last_name,'')), '')
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.profiles s ON s.user_id = p.invitation_sent_by
  WHERE p.company_id = _company_id
    AND (public.is_system_admin(auth.uid())
         OR (public.has_role(auth.uid(), 'company_admin') AND public.get_user_company_id(auth.uid()) = _company_id));
$$;
REVOKE ALL ON FUNCTION public.get_company_user_login_status(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_company_user_login_status(uuid) TO authenticated;

-- Existing users are treated as already invited (they were emailed automatically before)
UPDATE public.profiles SET invitation_sent_at = created_at WHERE invitation_sent_at IS NULL;