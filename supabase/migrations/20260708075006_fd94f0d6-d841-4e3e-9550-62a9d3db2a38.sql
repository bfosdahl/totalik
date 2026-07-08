
-- 1) Profiles: prevent self-escalation of role flags
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.user_id
     AND NOT (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  THEN
    IF COALESCE(NEW.is_hms_responsible, false) IS DISTINCT FROM COALESCE(OLD.is_hms_responsible, false)
       OR COALESCE(NEW.is_verneombud, false) IS DISTINCT FROM COALESCE(OLD.is_verneombud, false)
    THEN
      RAISE EXCEPTION 'Not allowed to change role flags on your own profile';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_self_escalation();

-- 2) ks_module2_project_access: prevent self-escalation of access level/status/role
CREATE OR REPLACE FUNCTION public.prevent_project_access_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF auth.uid() = OLD.user_id THEN
    SELECT company_id INTO v_company_id
    FROM public.ks_module2_projects
    WHERE id = OLD.project_id;

    IF NOT (
      public.is_system_admin(auth.uid())
      OR (public.is_company_admin(auth.uid()) AND v_company_id = public.get_user_company_id(auth.uid()))
    ) THEN
      IF NEW.access_level IS DISTINCT FROM OLD.access_level
         OR NEW.status IS DISTINCT FROM OLD.status
         OR NEW.role_in_project IS DISTINCT FROM OLD.role_in_project
         OR NEW.subcontractor_id IS DISTINCT FROM OLD.subcontractor_id
         OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
         OR NEW.project_id IS DISTINCT FROM OLD.project_id
         OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.email IS DISTINCT FROM OLD.email
         OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
      THEN
        RAISE EXCEPTION 'Not allowed to change privilege fields on your own project access';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_project_access_self_escalation ON public.ks_module2_project_access;
CREATE TRIGGER trg_prevent_project_access_self_escalation
BEFORE UPDATE ON public.ks_module2_project_access
FOR EACH ROW EXECUTE FUNCTION public.prevent_project_access_self_escalation();
