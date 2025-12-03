-- Allow all authenticated users to view admin documents (templates)
DROP POLICY IF EXISTS "System admins can view admin documents" ON admin_documents;

CREATE POLICY "All authenticated users can view admin documents" 
ON admin_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep admin-only policies for insert/delete
-- (already exists: System admins can insert/delete admin documents)