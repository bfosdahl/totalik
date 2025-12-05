-- Create vernerunde templates table
CREATE TABLE public.ks_module2_vernerunde_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ks_module2_vernerunde_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view system templates"
  ON public.ks_module2_vernerunde_templates
  FOR SELECT
  USING (is_system_template = true AND is_active = true);

CREATE POLICY "Users can view their company templates"
  ON public.ks_module2_vernerunde_templates
  FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their company templates"
  ON public.ks_module2_vernerunde_templates
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System admins can manage all templates"
  ON public.ks_module2_vernerunde_templates
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- Add template_id to vernerunder table
ALTER TABLE public.ks_module2_vernerunder 
ADD COLUMN template_id UUID REFERENCES public.ks_module2_vernerunde_templates(id),
ADD COLUMN checklist_responses JSONB DEFAULT '[]'::jsonb;

-- Insert standard HMS vernerunde templates
INSERT INTO public.ks_module2_vernerunde_templates (template_name, description, is_system_template, checkpoints) VALUES
('Standard byggeplasskontroll', 'Generell vernerunde for byggeplass med standard HMS-sjekkpunkter', true, '[
  {"id": "1", "category": "Orden og ryddighet", "checkpoint": "Er arbeidsområdet ryddig og fritt for hindringer?", "help_text": "Sjekk at gangveier er frie, materialer er stablet trygt"},
  {"id": "2", "category": "Orden og ryddighet", "checkpoint": "Er avfall sortert og plassert i riktige containere?", "help_text": "Kontroller avfallshåndtering og sortering"},
  {"id": "3", "category": "Orden og ryddighet", "checkpoint": "Er verktøy og utstyr lagret på anviste plasser?", "help_text": "Verktøy skal være sikret når det ikke er i bruk"},
  {"id": "4", "category": "Verneutstyr", "checkpoint": "Bruker alle påkrevd verneutstyr (hjelm, vernesko, synlighetsklær)?", "help_text": "Sjekk at alle på plassen har korrekt PPE"},
  {"id": "5", "category": "Verneutstyr", "checkpoint": "Er verneutstyr i god stand og riktig vedlikeholdt?", "help_text": "Kontroller at utstyr ikke er skadet eller utslitt"},
  {"id": "6", "category": "Verneutstyr", "checkpoint": "Er spesielt verneutstyr tilgjengelig for spesielle arbeidsoppgaver?", "help_text": "F.eks. hørselvern, åndedrettsvern, hansker"},
  {"id": "7", "category": "Fallsikring", "checkpoint": "Er stillas og arbeidsplattformer kontrollert og godkjent?", "help_text": "Sjekk at stillas har gyldig kontrollmerke"},
  {"id": "8", "category": "Fallsikring", "checkpoint": "Er rekkverk og kantheller på plass ved høydearbeid?", "help_text": "Minimum 1 meter høyt rekkverk"},
  {"id": "9", "category": "Fallsikring", "checkpoint": "Er hull i dekker og tak sikret med solid tildekking?", "help_text": "Tildekking skal være merket og sikret mot forskyvning"},
  {"id": "10", "category": "Fallsikring", "checkpoint": "Brukes fallsikringsutstyr korrekt ved arbeid i høyden?", "help_text": "Sele, line og forankringspunkt"},
  {"id": "11", "category": "Brannvern", "checkpoint": "Er brannslukningsapparater tilgjengelige og kontrollert?", "help_text": "Sjekk at de er lett tilgjengelige og har gyldig kontroll"},
  {"id": "12", "category": "Brannvern", "checkpoint": "Er varme arbeider utført med brannsikring?", "help_text": "Sveising, skjæring, sliping etc."},
  {"id": "13", "category": "Brannvern", "checkpoint": "Er rømningsveier frie og godt merket?", "help_text": "Kontroller at nødutganger ikke er blokkert"},
  {"id": "14", "category": "Elektrisk sikkerhet", "checkpoint": "Er elektriske installasjoner og kabler i god stand?", "help_text": "Sjekk for skader på ledninger og kontakter"},
  {"id": "15", "category": "Elektrisk sikkerhet", "checkpoint": "Er midlertidige el-installasjoner godkjent?", "help_text": "Byggstrøm skal være kontrollert"},
  {"id": "16", "category": "Førstehjelpsutstyr", "checkpoint": "Er førstehjelpsutstyr tilgjengelig og komplett?", "help_text": "Sjekk innhold i førstehjelpskoffert"},
  {"id": "17", "category": "Førstehjelpsutstyr", "checkpoint": "Er hjertestarter tilgjengelig og funksjonstestet?", "help_text": "Hvis påkrevd på prosjektet"},
  {"id": "18", "category": "Maskiner og utstyr", "checkpoint": "Er maskiner og utstyr i forskriftsmessig stand?", "help_text": "Kontroller at sikkerhetsutstyr fungerer"},
  {"id": "19", "category": "Maskiner og utstyr", "checkpoint": "Har operatører nødvendig kompetansebevis?", "help_text": "F.eks. maskinførerbevis, trucksertifikat"},
  {"id": "20", "category": "Skilting og varsling", "checkpoint": "Er nødvendig sikkerhetsskilting på plass?", "help_text": "Forbudsskilt, påbudsskilt, varselskilt"}
]'::jsonb),

