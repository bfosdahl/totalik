-- RLS initplan rewrite, batch 1: public tables a*-c*
-- Only wraps auth.uid() as (SELECT auth.uid()) and wraps per-user helper calls (only argument = current user) in (SELECT ...).
-- Policy logic is unchanged. Idempotent: policies already containing "SELECT auth.uid()" are skipped.
DO $mig$
DECLARE
  r record; nq text; nw text; stmt text; n int := 0;
  fnre constant text := '\m(get_user_company_id|is_system_admin|is_company_admin|is_hms_responsible|is_leader_or_verneombud|check_company_admin_role|is_any_department_admin)\(\(SELECT auth\.uid\(\)\)\)';
  hrre constant text := '\mhas_role\(\(SELECT auth\.uid\(\), (''[a-z_]+''::app_role)\)';
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename ~ '^[a-c]'
      AND (coalesce(qual,'') || coalesce(with_check,'')) ~ 'auth\.uid\(\)'
      AND (coalesce(qual,'') || coalesce(with_check,'')) !~* 'select auth\.uid\(\)'
    ORDER BY schemaname, tablename, policyname
  LOOP
    nq := r.qual; nw := r.with_check;
    IF nq IS NOT NULL THEN
      nq := regexp_replace(nq, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
      nq := regexp_replace(nq, fnre, '(SELECT \1((SELECT auth.uid())))', 'g');
      nq := regexp_replace(nq, hrre, '(SELECT has_role((SELECT auth.uid()), \1))', 'g');
    END IF;
    IF nw IS NOT NULL THEN
      nw := regexp_replace(nw, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
      nw := regexp_replace(nw, fnre, '(SELECT \1((SELECT auth.uid())))', 'g');
      nw := regexp_replace(nw, hrre, '(SELECT has_role((SELECT auth.uid()), \1))', 'g');
    END IF;
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename)
         || CASE WHEN nq IS NOT NULL THEN ' USING (' || nq || ')' ELSE '' END
         || CASE WHEN nw IS NOT NULL THEN ' WITH CHECK (' || nw || ')' ELSE '' END;
    EXECUTE stmt;
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'RLS initplan batch 1: rewrote % policies', n;
END
$mig$;