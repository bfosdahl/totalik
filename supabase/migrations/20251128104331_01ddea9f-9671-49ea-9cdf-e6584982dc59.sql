-- Update ks_sja table structure for standalone SJA templates
-- Remove HMS plan wizard fields and add proper SJA form fields

-- Add new columns for SJA form
ALTER TABLE ks_sja 
  ADD COLUMN IF NOT EXISTS sja_nr TEXT,
  ADD COLUMN IF NOT EXISTS utfort_sted TEXT,
  ADD COLUMN IF NOT EXISTS utfort_dato DATE,
  ADD COLUMN IF NOT EXISTS utfort_navn TEXT,
  ADD COLUMN IF NOT EXISTS tiltak_sted TEXT,
  ADD COLUMN IF NOT EXISTS tiltak_dato DATE,
  ADD COLUMN IF NOT EXISTS tiltak_navn TEXT,
  ADD COLUMN IF NOT EXISTS aktivitet TEXT,
  ADD COLUMN IF NOT EXISTS identifisert_risiko TEXT,
  ADD COLUMN IF NOT EXISTS risikoreduserende_tiltak TEXT;

-- Update the project_id to be nullable since SJA can now be standalone templates
ALTER TABLE ks_sja ALTER COLUMN project_id DROP NOT NULL;

-- Add company_id to track which company owns the SJA
ALTER TABLE ks_sja ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Update RLS policies to work with company_id
DROP POLICY IF EXISTS "Users can manage SJAs for their company projects" ON ks_sja;
DROP POLICY IF EXISTS "Users can view SJAs for their company projects" ON ks_sja;

-- New RLS policies for company-based access
CREATE POLICY "Users can manage SJAs for their company"
  ON ks_sja
  FOR ALL
  USING (
    company_id = get_user_company_id(auth.uid())
  )
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Users can view SJAs for their company"
  ON ks_sja
  FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
  );