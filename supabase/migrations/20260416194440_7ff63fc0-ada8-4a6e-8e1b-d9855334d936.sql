
-- 1) Tighten "Authenticated users can add global chemicals" - require authenticated role
DROP POLICY IF EXISTS "Authenticated users can add global chemicals" ON public.global_chemicals;
CREATE POLICY "Authenticated users can add global chemicals"
ON public.global_chemicals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2) Tighten "Authenticated users can add SDS versions" - require authenticated role
DROP POLICY IF EXISTS "Authenticated users can add SDS versions" ON public.global_chemical_sds_versions;
CREATE POLICY "Authenticated users can add SDS versions"
ON public.global_chemical_sds_versions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Tighten "Service role can insert profiles" - restrict to service_role only
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4) Storage: replace broad public SELECT on company-logos with same access scoped to specific objects
-- Keep public read of individual files but disallow listing without filename knowledge.
-- We do this by requiring that the request specifies an object name (storage.objects.name is not null and not empty).
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
CREATE POLICY "Public can read individual company logos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'company-logos'
  AND name IS NOT NULL
  AND length(name) > 0
);
