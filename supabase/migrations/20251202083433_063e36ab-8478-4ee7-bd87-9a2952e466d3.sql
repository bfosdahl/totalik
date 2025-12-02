-- Rename and consolidate inspections tables
-- First, add inspection_type column to existing ks_project_inspections
ALTER TABLE public.ks_project_inspections 
ADD COLUMN IF NOT EXISTS inspection_type TEXT NOT NULL DEFAULT 'befaring'
CHECK (inspection_type IN ('ferdigbefaring', 'forhåndsbefaring', 'hms', 'sluttbefaring', 'vernerunde', 'befaring'));

-- Add område (area/location) field for all inspections
ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS område TEXT;

-- Add time tracking fields for inspections
ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS tidspunkt TEXT;

ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS planlagt_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS startdato TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS sluttdato TIMESTAMP WITH TIME ZONE;

-- Add tittel field
ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS tittel TEXT;

-- Update existing status check constraint to include more statuses
ALTER TABLE public.ks_project_inspections 
DROP CONSTRAINT IF EXISTS ks_project_inspections_status_check;

ALTER TABLE public.ks_project_inspections
ADD CONSTRAINT ks_project_inspections_status_check 
CHECK (status IN ('planlagt', 'ikke_startet', 'pågår', 'ferdig', 'aktiv', 'tilbud_opprettet', 'faktura_opprettet', 'fakturert', 'utløpt'));

-- Create index for inspection_type for better filtering
CREATE INDEX IF NOT EXISTS idx_ks_inspections_type ON public.ks_project_inspections(inspection_type);

-- Add template_id to link to safety round templates (for vernerunde type)
ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.ks_vernerunde_templates(id) ON DELETE SET NULL;

-- Add results field to store checklist results
ALTER TABLE public.ks_project_inspections
ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]'::jsonb;