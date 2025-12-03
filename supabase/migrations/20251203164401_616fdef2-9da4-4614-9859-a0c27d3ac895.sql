-- Create table for KS Module 2 checklist templates (admin-managed)
CREATE TABLE public.ks_module2_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for downloadable document templates
CREATE TABLE public.ks_module2_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  version TEXT DEFAULT '1.0',
  valid_from DATE,
  valid_to DATE,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for KS Module 2 company settings
CREATE TABLE public.ks_module2_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_deadline_days INTEGER DEFAULT 7,
  email_notifications_enabled BOOLEAN DEFAULT true,
  weekly_report_enabled BOOLEAN DEFAULT true,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#5B6BFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_module2_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist templates
CREATE POLICY "Users can view their company templates and system templates"
ON public.ks_module2_checklist_templates FOR SELECT
USING (
  is_system_template = true 
  OR company_id = get_user_company_id(auth.uid())
  OR is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can manage their company templates"
ON public.ks_module2_checklist_templates FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
);

-- RLS policies for document templates
CREATE POLICY "Users can view their company document templates and system templates"
ON public.ks_module2_document_templates FOR SELECT
USING (
  is_system_template = true 
  OR company_id = get_user_company_id(auth.uid())
  OR is_system_admin(auth.uid())
);

CREATE POLICY "Company admins can manage their company document templates"
ON public.ks_module2_document_templates FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
);

-- RLS policies for settings
CREATE POLICY "Users can view their company settings"
ON public.ks_module2_settings FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) OR is_system_admin(auth.uid()));

CREATE POLICY "Company admins can manage their company settings"
ON public.ks_module2_settings FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid()) AND is_company_admin(auth.uid()))
  OR is_system_admin(auth.uid())
);

