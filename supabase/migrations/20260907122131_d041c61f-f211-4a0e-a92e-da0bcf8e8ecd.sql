CREATE TABLE public.company_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  org_number text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX company_customers_company_name_key
  ON public.company_customers (company_id, lower(name))
  WHERE is_deleted = false;

CREATE INDEX company_customers_company_idx ON public.company_customers (company_id) WHERE is_deleted = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_customers TO authenticated;
GRANT ALL ON public.company_customers TO service_role;

ALTER TABLE public.company_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view customers"
  ON public.company_customers FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company members can create customers"
  ON public.company_customers FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company members can update customers"
  ON public.company_customers FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company admins can delete customers"
  ON public.company_customers FOR DELETE TO authenticated
  USING ((company_id = public.get_user_company_id(auth.uid()) AND public.is_company_admin(auth.uid())) OR public.is_system_admin(auth.uid()));

CREATE TRIGGER update_company_customers_updated_at
  BEFORE UPDATE ON public.company_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ks_module2_projects
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.company_customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ks_module2_projects_customer_idx ON public.ks_module2_projects (customer_id);

INSERT INTO public.company_customers (company_id, name)
SELECT DISTINCT p.company_id, btrim(p.client_name)
FROM public.ks_module2_projects p
WHERE p.client_name IS NOT NULL
  AND btrim(p.client_name) <> ''
  AND p.company_id IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE public.ks_module2_projects p
SET customer_id = c.id
FROM public.company_customers c
WHERE p.customer_id IS NULL
  AND p.company_id = c.company_id
  AND c.is_deleted = false
  AND lower(btrim(p.client_name)) = lower(c.name);