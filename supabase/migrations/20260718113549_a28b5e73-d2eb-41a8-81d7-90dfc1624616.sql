
-- Revoke SELECT on sensitive profile columns from authenticated (base table)
REVOKE SELECT (hourly_rate, employee_number, hms_card_number, hms_card_expiry_date, accommodation_provided, accommodation_address, signature_data)
  ON public.profiles FROM authenticated;

-- Extended sensitive read RPC (owner or company/system admin)
CREATE OR REPLACE FUNCTION public.get_profile_sensitive_full(p_profile_id uuid)
RETURNS TABLE(
  hourly_rate numeric,
  signature_data text,
  hms_card_number text,
  hms_card_expiry_date date,
  hms_card_obtained boolean,
  employee_number text,
  accommodation_provided boolean,
  accommodation_address text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_company uuid;
BEGIN
  SELECT user_id, company_id INTO v_owner, v_company FROM public.profiles WHERE id = p_profile_id;
  IF v_owner IS NULL THEN RETURN; END IF;

  IF v_owner = auth.uid()
     OR public.is_system_admin(auth.uid())
     OR (public.is_company_admin(auth.uid()) AND v_company = public.get_user_company_id(auth.uid()))
  THEN
    RETURN QUERY
      SELECT p.hourly_rate, p.signature_data, p.hms_card_number, p.hms_card_expiry_date,
             p.hms_card_obtained, p.employee_number, p.accommodation_provided, p.accommodation_address
      FROM public.profiles p WHERE p.id = p_profile_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_sensitive_full(uuid) TO authenticated;

-- Bulk sensitive read for admins (used by Payroll, TimeOversikt, Personalliste, admin employee lists)
CREATE OR REPLACE FUNCTION public.get_company_profiles_sensitive(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  hourly_rate numeric,
  employee_number text,
  hms_card_number text,
  hms_card_expiry_date date,
  hms_card_obtained boolean,
  accommodation_provided boolean,
  accommodation_address text,
  signature_data text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND p_company_id = public.get_user_company_id(auth.uid()))
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT p.id, p.user_id, p.hourly_rate, p.employee_number, p.hms_card_number,
           p.hms_card_expiry_date, p.hms_card_obtained, p.accommodation_provided,
           p.accommodation_address, p.signature_data
    FROM public.profiles p
    WHERE p.company_id = p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_profiles_sensitive(uuid) TO authenticated;
