-- Add template_id column to ks_safety_rounds table
ALTER TABLE ks_safety_rounds 
ADD COLUMN template_id UUID REFERENCES ks_vernerunde_templates(id) ON DELETE SET NULL;

-- Create table for storing safety round checkpoint results
CREATE TABLE ks_safety_round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_round_id UUID NOT NULL REFERENCES ks_safety_rounds(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES ks_vernerunde_checkpoints(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_checked' CHECK (status IN ('ok', 'not_ok', 'not_applicable', 'not_checked')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for ks_safety_round_results
ALTER TABLE ks_safety_round_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view safety round results from their company"
  ON ks_safety_round_results FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert safety round results for their company"
  ON ks_safety_round_results FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update safety round results from their company"
  ON ks_safety_round_results FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete safety round results from their company"
  ON ks_safety_round_results FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_safety_round_results_round_id ON ks_safety_round_results(safety_round_id);
CREATE INDEX idx_safety_round_results_checkpoint_id ON ks_safety_round_results(checkpoint_id);
CREATE INDEX idx_safety_round_results_company_id ON ks_safety_round_results(company_id);