('Vernerunde innendørs', 'Vernerunde for innendørs arbeider og ferdigstillelse', true, '[
  {"id": "1", "category": "Orden og ryddighet", "checkpoint": "Er arbeidsområdet ryddig?", "help_text": "Sjekk for hindringer og rot"},
  {"id": "2", "category": "Orden og ryddighet", "checkpoint": "Er materialer lagret forsvarlig?", "help_text": "Stablet trygt, ikke i veien"},
  {"id": "3", "category": "Ventilasjon", "checkpoint": "Er ventilasjonen tilstrekkelig?", "help_text": "Spesielt ved maling, liming, sliping"},
  {"id": "4", "category": "Ventilasjon", "checkpoint": "Brukes avsug ved støvende arbeider?", "help_text": "Punktavsug eller generell ventilasjon"},
  {"id": "5", "category": "Belysning", "checkpoint": "Er belysningen tilstrekkelig?", "help_text": "Minimum 300 lux for generelt arbeid"},
  {"id": "6", "category": "Verneutstyr", "checkpoint": "Brukes riktig verneutstyr?", "help_text": "Støvmaske, vernebriller, hørselsvern"},
  {"id": "7", "category": "Ergonomi", "checkpoint": "Er arbeidsforholdene ergonomisk tilrettelagt?", "help_text": "Arbeidshøyde, løfteteknikk"},
  {"id": "8", "category": "Elektrisk", "checkpoint": "Er elektrisk utstyr i god stand?", "help_text": "Ledninger, kontakter, verktøy"},
  {"id": "9", "category": "Kjemikalier", "checkpoint": "Er kjemikalier merket og oppbevart korrekt?", "help_text": "Datablad tilgjengelig"},
  {"id": "10", "category": "Førstehjelpsutstyr", "checkpoint": "Er førstehjelpsutstyr tilgjengelig?", "help_text": "Plassering kjent for alle"}
]'::jsonb),

('Ukentlig HMS-runde', 'Kort ukentlig HMS-sjekk', true, '[
  {"id": "1", "category": "Generelt", "checkpoint": "Er arbeidsområdet ryddig og sikkert?", "help_text": "Rask oversikt"},
  {"id": "2", "category": "Generelt", "checkpoint": "Brukes påkrevd verneutstyr?", "help_text": "Hjelm, vernesko, synlighet"},
  {"id": "3", "category": "Generelt", "checkpoint": "Er sikkerhetsutstyr på plass og fungerende?", "help_text": "Rekkverk, stiger, førstehjelpsutstyr"},
  {"id": "4", "category": "Generelt", "checkpoint": "Er det meldt inn nye risikoforhold?", "help_text": "Sjekk om det har oppstått nye farer"},
  {"id": "5", "category": "Generelt", "checkpoint": "Er tidligere avvik lukket?", "help_text": "Følg opp fra forrige runde"}
]'::jsonb);

-- Create index for performance
CREATE INDEX idx_vernerunde_templates_company ON public.ks_module2_vernerunde_templates(company_id);
CREATE INDEX idx_vernerunde_templates_system ON public.ks_module2_vernerunde_templates(is_system_template) WHERE is_system_template = true;