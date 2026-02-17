
-- Add discount_percent column to ks_calculation_items
ALTER TABLE public.ks_calculation_items 
ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;

-- Add notes column for per-item notes
ALTER TABLE public.ks_calculation_items 
ADD COLUMN IF NOT EXISTS notes text;
