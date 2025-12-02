-- Add new fields to ks_projects table to support wizard data
ALTER TABLE ks_projects
ADD COLUMN IF NOT EXISTS tiltakstype TEXT,
ADD COLUMN IF NOT EXISTS hva_skal_bygges TEXT,
ADD COLUMN IF NOT EXISTS tiltaksomrade TEXT,
ADD COLUMN IF NOT EXISTS prosjekt_funksjon TEXT,
ADD COLUMN IF NOT EXISTS byggherre_org_nr TEXT,
ADD COLUMN IF NOT EXISTS byggherre_kontakt TEXT,
ADD COLUMN IF NOT EXISTS ansvarlig_soker_info TEXT,
ADD COLUMN IF NOT EXISTS kompetanse_krav TEXT[],
ADD COLUMN IF NOT EXISTS spesialkompetanse TEXT,
ADD COLUMN IF NOT EXISTS ue_kompetanse_krav TEXT,
ADD COLUMN IF NOT EXISTS aktive_rutiner TEXT[],
ADD COLUMN IF NOT EXISTS valgte_sjekklister TEXT[],
ADD COLUMN IF NOT EXISTS kontroll_for_lukking_dato DATE,
ADD COLUMN IF NOT EXISTS ferdigbefaring_dato DATE,
ADD COLUMN IF NOT EXISTS sluttbefaring_dato DATE,
ADD COLUMN IF NOT EXISTS planlagte_milepeler TEXT,
ADD COLUMN IF NOT EXISTS motefrekvens TEXT,
ADD COLUMN IF NOT EXISTS ue_oppfolging_plan TEXT;

-- Create table for project team members
CREATE TABLE IF NOT EXISTS ks_project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for project required competencies
CREATE TABLE IF NOT EXISTS ks_project_required_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ks_project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_project_required_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ks_project_team_members
CREATE POLICY "Users can view team members in their company projects"
  ON ks_project_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_team_members.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team members in their company projects"
  ON ks_project_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_team_members.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team members in their company projects"
  ON ks_project_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_team_members.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete team members in their company projects"
  ON ks_project_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_team_members.project_id
        AND pr.user_id = auth.uid()
    )
  );

-- RLS Policies for ks_project_required_competencies
CREATE POLICY "Users can view competencies in their company projects"
  ON ks_project_required_competencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_required_competencies.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert competencies in their company projects"
  ON ks_project_required_competencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_required_competencies.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competencies in their company projects"
  ON ks_project_required_competencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_required_competencies.project_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competencies in their company projects"
  ON ks_project_required_competencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ks_projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE p.id = ks_project_required_competencies.project_id
        AND pr.user_id = auth.uid()
    )
  );