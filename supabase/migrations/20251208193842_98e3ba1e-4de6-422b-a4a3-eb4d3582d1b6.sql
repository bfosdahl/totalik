
-- Byggesak & Blanketter module tables

-- Admin table for form templates (official DIBK forms)
CREATE TABLE public.admin_byggesak_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_number TEXT NOT NULL, -- e.g. '5154', '5181', '5185'
  form_name TEXT NOT NULL, -- e.g. 'Nabovarsel', 'Erklæring om ansvarsrett'
  form_category TEXT NOT NULL DEFAULT 'general', -- nabovarsel, soknad, ansvarsrett, kontroll, ferdigattest
  description TEXT,
  version TEXT, -- e.g. '2024', 'TEK17'
  language TEXT NOT NULL DEFAULT 'nb', -- nb = bokmål, nn = nynorsk
  pdf_file_path TEXT, -- path to official PDF template
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE,
  valid_to DATE,
  sort_order INTEGER DEFAULT 0,
  required_fields JSONB DEFAULT '[]', -- fields that must be filled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project byggesak (building permit case) 
CREATE TABLE public.ks_module2_byggesak (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  case_number TEXT, -- kommunens saksnummer
  municipality TEXT, -- kommune
  gnr TEXT, -- gårdsnummer
  bnr TEXT, -- bruksnummer
  fnr TEXT, -- festenummer
  snr TEXT, -- seksjonsnummer
  property_address TEXT,
  building_type TEXT, -- enebolig, tilbygg, garasje, etc.
  tiltaksklasse TEXT DEFAULT '1', -- 1, 2, 3
  application_type TEXT, -- ett-trinn, ramme, igangsetting
  søker_role TEXT DEFAULT 'UTF', -- SØK, PRO, UTF
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, submitted, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual form instances for a byggesak
CREATE TABLE public.ks_module2_byggesak_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  byggesak_id UUID NOT NULL REFERENCES ks_module2_byggesak(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES admin_byggesak_templates(id),
  form_number TEXT NOT NULL, -- e.g. '5181', '5154'
  form_name TEXT NOT NULL,
  form_category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, draft, ready, signed, sent, uploaded
  form_data JSONB DEFAULT '{}', -- filled form fields
  signature_data JSONB, -- digital signature info
  signed_by_name TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  pdf_file_path TEXT, -- generated or uploaded signed PDF
  uploaded_file_path TEXT, -- for scanned paper versions
  sent_to TEXT, -- kommune, altinn, etc.
  sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Nabovarsel recipients tracking
CREATE TABLE public.ks_module2_nabovarsel_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES ks_module2_byggesak_forms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ks_module2_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  neighbor_name TEXT NOT NULL,
  neighbor_address TEXT,
  gnr TEXT,
  bnr TEXT,
  email TEXT,
  phone TEXT,
  notification_method TEXT DEFAULT 'email', -- email, sms, registered_mail, personal
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  response_status TEXT DEFAULT 'pending', -- pending, no_objection, objection, no_response
  response_text TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  receipt_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_byggesak_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_byggesak ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_byggesak_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_nabovarsel_recipients ENABLE ROW LEVEL SECURITY;

-- Admin templates: all authenticated users can read, only system_admin can write
CREATE POLICY "Anyone can view active templates" ON admin_byggesak_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "System admins can manage templates" ON admin_byggesak_templates
  FOR ALL USING (is_system_admin(auth.uid()));

-- Byggesak: company users can manage their own
CREATE POLICY "Users can view company byggesak" ON ks_module2_byggesak
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR 
    is_system_admin(auth.uid()) OR
    has_guest_project_access(project_id)
  );

CREATE POLICY "Users can insert company byggesak" ON ks_module2_byggesak
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can update company byggesak" ON ks_module2_byggesak
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can delete company byggesak" ON ks_module2_byggesak
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

-- Byggesak forms: company users can manage their own
CREATE POLICY "Users can view company forms" ON ks_module2_byggesak_forms
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR 
    is_system_admin(auth.uid()) OR
    has_guest_project_access(project_id)
  );

CREATE POLICY "Users can insert company forms" ON ks_module2_byggesak_forms
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can update company forms" ON ks_module2_byggesak_forms
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can delete company forms" ON ks_module2_byggesak_forms
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

-- Nabovarsel recipients: company users can manage their own
CREATE POLICY "Users can view nabovarsel recipients" ON ks_module2_nabovarsel_recipients
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) OR 
    is_system_admin(auth.uid()) OR
    has_guest_project_access(project_id)
  );

