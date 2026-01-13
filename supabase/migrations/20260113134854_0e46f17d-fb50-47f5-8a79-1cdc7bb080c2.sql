-- Fix RLS policies for ik_alkohol tables that use wrong column
-- The issue is profiles.id = auth.uid() should be profiles.user_id = auth.uid()

-- Drop and recreate policies for ik_alkohol_organization
DROP POLICY IF EXISTS "Company admins can manage organization" ON public.ik_alkohol_organization;
DROP POLICY IF EXISTS "Users can view their company organization" ON public.ik_alkohol_organization;

CREATE POLICY "Users can view their company organization"
ON public.ik_alkohol_organization
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert organization for their company"
ON public.ik_alkohol_organization
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update organization in their company"
ON public.ik_alkohol_organization
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete organization from their company"
ON public.ik_alkohol_organization
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_shift_responsibilities
DROP POLICY IF EXISTS "Users can view shifts from their company" ON public.ik_alkohol_shift_responsibilities;
DROP POLICY IF EXISTS "Users can insert shifts for their company" ON public.ik_alkohol_shift_responsibilities;
DROP POLICY IF EXISTS "Users can update shifts from their company" ON public.ik_alkohol_shift_responsibilities;
DROP POLICY IF EXISTS "Users can delete shifts from their company" ON public.ik_alkohol_shift_responsibilities;

CREATE POLICY "Users can view shifts from their company"
ON public.ik_alkohol_shift_responsibilities
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert shifts for their company"
ON public.ik_alkohol_shift_responsibilities
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update shifts from their company"
ON public.ik_alkohol_shift_responsibilities
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete shifts from their company"
ON public.ik_alkohol_shift_responsibilities
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_compliance_items
DROP POLICY IF EXISTS "Users can view compliance items from their company" ON public.ik_alkohol_compliance_items;
DROP POLICY IF EXISTS "Users can insert compliance items for their company" ON public.ik_alkohol_compliance_items;
DROP POLICY IF EXISTS "Users can update compliance items from their company" ON public.ik_alkohol_compliance_items;
DROP POLICY IF EXISTS "Users can delete compliance items from their company" ON public.ik_alkohol_compliance_items;

CREATE POLICY "Users can view compliance items from their company"
ON public.ik_alkohol_compliance_items
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert compliance items for their company"
ON public.ik_alkohol_compliance_items
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update compliance items from their company"
ON public.ik_alkohol_compliance_items
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete compliance items from their company"
ON public.ik_alkohol_compliance_items
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_licenses
DROP POLICY IF EXISTS "Users can view licenses from their company" ON public.ik_alkohol_licenses;
DROP POLICY IF EXISTS "Users can insert licenses for their company" ON public.ik_alkohol_licenses;
DROP POLICY IF EXISTS "Users can update licenses from their company" ON public.ik_alkohol_licenses;
DROP POLICY IF EXISTS "Users can delete licenses from their company" ON public.ik_alkohol_licenses;

CREATE POLICY "Users can view licenses from their company"
ON public.ik_alkohol_licenses
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert licenses for their company"
ON public.ik_alkohol_licenses
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update licenses from their company"
ON public.ik_alkohol_licenses
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete licenses from their company"
ON public.ik_alkohol_licenses
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_incidents
DROP POLICY IF EXISTS "Users can view incidents from their company" ON public.ik_alkohol_incidents;
DROP POLICY IF EXISTS "Users can insert incidents for their company" ON public.ik_alkohol_incidents;
DROP POLICY IF EXISTS "Users can update incidents from their company" ON public.ik_alkohol_incidents;
DROP POLICY IF EXISTS "Users can delete incidents from their company" ON public.ik_alkohol_incidents;

CREATE POLICY "Users can view incidents from their company"
ON public.ik_alkohol_incidents
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert incidents for their company"
ON public.ik_alkohol_incidents
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update incidents from their company"
ON public.ik_alkohol_incidents
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete incidents from their company"
ON public.ik_alkohol_incidents
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_attachments
DROP POLICY IF EXISTS "Users can view attachments from their company" ON public.ik_alkohol_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their company" ON public.ik_alkohol_attachments;
DROP POLICY IF EXISTS "Users can delete attachments from their company" ON public.ik_alkohol_attachments;

CREATE POLICY "Users can view attachments from their company"
ON public.ik_alkohol_attachments
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert attachments for their company"
ON public.ik_alkohol_attachments
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete attachments from their company"
ON public.ik_alkohol_attachments
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Fix ik_alkohol_reviews
DROP POLICY IF EXISTS "Users can view reviews from their company" ON public.ik_alkohol_reviews;
DROP POLICY IF EXISTS "Users can insert reviews for their company" ON public.ik_alkohol_reviews;
DROP POLICY IF EXISTS "Users can update reviews from their company" ON public.ik_alkohol_reviews;
DROP POLICY IF EXISTS "Users can delete reviews from their company" ON public.ik_alkohol_reviews;

CREATE POLICY "Users can view reviews from their company"
ON public.ik_alkohol_reviews
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert reviews for their company"
ON public.ik_alkohol_reviews
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update reviews from their company"
ON public.ik_alkohol_reviews
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete reviews from their company"
ON public.ik_alkohol_reviews
FOR DELETE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));