-- Insert 25+ Norwegian standard checklist templates
INSERT INTO public.ks_module2_checklist_templates (template_name, category, description, is_system_template, checkpoints) VALUES
('Betongstøp', 'betong', 'Sjekkliste for kontroll av betongstøp', true, '[
  {"id": "1", "text": "Forskaling kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Armering kontrollert iht. tegninger", "type": "yesno", "required": true},
  {"id": "3", "text": "Overdekning armering OK", "type": "yesno", "required": true},
  {"id": "4", "text": "Innstøpningsgods plassert korrekt", "type": "yesno", "required": true},
  {"id": "5", "text": "Betongklasse", "type": "text", "required": true},
  {"id": "6", "text": "Følgeseddel mottatt", "type": "yesno", "required": true},
  {"id": "7", "text": "Synkmål kontrollert", "type": "number", "required": true, "unit": "mm"},
  {"id": "8", "text": "Lufttemperatur ved støp", "type": "number", "required": true, "unit": "°C"},
  {"id": "9", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Våtrom NS-3600', 'våtrom', 'Sjekkliste for våtromsarbeid iht. NS-3600', true, '[
  {"id": "1", "text": "Underlag kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Fall mot sluk kontrollert", "type": "yesno", "required": true},
  {"id": "3", "text": "Membran påført iht. produsentens anvisning", "type": "yesno", "required": true},
  {"id": "4", "text": "Membrantykkelse OK", "type": "yesno", "required": true},
  {"id": "5", "text": "Slukmansjett montert korrekt", "type": "yesno", "required": true},
  {"id": "6", "text": "Tetthetstest utført", "type": "yesno", "required": true},
  {"id": "7", "text": "Flis/belegg lagt iht. anvisning", "type": "yesno", "required": true},
  {"id": "8", "text": "Dokumentasjonsfoto membran", "type": "photo", "required": true},
  {"id": "9", "text": "Dokumentasjonsfoto ferdig våtrom", "type": "photo", "required": true}
]'::jsonb),

('Sluttkontroll', 'ferdigstillelse', 'Sjekkliste for sluttkontroll før overlevering', true, '[
  {"id": "1", "text": "Alle arbeider ferdigstilt iht. kontrakt", "type": "yesno", "required": true},
  {"id": "2", "text": "Rengjøring utført", "type": "yesno", "required": true},
  {"id": "3", "text": "Alle dører og vinduer fungerer", "type": "yesno", "required": true},
  {"id": "4", "text": "Alle tekniske installasjoner testet", "type": "yesno", "required": true},
  {"id": "5", "text": "Elektrisk anlegg kontrollert", "type": "yesno", "required": true},
  {"id": "6", "text": "VVS-installasjoner kontrollert", "type": "yesno", "required": true},
  {"id": "7", "text": "Ventilasjon kontrollert og innregulert", "type": "yesno", "required": true},
  {"id": "8", "text": "FDV-dokumentasjon komplett", "type": "yesno", "required": true},
  {"id": "9", "text": "Eventuelle mangler notert", "type": "text", "required": false},
  {"id": "10", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Taktekking', 'tak', 'Sjekkliste for kontroll av taktekking', true, '[
  {"id": "1", "text": "Underlag kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Dampsperre lagt korrekt", "type": "yesno", "required": true},
  {"id": "3", "text": "Isolasjon lagt iht. tegninger", "type": "yesno", "required": true},
  {"id": "4", "text": "Takbelegg festet korrekt", "type": "yesno", "required": true},
  {"id": "5", "text": "Beslag og avslutninger OK", "type": "yesno", "required": true},
  {"id": "6", "text": "Sluk og avløp kontrollert", "type": "yesno", "required": true},
  {"id": "7", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Grunnarbeid', 'grunn', 'Sjekkliste for grunnarbeider', true, '[
  {"id": "1", "text": "Grunnforhold iht. geoteknisk rapport", "type": "yesno", "required": true},
  {"id": "2", "text": "Utgravning til riktig dybde", "type": "yesno", "required": true},
  {"id": "3", "text": "Drenering lagt korrekt", "type": "yesno", "required": true},
  {"id": "4", "text": "Radonsperre lagt (hvis aktuelt)", "type": "yesno", "required": false},
  {"id": "5", "text": "Fundament armert iht. tegninger", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Branntetning', 'brann', 'Sjekkliste for branntetnng av gjennomføringer', true, '[
  {"id": "1", "text": "Gjennomføring identifisert og merket", "type": "yesno", "required": true},
  {"id": "2", "text": "Brannklasse angitt", "type": "text", "required": true},
  {"id": "3", "text": "Riktig produkt brukt", "type": "yesno", "required": true},
  {"id": "4", "text": "Montert iht. produsentens anvisning", "type": "yesno", "required": true},
  {"id": "5", "text": "Merking påført", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto før tetning", "type": "photo", "required": true},
  {"id": "7", "text": "Dokumentasjonsfoto etter tetning", "type": "photo", "required": true}
]'::jsonb),

('Tømrerarbeid vegg', 'tømrer', 'Sjekkliste for tømrerarbeid vegger', true, '[
  {"id": "1", "text": "Stenderverk plassert iht. tegninger", "type": "yesno", "required": true},
  {"id": "2", "text": "Vindsperre montert korrekt", "type": "yesno", "required": true},
  {"id": "3", "text": "Isolasjon lagt uten kuldebroer", "type": "yesno", "required": true},
  {"id": "4", "text": "Dampsperre montert og tettet", "type": "yesno", "required": true},
  {"id": "5", "text": "Innvendig kledning montert", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Vinduer og dører', 'tømrer', 'Sjekkliste for montering av vinduer og dører', true, '[
  {"id": "1", "text": "Åpning kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Vindu/dør plassert i vater og lodd", "type": "yesno", "required": true},
  {"id": "3", "text": "Festet iht. produsentens anvisning", "type": "yesno", "required": true},
  {"id": "4", "text": "Isolert rundt karm", "type": "yesno", "required": true},
  {"id": "5", "text": "Tettet med dampsperre innvendig", "type": "yesno", "required": true},
  {"id": "6", "text": "Tettet med vindsperre utvendig", "type": "yesno", "required": true},
  {"id": "7", "text": "Funksjonskontroll utført", "type": "yesno", "required": true},
  {"id": "8", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Elementmontasje', 'betong', 'Sjekkliste for montering av betongelementer', true, '[
  {"id": "1", "text": "Element kontrollert for skader", "type": "yesno", "required": true},
  {"id": "2", "text": "Underlag/opplagspunkter OK", "type": "yesno", "required": true},
  {"id": "3", "text": "Element plassert iht. tegninger", "type": "yesno", "required": true},
  {"id": "4", "text": "Midlertidig avstiving montert", "type": "yesno", "required": true},
  {"id": "5", "text": "Fuger tettet korrekt", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Stålkonstruksjon', 'stål', 'Sjekkliste for stålkonstruksjoner', true, '[
  {"id": "1", "text": "Materialsertifikat mottatt", "type": "yesno", "required": true},
  {"id": "2", "text": "Bolter og skruer riktig kvalitet", "type": "yesno", "required": true},
  {"id": "3", "text": "Sveiser kontrollert", "type": "yesno", "required": true},
  {"id": "4", "text": "Overflatebehandling OK", "type": "yesno", "required": true},
  {"id": "5", "text": "Montert iht. tegninger", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Elektrisk installasjon', 'elektro', 'Sjekkliste for elektriske installasjoner', true, '[
  {"id": "1", "text": "Kabelføringer iht. tegninger", "type": "yesno", "required": true},
  {"id": "2", "text": "Jordfeilbryter montert og testet", "type": "yesno", "required": true},
  {"id": "3", "text": "Sikringsskap montert korrekt", "type": "yesno", "required": true},
  {"id": "4", "text": "Stikkontakter og brytere plassert riktig", "type": "yesno", "required": true},
  {"id": "5", "text": "Belysning montert og fungerer", "type": "yesno", "required": true},
  {"id": "6", "text": "Isolasjonstesting utført", "type": "yesno", "required": true},
  {"id": "7", "text": "Samsvarserklæring utstedt", "type": "yesno", "required": true}
]'::jsonb),

('Rørleggerarbeid', 'rør', 'Sjekkliste for rørleggerarbeider', true, '[
  {"id": "1", "text": "Rørføringer iht. tegninger", "type": "yesno", "required": true},
  {"id": "2", "text": "Trykktesting utført", "type": "yesno", "required": true},
  {"id": "3", "text": "Isolering av rør komplett", "type": "yesno", "required": true},
  {"id": "4", "text": "Sanitærutstyr montert", "type": "yesno", "required": true},
  {"id": "5", "text": "Funksjonskontroll utført", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Ventilasjon', 'ventilasjon', 'Sjekkliste for ventilasjonsanlegg', true, '[
  {"id": "1", "text": "Kanaler montert iht. tegninger", "type": "yesno", "required": true},
  {"id": "2", "text": "Tetthetstesting utført", "type": "yesno", "required": true},
  {"id": "3", "text": "Isolering komplett", "type": "yesno", "required": true},
  {"id": "4", "text": "Aggregat montert og tilkoblet", "type": "yesno", "required": true},
  {"id": "5", "text": "Innregulering utført", "type": "yesno", "required": true},
  {"id": "6", "text": "Måleprotokoll godkjent", "type": "yesno", "required": true}
]'::jsonb),

('Gulvlegging parkett', 'gulv', 'Sjekkliste for parkett/laminatgulv', true, '[
  {"id": "1", "text": "Underlag kontrollert for fukt", "type": "yesno", "required": true},
  {"id": "2", "text": "Fuktmåling RF%", "type": "number", "required": true, "unit": "%"},
  {"id": "3", "text": "Underlag plant og rent", "type": "yesno", "required": true},
  {"id": "4", "text": "Fuktsperre lagt", "type": "yesno", "required": true},
  {"id": "5", "text": "Ekspansjonsfuge ved vegger", "type": "yesno", "required": true},
  {"id": "6", "text": "Gulv akklimatisert", "type": "yesno", "required": true},
  {"id": "7", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Flislegging', 'gulv', 'Sjekkliste for flislegging', true, '[
  {"id": "1", "text": "Underlag kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Membran lagt (hvis påkrevd)", "type": "yesno", "required": false},
  {"id": "3", "text": "Flislim påført korrekt", "type": "yesno", "required": true},
  {"id": "4", "text": "Flis lagt i plan", "type": "yesno", "required": true},
  {"id": "5", "text": "Fuger fylt og rengjort", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Maling innvendig', 'overflate', 'Sjekkliste for innvendig malerarbeid', true, '[
  {"id": "1", "text": "Underlag kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Sparkling utført", "type": "yesno", "required": true},
  {"id": "3", "text": "Grunning påført", "type": "yesno", "required": true},
  {"id": "4", "text": "Malingssystem iht. spesifikasjon", "type": "yesno", "required": true},
  {"id": "5", "text": "Dekkende og jevnt resultat", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Fasadekledning', 'fasade', 'Sjekkliste for fasadekledning', true, '[
  {"id": "1", "text": "Underlag kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Vindsperre montert og tettet", "type": "yesno", "required": true},
  {"id": "3", "text": "Lekter montert med lufting", "type": "yesno", "required": true},
  {"id": "4", "text": "Kledning montert iht. anvisning", "type": "yesno", "required": true},
  {"id": "5", "text": "Beslag og avslutninger OK", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Heis installasjon', 'heis', 'Sjekkliste for heisinstallasjon', true, '[
  {"id": "1", "text": "Sjakt kontrollert og godkjent", "type": "yesno", "required": true},
  {"id": "2", "text": "Maskinrom ferdigstilt", "type": "yesno", "required": true},
  {"id": "3", "text": "Skinnegang montert", "type": "yesno", "required": true},
  {"id": "4", "text": "Kabinett montert", "type": "yesno", "required": true},
  {"id": "5", "text": "Sikkerhetssystemer testet", "type": "yesno", "required": true},
  {"id": "6", "text": "Samsvarserklæring utstedt", "type": "yesno", "required": true}
]'::jsonb),

('Garasjeport', 'port', 'Sjekkliste for garasjeportmontasje', true, '[
  {"id": "1", "text": "Åpning kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Skinner og beslag montert", "type": "yesno", "required": true},
  {"id": "3", "text": "Portblad montert", "type": "yesno", "required": true},
  {"id": "4", "text": "Motor og styring installert", "type": "yesno", "required": true},
  {"id": "5", "text": "Sikkerhetssensorer testet", "type": "yesno", "required": true},
  {"id": "6", "text": "Funksjonskontroll OK", "type": "yesno", "required": true}
]'::jsonb),

('Trapp montering', 'tømrer', 'Sjekkliste for trappeinstallasjon', true, '[
  {"id": "1", "text": "Åpning kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Trapp plassert i vater", "type": "yesno", "required": true},
  {"id": "3", "text": "Festet sikkert til konstruksjon", "type": "yesno", "required": true},
  {"id": "4", "text": "Rekkverk montert (høyde OK)", "type": "yesno", "required": true},
  {"id": "5", "text": "Trinnhøyde og bredde iht. TEK", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Balkong/terrasse', 'tømrer', 'Sjekkliste for balkong og terrasse', true, '[
  {"id": "1", "text": "Bærekonstruksjon kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Fall mot avløp OK", "type": "yesno", "required": true},
  {"id": "3", "text": "Membran/belegg lagt korrekt", "type": "yesno", "required": true},
  {"id": "4", "text": "Rekkverk montert og sikret", "type": "yesno", "required": true},
  {"id": "5", "text": "Rekkverk høyde iht. TEK", "type": "yesno", "required": true},
  {"id": "6", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Utomhusarbeid', 'utomhus', 'Sjekkliste for utomhusarbeider', true, '[
  {"id": "1", "text": "Terrengarbeid utført iht. plan", "type": "yesno", "required": true},
  {"id": "2", "text": "Drenering og overvannshåndtering OK", "type": "yesno", "required": true},
  {"id": "3", "text": "Belegningsstein/asfalt lagt", "type": "yesno", "required": true},
  {"id": "4", "text": "Kantstein satt", "type": "yesno", "required": true},
  {"id": "5", "text": "Belysning montert", "type": "yesno", "required": true},
  {"id": "6", "text": "Beplantning utført", "type": "yesno", "required": false},
  {"id": "7", "text": "Dokumentasjonsfoto", "type": "photo", "required": true}
]'::jsonb),

('Solavskjerming', 'fasade', 'Sjekkliste for solavskjerming', true, '[
  {"id": "1", "text": "Festepunkter kontrollert", "type": "yesno", "required": true},
  {"id": "2", "text": "Skinner/oppheng montert", "type": "yesno", "required": true},
  {"id": "3", "text": "Screens/persienner montert", "type": "yesno", "required": true},
  {"id": "4", "text": "Motor og styring installert", "type": "yesno", "required": true},
  {"id": "5", "text": "Funksjonskontroll OK", "type": "yesno", "required": true}
]'::jsonb),

('Sprinkleranlegg', 'brann', 'Sjekkliste for sprinklerinstallasjon', true, '[
  {"id": "1", "text": "Rørføringer iht. tegninger", "type": "yesno", "required": true},
  {"id": "2", "text": "Sprinklerhoder plassert korrekt", "type": "yesno", "required": true},
  {"id": "3", "text": "Trykktesting utført", "type": "yesno", "required": true},
  {"id": "4", "text": "Alarmsystem tilkoblet", "type": "yesno", "required": true},
  {"id": "5", "text": "Samsvarserklæring utstedt", "type": "yesno", "required": true}
]'::jsonb),

('Brannalarm', 'brann', 'Sjekkliste for brannalarmanlegg', true, '[
  {"id": "1", "text": "Detektorer plassert iht. plan", "type": "yesno", "required": true},
  {"id": "2", "text": "Manuelle meldere montert", "type": "yesno", "required": true},
  {"id": "3", "text": "Sentral montert og programmert", "type": "yesno", "required": true},
  {"id": "4", "text": "Alarmgivere montert", "type": "yesno", "required": true},
  {"id": "5", "text": "Funksjonstest utført", "type": "yesno", "required": true},
  {"id": "6", "text": "Samsvarserklæring utstedt", "type": "yesno", "required": true}
]'::jsonb);

-- Add indexes for performance
CREATE INDEX idx_ks_module2_checklist_templates_company ON public.ks_module2_checklist_templates(company_id);
CREATE INDEX idx_ks_module2_document_templates_company ON public.ks_module2_document_templates(company_id);
CREATE INDEX idx_ks_module2_settings_company ON public.ks_module2_settings(company_id);