CREATE POLICY "Users can insert nabovarsel recipients" ON ks_module2_nabovarsel_recipients
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can update nabovarsel recipients" ON ks_module2_nabovarsel_recipients
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Users can delete nabovarsel recipients" ON ks_module2_nabovarsel_recipients
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_admin_byggesak_templates_updated_at
  BEFORE UPDATE ON admin_byggesak_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_module2_byggesak_updated_at
  BEFORE UPDATE ON ks_module2_byggesak
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_module2_byggesak_forms_updated_at
  BEFORE UPDATE ON ks_module2_byggesak_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_module2_nabovarsel_recipients_updated_at
  BEFORE UPDATE ON ks_module2_nabovarsel_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default form templates
INSERT INTO admin_byggesak_templates (form_number, form_name, form_category, description, sort_order) VALUES
('5154', 'Nabovarsel', 'nabovarsel', 'Varsel til naboer og gjenboere om byggetiltak', 1),
('5155', 'Opplysninger gitt i nabovarsel', 'nabovarsel', 'Dokumentasjon av opplysninger gitt til naboer', 2),
('5156', 'Kvittering for nabovarsel', 'nabovarsel', 'Kvittering for mottatt nabovarsel', 3),
('5151', 'Søknad om igangsettingstillatelse', 'soknad', 'Søknad om tillatelse til å starte byggearbeid', 10),
('5153', 'Søknad om tiltak uten ansvarsrett', 'soknad', 'Søknad for mindre tiltak uten krav til ansvarsrett', 11),
('5174', 'Søknad om tillatelse til tiltak', 'soknad', 'Hovedsøknad - rammetillatelse eller ett-trinnssøknad', 12),
('5175', 'Opplysninger om tiltakets ytre rammer', 'soknad', 'Vedlegg med info om tiltakets ytre rammer', 13),
('5176', 'Boligspesifikasjon i matrikkelen', 'soknad', 'Spesifikasjon av bolig for matrikkelføring', 14),
('5181', 'Erklæring om ansvarsrett', 'ansvarsrett', 'Erklæring om ansvarsrett for SØK, PRO eller UTF', 20),
('5183', 'Opphør av ansvarsrett', 'ansvarsrett', 'Melding om opphør av ansvarsrett', 21),
('5184', 'Søknad om personlig ansvarsrett som selvbygger', 'ansvarsrett', 'Søknad for selvbygger', 22),
('5186', 'Melding om endring av ansvarsrett', 'ansvarsrett', 'Endring i tidligere erklært ansvarsrett', 23),
('5185', 'Gjennomføringsplan', 'plan', 'Oversikt over ansvar, funksjoner og kontroll', 30),
('5148', 'Samsvarserklæring', 'kontroll', 'Erklæring om samsvar med TEK17', 40),
('5149', 'Kontrollerklæring med sluttrapport', 'kontroll', 'Kontrollerklæring for uavhengig kontroll', 41),
('5191', 'Plan for uavhengig kontroll', 'kontroll', 'Detaljert plan for gjennomføring av kontroll', 42),
('5192', 'Melding om åpent avvik', 'kontroll', 'Melding til kommunen om åpent avvik', 43),
('5167', 'Søknad om ferdigattest', 'ferdigattest', 'Søknad om ferdigattest når tiltaket er fullført', 50),
('5168', 'Søknad om endring av tillatelse', 'ferdigattest', 'Søknad om endring av tidligere gitt tillatelse', 51),
('5169', 'Søknad om midlertidig brukstillatelse', 'ferdigattest', 'Søknad om midlertidig brukstillatelse', 52),
('5188', 'Melding om unntatt tiltak', 'melding', 'Melding om tiltak unntatt søknadsplikt', 60),
('5177', 'Søknad om Arbeidstilsynets samtykke', 'annet', 'Søknad til Arbeidstilsynet', 70),
('5178', 'Sluttrapport avfallsplan nybygg', 'annet', 'Avfallshåndtering for nybygg', 71),
('5179', 'Sluttrapport avfallsplan rehabilitering', 'annet', 'Avfallshåndtering for rehabilitering og riving', 72);

-- Create storage bucket for byggesak documents
INSERT INTO storage.buckets (id, name, public) VALUES ('byggesak-documents', 'byggesak-documents', false);

-- Storage policies
CREATE POLICY "Company users can view byggesak docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'byggesak-documents' AND
    (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Company users can upload byggesak docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'byggesak-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Company users can update byggesak docs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'byggesak-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Company users can delete byggesak docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'byggesak-documents' AND
    auth.uid() IS NOT NULL
  );
