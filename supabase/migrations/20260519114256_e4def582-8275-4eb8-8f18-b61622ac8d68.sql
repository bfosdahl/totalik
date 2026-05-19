-- 1. Utvid time_entries
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS hour_type text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS ks_project_id uuid REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL;

ALTER TABLE public.time_entries
  DROP CONSTRAINT IF EXISTS time_entries_hour_type_check;
ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_hour_type_check
  CHECK (hour_type IN ('normal','overtime_50','overtime_100'));

CREATE INDEX IF NOT EXISTS idx_time_entries_ks_project_id ON public.time_entries(ks_project_id);

-- 2. company_allowance_types
CREATE TABLE IF NOT EXISTS public.company_allowance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('hour','day','km','piece','fixed')),
  rate numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_allowance_types_company ON public.company_allowance_types(company_id);

ALTER TABLE public.company_allowance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view allowance types"
ON public.company_allowance_types FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage allowance types"
ON public.company_allowance_types FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE TRIGGER trg_company_allowance_types_updated_at
BEFORE UPDATE ON public.company_allowance_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. time_entry_allowances
CREATE TABLE IF NOT EXISTS public.time_entry_allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  allowance_type_id uuid REFERENCES public.company_allowance_types(id) ON DELETE SET NULL,
  type_name text NOT NULL,
  unit text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entry_allowances_entry ON public.time_entry_allowances(time_entry_id);

ALTER TABLE public.time_entry_allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or company allowances"
ON public.time_entry_allowances FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.time_entries te
  WHERE te.id = time_entry_id
    AND te.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Insert allowances on own entries"
ON public.time_entry_allowances FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.time_entries te
  WHERE te.id = time_entry_id
    AND te.company_id = get_user_company_id(auth.uid())
    AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
));

CREATE POLICY "Update allowances on own entries"
ON public.time_entry_allowances FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.time_entries te
  WHERE te.id = time_entry_id
    AND te.company_id = get_user_company_id(auth.uid())
    AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
));

CREATE POLICY "Delete allowances on own entries"
ON public.time_entry_allowances FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.time_entries te
  WHERE te.id = time_entry_id
    AND te.company_id = get_user_company_id(auth.uid())
    AND (te.user_id = auth.uid() OR is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
));

-- 4. Seed-funksjon for standard tilleggstyper
CREATE OR REPLACE FUNCTION public.seed_default_allowance_types(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.company_allowance_types WHERE company_id = p_company_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.company_allowance_types (company_id, name, unit, rate, is_default, sort_order) VALUES
    (p_company_id, 'Diett innenlands (over 12 t)', 'day', 940, true, 1),
    (p_company_id, 'Diett innenlands (6–12 t)',   'day', 369, true, 2),
    (p_company_id, 'Kilometergodtgjørelse',        'km', 3.50, true, 3),
    (p_company_id, 'Passasjertillegg',             'km', 1.00, true, 4),
    (p_company_id, 'Reisetimer',                   'hour', 0, true, 5),
    (p_company_id, 'Brudd på hviletid',            'fixed', 0, true, 6),
    (p_company_id, 'Smusstillegg',                 'hour', 0, true, 7);
END;
$$;

-- Seed for alle eksisterende bedrifter
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.companies LOOP
    PERFORM public.seed_default_allowance_types(c.id);
  END LOOP;
END $$;

-- Trigger for nye bedrifter
CREATE OR REPLACE FUNCTION public.handle_new_company_allowances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.seed_default_allowance_types(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_allowance_types ON public.companies;
CREATE TRIGGER trg_seed_allowance_types
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_allowances();