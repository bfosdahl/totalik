
-- 1. employee_messages: recipients may only flip read status
CREATE OR REPLACE FUNCTION public.employee_message_recipient_update_ok(_old public.employee_messages, _new public.employee_messages)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT _new.id = _old.id
     AND _new.company_id IS NOT DISTINCT FROM _old.company_id
     AND _new.sender_id IS NOT DISTINCT FROM _old.sender_id
     AND _new.sender_name IS NOT DISTINCT FROM _old.sender_name
     AND _new.recipient_id IS NOT DISTINCT FROM _old.recipient_id
     AND _new.recipient_name IS NOT DISTINCT FROM _old.recipient_name
     AND _new.subject IS NOT DISTINCT FROM _old.subject
     AND _new.message IS NOT DISTINCT FROM _old.message
     AND _new.created_at IS NOT DISTINCT FROM _old.created_at
$$;

CREATE OR REPLACE FUNCTION public.enforce_employee_message_recipient_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_recipient boolean;
  is_sender boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.id = OLD.recipient_id)
    INTO is_recipient;
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.id = OLD.sender_id)
    INTO is_sender;

  IF is_recipient AND NOT is_sender THEN
    IF NOT public.employee_message_recipient_update_ok(OLD, NEW) THEN
      RAISE EXCEPTION 'Mottaker kan kun oppdatere lesestatus paa meldingen';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employee_message_recipient_columns ON public.employee_messages;
CREATE TRIGGER trg_employee_message_recipient_columns
BEFORE UPDATE ON public.employee_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_message_recipient_columns();

DROP POLICY IF EXISTS "Recipients can update read status" ON public.employee_messages;
CREATE POLICY "Recipients can update read status"
ON public.employee_messages
FOR UPDATE
TO authenticated
USING (recipient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()))
WITH CHECK (
  recipient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2. ks_daily_reports: add WITH CHECK to prevent cross-tenant reassignment
DROP POLICY IF EXISTS "Users can update own daily reports" ON public.ks_daily_reports;
CREATE POLICY "Users can update own daily reports"
ON public.ks_daily_reports
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid())
  OR is_system_admin(auth.uid())
  OR (is_company_admin(auth.uid()) AND company_id = get_user_company_id(auth.uid()))
)
WITH CHECK (
  is_system_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (user_id = auth.uid() OR is_company_admin(auth.uid()))
  )
);

-- 3. travel_expense_reports: always enforce tenant scope on update
DROP POLICY IF EXISTS "Users can update own draft travel reports" ON public.travel_expense_reports;
CREATE POLICY "Users can update own draft travel reports"
ON public.travel_expense_reports
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  OR (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR is_company_admin(auth.uid())
    OR is_system_admin(auth.uid())
  )
);
