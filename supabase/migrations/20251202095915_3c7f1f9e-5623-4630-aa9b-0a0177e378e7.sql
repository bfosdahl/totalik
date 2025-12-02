-- Oppdater ks_project_subcontractors med nye felter
ALTER TABLE ks_project_subcontractors 
ADD COLUMN IF NOT EXISTS contract_value numeric,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('godkjent', 'ikke_godkjent', 'godkjent_med_forbehold', 'pending')),
ADD COLUMN IF NOT EXISTS approval_date timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approval_notes text;

-- Opprett tabell for gransking/seriøsitetskontroll av underleverandører
CREATE TABLE IF NOT EXISTS ks_subcontractor_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES ks_project_subcontractors(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Sjekkpunkter fra evalueringsskjema
  sentral_godkjenning boolean,
  sentral_godkjenning_comment text,
  lokal_godkjenning boolean,
  lokal_godkjenning_comment text,
  godkjenning_for_arbeid boolean,
  godkjenning_for_arbeid_comment text,
  andre_sertifikater boolean,
  andre_sertifikater_comment text,
  referanseprosjekter boolean,
  referanseprosjekter_comment text,
  jobbet_for_oss_for boolean,
  jobbet_for_oss_for_comment text,
  endringer_siden_sist boolean,
  endringer_siden_sist_comment text,
  arbeidskapasitet boolean,
  arbeidskapasitet_comment text,
  erfaring_kompetanse boolean,
  erfaring_kompetanse_comment text,
  forsikringer boolean,
  forsikringer_comment text,
  okonomi boolean,
  okonomi_comment text,
  garantier boolean,
  garantier_comment text,
  kontrakt boolean,
  kontrakt_comment text,
  lonnsklausuler boolean,
  lonnsklausuler_comment text,
  paseplikt boolean,
  paseplikt_comment text,
  kvalitetssystem boolean,
  kvalitetssystem_comment text,
  hms_system boolean,
  hms_system_comment text,
  
  -- Konklusjon
  kan_brukes text CHECK (kan_brukes IN ('godkjent', 'ikke_godkjent', 'godkjent_med_forbehold')),
  konklusjon_notes text,
  
  -- Metadata
  evaluated_by uuid REFERENCES profiles(id),
  evaluated_by_name text NOT NULL,
  evaluated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Aktiver RLS
ALTER TABLE ks_subcontractor_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies for evaluations
CREATE POLICY "Users can view evaluations in their company"
  ON ks_subcontractor_evaluations FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create evaluations in their company"
  ON ks_subcontractor_evaluations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update evaluations in their company"
  ON ks_subcontractor_evaluations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Company admins can delete evaluations"
  ON ks_subcontractor_evaluations FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
  );

-- System admins can manage all evaluations
CREATE POLICY "System admins can manage all evaluations"
  ON ks_subcontractor_evaluations FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ks_subcontractor_evaluations_updated_at
  BEFORE UPDATE ON ks_subcontractor_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();