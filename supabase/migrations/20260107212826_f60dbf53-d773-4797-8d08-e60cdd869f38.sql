-- Fix PUBLIC_DATA_EXPOSURE: Restrict admin_byggesak_templates to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active templates" ON admin_byggesak_templates;

CREATE POLICY "Authenticated users can view active templates"
ON admin_byggesak_templates
FOR SELECT
TO authenticated
USING (is_active = true);