
-- Remove old broken policies (they use profiles.id instead of profiles.user_id)
DROP POLICY IF EXISTS "Users can view risk controls from their company" ON ik_alkohol_risk_controls;
DROP POLICY IF EXISTS "Users can insert risk controls for their company" ON ik_alkohol_risk_controls;
DROP POLICY IF EXISTS "Users can update risk controls from their company" ON ik_alkohol_risk_controls;
DROP POLICY IF EXISTS "Users can delete risk controls from their company" ON ik_alkohol_risk_controls;

DROP POLICY IF EXISTS "Users can view training from their company" ON ik_alkohol_training;
DROP POLICY IF EXISTS "Users can insert training for their company" ON ik_alkohol_training;
DROP POLICY IF EXISTS "Users can update training from their company" ON ik_alkohol_training;
DROP POLICY IF EXISTS "Users can delete training from their company" ON ik_alkohol_training;
