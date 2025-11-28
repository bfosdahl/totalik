-- Add building case role fields to ks_projects table
ALTER TABLE public.ks_projects 
  ADD COLUMN ansvarlig_soker TEXT,
  ADD COLUMN ansvarlig_prosjekterende TEXT,
  ADD COLUMN ansvarlig_utforende TEXT,
  ADD COLUMN ansvarlig_utforende_funksjon TEXT,
  ADD COLUMN ansvarlig_kontrollerende TEXT;