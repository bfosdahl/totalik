
GRANT SELECT (next_of_kin_name, next_of_kin_phone, next_of_kin_relation, signature_data)
  ON public.profiles TO authenticated;
-- get_profile_private RPC stays in place for future use.
