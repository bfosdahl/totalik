
-- 1. Create audit_log table for change tracking
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_company ON public.audit_log(company_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can read all audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "Company admins can read company audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_company_admin(auth.uid())
  );

CREATE POLICY "Allow audit log inserts"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Add soft-delete columns to critical tables
ALTER TABLE public.company_ks_routines 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.deviations 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.company_action_plans 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.company_goals 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.company_modules 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.company_ks_documents 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.ks_module2_projects 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.audits 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

ALTER TABLE public.ik_hms_stoffkartotek 
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid;

-- 3. Create audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action text;
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id uuid;
  v_company_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  v_action := TG_OP;

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      v_action := 'SOFT_DELETE';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, company_id)
  VALUES (TG_TABLE_NAME, v_record_id, v_action, v_old_data, v_new_data, v_user_id, v_company_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach audit triggers to critical tables
CREATE TRIGGER audit_company_ks_routines
  AFTER INSERT OR UPDATE OR DELETE ON public.company_ks_routines
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_deviations
  AFTER INSERT OR UPDATE OR DELETE ON public.deviations
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_company_action_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.company_action_plans
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_company_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.company_goals
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_company_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.company_modules
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_company_ks_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.company_ks_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_ks_module2_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.ks_module2_projects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_audits
  AFTER INSERT OR UPDATE OR DELETE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_ik_hms_stoffkartotek
  AFTER INSERT OR UPDATE OR DELETE ON public.ik_hms_stoffkartotek
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
