CREATE TABLE public.employee_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'clothing' CHECK (category IN ('clothing','ppe','tool','other')),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  size text,
  serial_number text,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  returned_date date,
  notes text,
  created_by uuid,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_equipment_emp ON public.employee_equipment(company_id, employee_id);
GRANT SELECT, INSERT, UPDATE ON public.employee_equipment TO authenticated;
GRANT ALL ON public.employee_equipment TO service_role;
ALTER TABLE public.employee_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage equipment" ON public.employee_equipment
FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Employees view own equipment" ON public.employee_equipment
FOR SELECT TO authenticated
USING (is_deleted = false AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_equipment.employee_id AND p.user_id = auth.uid()));

CREATE TRIGGER trg_employee_equipment_updated BEFORE UPDATE ON public.employee_equipment
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();