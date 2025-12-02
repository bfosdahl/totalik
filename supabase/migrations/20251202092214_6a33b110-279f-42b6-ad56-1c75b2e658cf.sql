-- Legg til GDPR dokumentasjonstabell
CREATE TABLE IF NOT EXISTS gdpr_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  documentation_type TEXT NOT NULL, -- 'privacy_policy', 'data_processing', 'consent_procedures', etc.
  content TEXT,
  last_reviewed DATE,
  next_review_date DATE,
  responsible_person TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for GDPR documentation
ALTER TABLE gdpr_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company GDPR documentation"
ON gdpr_documentation FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage GDPR documentation"
ON gdpr_documentation FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- GDPR sjekkliste responses
CREATE TABLE IF NOT EXISTS gdpr_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL,
  responses JSONB DEFAULT '[]'::jsonb,
  completed_by_id UUID REFERENCES profiles(id),
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for GDPR checklist responses
ALTER TABLE gdpr_checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company GDPR checklist responses"
ON gdpr_checklist_responses FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create GDPR checklist responses for their company"
ON gdpr_checklist_responses FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company GDPR checklist responses"
ON gdpr_checklist_responses FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete GDPR checklist responses"
ON gdpr_checklist_responses FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Åpenhetsloven tabell
CREATE TABLE IF NOT EXISTS transparency_act_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_year INTEGER NOT NULL,
  risk_areas JSONB DEFAULT '[]'::jsonb,
  supplier_assessments JSONB DEFAULT '[]'::jsonb,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  public_statement TEXT,
  published_date DATE,
  responsible_person TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for transparency act assessments
ALTER TABLE transparency_act_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company transparency act assessments"
ON transparency_act_assessments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage transparency act assessments"
ON transparency_act_assessments FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Åpenhetsloven innsyn requests
CREATE TABLE IF NOT EXISTS transparency_act_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  request_content TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  response_content TEXT,
  response_date DATE,
  status TEXT DEFAULT 'pending', -- pending, responded, archived
  handled_by_id UUID REFERENCES profiles(id),
  handled_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for transparency act requests
ALTER TABLE transparency_act_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company transparency act requests"
ON transparency_act_requests FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create transparency act requests for their company"
ON transparency_act_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage transparency act requests"
ON transparency_act_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND 
  (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Trigger for updated_at
CREATE TRIGGER update_gdpr_documentation_updated_at
BEFORE UPDATE ON gdpr_documentation
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_checklist_responses_updated_at
BEFORE UPDATE ON gdpr_checklist_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transparency_act_assessments_updated_at
BEFORE UPDATE ON transparency_act_assessments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transparency_act_requests_updated_at
BEFORE UPDATE ON transparency_act_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();