-- Create safety rounds table (vernerunder)
CREATE TABLE IF NOT EXISTS ks_safety_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  round_date DATE NOT NULL,
  participants TEXT,
  findings TEXT,
  actions_required TEXT,
  responsible TEXT,
  deadline DATE,
  status TEXT DEFAULT 'open',
  photo_paths TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project activity log table (tiltakslogg)
CREATE TABLE IF NOT EXISTS ks_project_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  performed_by_user_id UUID REFERENCES auth.users(id),
  performed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create hazardous conditions table (farlige forhold)
CREATE TABLE IF NOT EXISTS ks_hazardous_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ks_projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  condition_number TEXT NOT NULL,
  discovered_date DATE NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  measures_taken TEXT,
  responsible TEXT,
  deadline DATE,
  status TEXT DEFAULT 'open',
  closed_date DATE,
  photo_paths TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ks_safety_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ks_hazardous_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safety rounds
CREATE POLICY "Users can view safety rounds for their company projects"
  ON ks_safety_rounds FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage safety rounds for their company projects"
  ON ks_safety_rounds FOR ALL
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for activity log
CREATE POLICY "Users can view activity log for their company projects"
  ON ks_project_activity_log FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create activity log for their company projects"
  ON ks_project_activity_log FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for hazardous conditions
CREATE POLICY "Users can view hazardous conditions for their company"
  ON ks_hazardous_conditions FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage hazardous conditions for their company"
  ON ks_hazardous_conditions FOR ALL
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Indexes
CREATE INDEX idx_safety_rounds_project ON ks_safety_rounds(project_id);
CREATE INDEX idx_activity_log_project ON ks_project_activity_log(project_id);
CREATE INDEX idx_activity_log_created ON ks_project_activity_log(created_at DESC);
CREATE INDEX idx_hazardous_conditions_project ON ks_hazardous_conditions(project_id);
CREATE INDEX idx_hazardous_conditions_status ON ks_hazardous_conditions(status);

-- Triggers
CREATE TRIGGER update_ks_safety_rounds_updated_at
  BEFORE UPDATE ON ks_safety_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ks_hazardous_conditions_updated_at
  BEFORE UPDATE ON ks_hazardous_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();