-- Add company_id to ks_templates to support company-specific custom templates
-- NULL company_id means system template, non-NULL means company custom template
ALTER TABLE ks_templates
ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to ks_template_items for consistency
ALTER TABLE ks_template_items
ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for faster lookup of company templates
CREATE INDEX idx_ks_templates_company_id ON ks_templates(company_id);
CREATE INDEX idx_ks_template_items_company_id ON ks_template_items(company_id);

-- Update RLS policies for ks_templates to allow companies to manage their own templates
DROP POLICY IF EXISTS "Users can view KS templates" ON ks_templates;
DROP POLICY IF EXISTS "System admins can manage all KS templates" ON ks_templates;

CREATE POLICY "Users can view system and their company templates"
ON ks_templates FOR SELECT
USING (
  company_id IS NULL OR 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can create templates for their company"
ON ks_templates FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company templates"
ON ks_templates FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company templates"
ON ks_templates FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System admins can manage all templates"
ON ks_templates FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Update RLS policies for ks_template_items
DROP POLICY IF EXISTS "Users can view KS template items" ON ks_template_items;
DROP POLICY IF EXISTS "System admins can manage all KS template items" ON ks_template_items;

CREATE POLICY "Users can view system and their company template items"
ON ks_template_items FOR SELECT
USING (
  company_id IS NULL OR 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can create template items for their company"
ON ks_template_items FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company template items"
ON ks_template_items FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company template items"
ON ks_template_items FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System admins can manage all template items"
ON ks_template_items FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));