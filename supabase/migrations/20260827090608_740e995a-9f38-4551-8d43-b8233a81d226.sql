CREATE TABLE public.nybygg_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_number text NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  terms_accepted boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'nybygg',
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nybygg_leads TO authenticated;
GRANT ALL ON public.nybygg_leads TO service_role;

ALTER TABLE public.nybygg_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view nybygg leads"
ON public.nybygg_leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admins can update nybygg leads"
ON public.nybygg_leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'))
WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admins can delete nybygg leads"
ON public.nybygg_leads FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE TRIGGER update_nybygg_leads_updated_at
BEFORE UPDATE ON public.nybygg_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();