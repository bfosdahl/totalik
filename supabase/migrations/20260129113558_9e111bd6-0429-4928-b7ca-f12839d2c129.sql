-- ==============================================
-- GLOBAL CHEMICAL REGISTRY (STOFFKARTOTEK)
-- Multi-tenant shared chemical database
-- ==============================================

-- 1. Global chemicals master table (shared library)
CREATE TABLE public.global_chemicals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  cas_number TEXT, -- Chemical Abstracts Service number (unique identifier)
  manufacturer TEXT,
  danger_classes TEXT[] DEFAULT '{}',
  notes TEXT,
  search_vector TSVECTOR, -- For full-text search
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for searching
CREATE INDEX idx_global_chemicals_product_name ON public.global_chemicals USING gin(to_tsvector('norwegian', product_name));
CREATE INDEX idx_global_chemicals_cas_number ON public.global_chemicals(cas_number);
CREATE INDEX idx_global_chemicals_manufacturer ON public.global_chemicals(manufacturer);
CREATE INDEX idx_global_chemicals_search ON public.global_chemicals USING gin(search_vector);

-- Update search vector trigger
CREATE OR REPLACE FUNCTION update_global_chemical_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('norwegian', COALESCE(NEW.product_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.cas_number, '')), 'A') ||
    setweight(to_tsvector('norwegian', COALESCE(NEW.manufacturer, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_global_chemical_search
BEFORE INSERT OR UPDATE ON public.global_chemicals
FOR EACH ROW EXECUTE FUNCTION update_global_chemical_search_vector();

-- 2. SDS versions table (versioned safety data sheets)
CREATE TABLE public.global_chemical_sds_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_chemical_id UUID NOT NULL REFERENCES public.global_chemicals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  sds_file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE INDEX idx_sds_versions_chemical ON public.global_chemical_sds_versions(global_chemical_id);
CREATE INDEX idx_sds_versions_current ON public.global_chemical_sds_versions(global_chemical_id, is_current) WHERE is_current = true;

-- Ensure only one current version per chemical
CREATE UNIQUE INDEX idx_sds_versions_unique_current 
ON public.global_chemical_sds_versions(global_chemical_id) 
WHERE is_current = true;

-- 3. Company chemical entries (many-to-many linking)
CREATE TABLE public.company_chemical_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.ks_module2_projects(id) ON DELETE SET NULL,
  global_chemical_id UUID NOT NULL REFERENCES public.global_chemicals(id) ON DELETE CASCADE,
  location TEXT, -- Company-specific storage location
  custom_notes TEXT, -- Company-specific notes, risk assessments
  quantity TEXT, -- Amount stored
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate entries per company/project
  CONSTRAINT unique_company_chemical_project UNIQUE(company_id, project_id, global_chemical_id)
);

CREATE INDEX idx_company_chemicals_company ON public.company_chemical_entries(company_id);
CREATE INDEX idx_company_chemicals_project ON public.company_chemical_entries(project_id);
CREATE INDEX idx_company_chemicals_global ON public.company_chemical_entries(global_chemical_id);

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Global chemicals: Anyone can read, authenticated can insert
ALTER TABLE public.global_chemicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view global chemicals"
ON public.global_chemicals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can add global chemicals"
ON public.global_chemicals FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "No direct updates to global chemicals"
ON public.global_chemicals FOR UPDATE
TO authenticated
USING (false);

-- SDS versions: Anyone can read, authenticated can insert
ALTER TABLE public.global_chemical_sds_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view SDS versions"
ON public.global_chemical_sds_versions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can add SDS versions"
ON public.global_chemical_sds_versions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Company chemical entries: Only own company
ALTER TABLE public.company_chemical_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company chemical entries"
ON public.company_chemical_entries FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add chemical entries to own company"
ON public.company_chemical_entries FOR INSERT
TO authenticated
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own company chemical entries"
ON public.company_chemical_entries FOR UPDATE
TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own company chemical entries"
ON public.company_chemical_entries FOR DELETE
TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- ==============================================
-- UPDATED_AT TRIGGERS
-- ==============================================

CREATE TRIGGER update_global_chemicals_updated_at
BEFORE UPDATE ON public.global_chemicals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_chemical_entries_updated_at
BEFORE UPDATE ON public.company_chemical_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STORAGE BUCKET FOR GLOBAL SDS FILES
-- ==============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('global-sds-files', 'global-sds-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for global SDS files
CREATE POLICY "Authenticated users can view global SDS files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'global-sds-files');

CREATE POLICY "Authenticated users can upload global SDS files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'global-sds-files');

-- ==============================================
-- MIGRATE EXISTING DATA
-- ==============================================

-- Migrate existing chemicals to global registry
INSERT INTO public.global_chemicals (product_name, manufacturer, danger_classes, notes, created_at, updated_at)
SELECT DISTINCT ON (LOWER(product_name), LOWER(COALESCE(manufacturer, '')))
  product_name,
  manufacturer,
  danger_classes,
  notes,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM public.ks_module2_stoffkartotek
GROUP BY LOWER(product_name), LOWER(COALESCE(manufacturer, '')), product_name, manufacturer, danger_classes, notes;

-- Migrate SDS files to versions table
INSERT INTO public.global_chemical_sds_versions (global_chemical_id, sds_file_path, is_current)
SELECT 
  gc.id,
  sk.sds_file_path,
  true
FROM public.ks_module2_stoffkartotek sk
JOIN public.global_chemicals gc ON 
  LOWER(gc.product_name) = LOWER(sk.product_name) AND
  LOWER(COALESCE(gc.manufacturer, '')) = LOWER(COALESCE(sk.manufacturer, ''))
WHERE sk.sds_file_path IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create company entries for existing data
INSERT INTO public.company_chemical_entries (company_id, project_id, global_chemical_id, location, custom_notes, last_updated, created_at)
SELECT 
  sk.company_id,
  sk.project_id,
  gc.id,
  sk.location,
  sk.notes,
  sk.last_updated,
  sk.created_at
FROM public.ks_module2_stoffkartotek sk
JOIN public.global_chemicals gc ON 
  LOWER(gc.product_name) = LOWER(sk.product_name) AND
  LOWER(COALESCE(gc.manufacturer, '')) = LOWER(COALESCE(sk.manufacturer, ''))
ON CONFLICT (company_id, project_id, global_chemical_id) DO NOTHING;