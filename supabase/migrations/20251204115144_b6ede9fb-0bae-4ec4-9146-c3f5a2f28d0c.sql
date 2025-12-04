-- Add approval fields to ks_module2_routines table
ALTER TABLE public.ks_module2_routines
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;