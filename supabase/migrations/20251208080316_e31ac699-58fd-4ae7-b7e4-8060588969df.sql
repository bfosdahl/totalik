-- Create admin project type templates table
-- This stores project types with associated checklists, routines, documents
CREATE TABLE public.admin_project_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'building',
  contractor_type TEXT DEFAULT 'total',
  default_description TEXT,
  -- JSON arrays of template IDs to include
  checklist_template_ids UUID[] DEFAULT '{}',
  routine_template_ids UUID[] DEFAULT '{}',
  document_template_ids UUID[] DEFAULT '{}',
  -- Example content settings
  include_example_content BOOLEAN DEFAULT false,
  example_content_level TEXT DEFAULT 'minimal', -- 'minimal', 'medium', 'full'
  example_client_name TEXT,
  example_client_org_number TEXT,
  example_contract_sum NUMERIC,
  example_meeting_notes JSONB,
  example_subcontractors JSONB,
  example_deviations JSONB,
  example_change_orders JSONB,
  example_milestones JSONB,
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_project_type_templates ENABLE ROW LEVEL SECURITY;

-- Only system admins can manage these templates
CREATE POLICY "System admins can view project type templates"
  ON public.admin_project_type_templates
  FOR SELECT
  USING (true);

CREATE POLICY "System admins can insert project type templates"
  ON public.admin_project_type_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update project type templates"
  ON public.admin_project_type_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can delete project type templates"
  ON public.admin_project_type_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'system_admin'
    )
  );

-- Insert default project type templates based on existing hardcoded templates
INSERT INTO public.admin_project_type_templates (template_name, description, contractor_type, default_description, sort_order) VALUES
  ('Tomt prosjekt', 'Start fra bunnen uten forhåndsutfylling', 'total', '', 0),
  ('Enebolig', 'Nybygg eller renovering av enebolig', 'total', 'Oppføring/renovering av enebolig. Prosjektet omfatter komplett byggearbeid fra grunn til ferdig bygg.', 1),
  ('Leilighetsbygg', 'Flerboligbygg med leiligheter', 'total', 'Oppføring av leilighetsbygg. Prosjektet omfatter komplett byggearbeid inkludert fellesarealer.', 2),
  ('Næringsbygg', 'Kontor, butikk eller industribygg', 'hoved', 'Oppføring av næringsbygg. Prosjektet omfatter byggearbeid tilpasset næringsdrift.', 3),
  ('Totalrenovering', 'Større renovering av eksisterende bygg', 'hoved', 'Totalrenovering av eksisterende bygg. Prosjektet omfatter omfattende oppgradering og modernisering.', 4),
  ('Tilbygg/påbygg', 'Utvidelse av eksisterende bygg', 'hoved', 'Tilbygg/påbygg til eksisterende bygg. Prosjektet omfatter utvidelse med tilkobling til eksisterende konstruksjon.', 5),
  ('Betongarbeid', 'Spesialisert betongentreprise', 'under', 'Betongarbeider. Prosjektet omfatter forskaling, armering og støping iht. tegninger og beskrivelse.', 6),
  ('Tømrerarbeid', 'Tømrer- og snekkerarbeid', 'under', 'Tømrer- og snekkerarbeid. Prosjektet omfatter trearbeider iht. tegninger og beskrivelse.', 7),
  ('Rørleggerarbeid', 'VVS og sanitærinstallasjon', 'under', 'VVS og sanitærarbeid. Prosjektet omfatter rørinstallasjon, sanitærutstyr og evt. varmeanlegg.', 8),
  ('Elektroarbeid', 'Elektrisk installasjon', 'under', 'Elektroarbeider. Prosjektet omfatter elektrisk installasjon iht. tegninger og beskrivelse.', 9),
  ('Malerarbeid', 'Maling og overflatebehandling', 'under', 'Maler- og tapetserarbeid. Prosjektet omfatter overflatebehandling av vegger, tak og treverk.', 10),
  ('Flislegging', 'Flis og våtromsarbeid', 'under', 'Flislegging og våtromsarbeid. Prosjektet omfatter membran, flislegging og fuging i våtrom.', 11);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_project_type_templates_updated_at
  BEFORE UPDATE ON public.admin_project_type_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();