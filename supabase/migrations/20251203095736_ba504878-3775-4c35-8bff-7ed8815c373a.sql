-- Remove the default value from filled_at column in ks_checklists
-- This column should only be set when user explicitly completes a checklist
ALTER TABLE public.ks_checklists ALTER COLUMN filled_at DROP DEFAULT;