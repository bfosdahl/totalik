
-- 1. audit_schedules table
CREATE TABLE public.audit_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module text NOT NULL DEFAULT 'ik_hms',
  last_completed_at timestamptz,
  next_due_at date NOT NULL,
  reminder_30_sent_at timestamptz,
  reminder_due_sent_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, module)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_schedules TO authenticated;
GRANT ALL ON public.audit_schedules TO service_role;

ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company audit schedules"
  ON public.audit_schedules FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company admins manage audit schedules"
  ON public.audit_schedules FOR ALL TO authenticated
  USING (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  )
  WITH CHECK (
    public.is_system_admin(auth.uid())
    OR (public.is_company_admin(auth.uid()) AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE TRIGGER trg_audit_schedules_updated_at
  BEFORE UPDATE ON public.audit_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend audits with assistance fields
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS assistance_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assistance_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS assistance_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS assistance_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_amount_nok integer,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS trigger_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.audit_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dismissed_until date;

-- 3. Helper RPC: create or update schedule (called from handbook import or manually)
CREATE OR REPLACE FUNCTION public.ensure_audit_schedule(
  p_company_id uuid,
  p_module text DEFAULT 'ik_hms',
  p_next_due_at date DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_due date;
BEGIN
  v_due := COALESCE(p_next_due_at, (current_date + interval '12 months')::date);
  INSERT INTO public.audit_schedules (company_id, module, next_due_at)
  VALUES (p_company_id, p_module, v_due)
  ON CONFLICT (company_id, module) DO UPDATE
    SET next_due_at = EXCLUDED.next_due_at,
        is_active = true,
        updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 4. Backfill: create schedules for all existing companies (12 mnd fra nå)
INSERT INTO public.audit_schedules (company_id, module, next_due_at)
SELECT c.id, 'ik_hms', (current_date + interval '12 months')::date
FROM public.companies c
WHERE c.status = 'active'
ON CONFLICT (company_id, module) DO NOTHING;
