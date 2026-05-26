
CREATE TABLE public.hms_sja_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hms_sja_templates_company ON public.hms_sja_templates(company_id);

ALTER TABLE public.hms_sja_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view SJA templates"
ON public.hms_sja_templates FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company members can create SJA templates"
ON public.hms_sja_templates FOR INSERT
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can update SJA templates"
ON public.hms_sja_templates FOR UPDATE
USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Company members can delete SJA templates"
ON public.hms_sja_templates FOR DELETE
USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_system_admin(auth.uid()));

CREATE TRIGGER set_hms_sja_templates_updated_at
BEFORE UPDATE ON public.hms_sja_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
