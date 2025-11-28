-- Add additional function fields for SØK, PRO, and KTR
ALTER TABLE public.ks_projects
ADD COLUMN IF NOT EXISTS ansvarlig_soker_funksjon text,
ADD COLUMN IF NOT EXISTS ansvarlig_prosjekterende_funksjon text,
ADD COLUMN IF NOT EXISTS ansvarlig_kontrollerende_funksjon text;