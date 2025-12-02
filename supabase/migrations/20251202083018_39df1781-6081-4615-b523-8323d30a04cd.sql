-- Create inspections table for KS Bygg customer site visits
CREATE TABLE public.ks_project_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  inspection_date DATE NOT NULL,
  beskrivelse TEXT,
  adresse TEXT,
  postal_code TEXT,
  city TEXT,
  kunde_navn TEXT,
  gyldig_til DATE,
  status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'tilbud_opprettet', 'faktura_opprettet', 'fakturert', 'utløpt')),
  pris DECIMAL(10,2),
  opprettet_av_user_id UUID REFERENCES auth.users(id),
  opprettet_av_navn TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inspection photos table
CREATE TABLE public.ks_inspection_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.ks_project_inspections(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by_user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ks_project_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ks_inspection_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for inspections
CREATE POLICY "Users can view their company inspections"
  ON public.ks_project_inspections FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create inspections for their company"
  ON public.ks_project_inspections FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company inspections"
  ON public.ks_project_inspections FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete their company inspections"
  ON public.ks_project_inspections FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- RLS policies for inspection photos
CREATE POLICY "Users can view their company inspection photos"
  ON public.ks_inspection_photos FOR SELECT
  USING (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can upload inspection photos"
  ON public.ks_inspection_photos FOR INSERT
  WITH CHECK (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Admins can delete inspection photos"
  ON public.ks_inspection_photos FOR DELETE
  USING (inspection_id IN (
    SELECT id FROM public.ks_project_inspections 
    WHERE company_id = get_user_company_id(auth.uid()) 
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  ));

-- Create indexes
CREATE INDEX idx_ks_inspections_company ON public.ks_project_inspections(company_id);
CREATE INDEX idx_ks_inspections_project ON public.ks_project_inspections(project_id);
CREATE INDEX idx_ks_inspections_status ON public.ks_project_inspections(status);
CREATE INDEX idx_ks_inspections_date ON public.ks_project_inspections(inspection_date);
CREATE INDEX idx_ks_inspection_photos_inspection ON public.ks_inspection_photos(inspection_id);