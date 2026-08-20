GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_system_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.user_has_any_role(uuid) TO anon;