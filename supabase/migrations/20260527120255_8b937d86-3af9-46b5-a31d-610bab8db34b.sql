
ALTER TABLE public.ik_mat_traceability_records
  ADD COLUMN IF NOT EXISTS allergens text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expiry_type text NOT NULL DEFAULT 'best_before',
  ADD COLUMN IF NOT EXISTS is_internal_production boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_shelf_life_days integer,
  ADD COLUMN IF NOT EXISTS produced_by text;

ALTER TABLE public.ik_mat_traceability_records
  DROP CONSTRAINT IF EXISTS ik_mat_traceability_expiry_type_check;
ALTER TABLE public.ik_mat_traceability_records
  ADD CONSTRAINT ik_mat_traceability_expiry_type_check
  CHECK (expiry_type IN ('best_before','use_by'));
