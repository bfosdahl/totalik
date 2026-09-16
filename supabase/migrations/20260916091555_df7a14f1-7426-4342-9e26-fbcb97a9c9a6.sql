CREATE TABLE public.company_material_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'stk',
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_material_types_company ON public.company_material_types(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_material_types TO authenticated;
GRANT ALL ON public.company_material_types TO service_role;
ALTER TABLE public.company_material_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view material types" ON public.company_material_types
  FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Company admins can manage material types" ON public.company_material_types
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));
CREATE TRIGGER trg_company_material_types_updated_at BEFORE UPDATE ON public.company_material_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.time_entry_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  material_type_id uuid REFERENCES public.company_material_types(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'stk',
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_entry_materials_entry ON public.time_entry_materials(time_entry_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entry_materials TO authenticated;
GRANT ALL ON public.time_entry_materials TO service_role;
ALTER TABLE public.time_entry_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or company materials" ON public.time_entry_materials
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.time_entries te
    WHERE te.id = time_entry_materials.time_entry_id
      AND te.company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Insert materials on own entries" ON public.time_entry_materials
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.time_entries te
    WHERE te.id = time_entry_materials.time_entry_id
      AND te.company_id = get_user_company_id(auth.uid())
      AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))));
CREATE POLICY "Update materials on own entries" ON public.time_entry_materials
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.time_entries te
    WHERE te.id = time_entry_materials.time_entry_id
      AND te.company_id = get_user_company_id(auth.uid())
      AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))));
CREATE POLICY "Delete materials on own entries" ON public.time_entry_materials
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM public.time_entries te
    WHERE te.id = time_entry_materials.time_entry_id
      AND te.company_id = get_user_company_id(auth.uid())
      AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))));