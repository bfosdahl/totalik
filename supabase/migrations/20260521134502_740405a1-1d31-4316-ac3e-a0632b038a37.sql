DO $$
DECLARE
  v_user_id uuid := '3d50db9f-5929-4164-9cf0-cdb7a58d3f8b';
BEGIN
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.user_departments WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END $$;