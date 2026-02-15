-- Fix RLS policies for ks_calculations (profiles.id should be profiles.user_id)
DROP POLICY IF EXISTS "Users can create calculations in their company" ON ks_calculations;
DROP POLICY IF EXISTS "Users can view calculations in their company" ON ks_calculations;
DROP POLICY IF EXISTS "Users can update calculations in their company" ON ks_calculations;
DROP POLICY IF EXISTS "Users can delete calculations in their company" ON ks_calculations;

CREATE POLICY "Users can view calculations in their company" ON ks_calculations
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create calculations in their company" ON ks_calculations
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update calculations in their company" ON ks_calculations
  FOR UPDATE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete calculations in their company" ON ks_calculations
  FOR DELETE USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix RLS policies for ks_calculation_items
DROP POLICY IF EXISTS "Users can manage items in their calculations" ON ks_calculation_items;
DROP POLICY IF EXISTS "Users can view items in their calculations" ON ks_calculation_items;

CREATE POLICY "Users can view items in their calculations" ON ks_calculation_items
  FOR SELECT USING (calculation_id IN (
    SELECT id FROM ks_calculations WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert items in their calculations" ON ks_calculation_items
  FOR INSERT WITH CHECK (calculation_id IN (
    SELECT id FROM ks_calculations WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can update items in their calculations" ON ks_calculation_items
  FOR UPDATE USING (calculation_id IN (
    SELECT id FROM ks_calculations WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can delete items in their calculations" ON ks_calculation_items
  FOR DELETE USING (calculation_id IN (
    SELECT id FROM ks_calculations WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  ));