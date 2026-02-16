
-- Fix 1: Restrict module_pricing to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active pricing" ON public.module_pricing;
CREATE POLICY "Authenticated users can view active pricing"
ON public.module_pricing FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix 2: Make public storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN (
  'deviation-attachments',
  'inspection-photos',
  'ks-module2-avvik-photos',
  'ks-module2-checklist-photos'
);
-- Note: company-logos stays public as logos are typically meant to be publicly visible
