
-- Fix RLS policies for ik_alkohol_risk_controls (profiles.id should be profiles.user_id)
CREATE POLICY "Users can view risk controls v2" ON ik_alkohol_risk_controls
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert risk controls v2" ON ik_alkohol_risk_controls
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update risk controls v2" ON ik_alkohol_risk_controls
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete risk controls v2" ON ik_alkohol_risk_controls
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix RLS policies for ik_alkohol_training
CREATE POLICY "Users can view training v2" ON ik_alkohol_training
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert training v2" ON ik_alkohol_training
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update training v2" ON ik_alkohol_training
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete training v2" ON ik_alkohol_training
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
