-- Drop and recreate INSERT policy for ks_safety_round_results with correct check
DROP POLICY IF EXISTS "Users can insert safety round results for their company" ON ks_safety_round_results;

CREATE POLICY "Users can insert safety round results for their company"
  ON ks_safety_round_results FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );