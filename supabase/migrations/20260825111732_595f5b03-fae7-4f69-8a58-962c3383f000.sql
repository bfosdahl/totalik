CREATE OR REPLACE FUNCTION public.exec_never_logged_in_report()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'name'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'name', c.name,
      'org_number', coalesce(c.org_number,''),
      'created', to_char(c.created_at, 'YYYY-MM-DD'),
      'status', c.status::text,
      'emails', coalesce((SELECT string_agg(DISTINCT p.email, ', ') FROM profiles p WHERE p.company_id = c.id), '')
    ) AS x
    FROM companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM profiles p JOIN auth.users u ON u.id = p.user_id
      WHERE p.company_id = c.id AND u.last_sign_in_at IS NOT NULL
    )
  ) s;
$$;

REVOKE ALL ON FUNCTION public.exec_never_logged_in_report() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_never_logged_in_report() TO service_role;