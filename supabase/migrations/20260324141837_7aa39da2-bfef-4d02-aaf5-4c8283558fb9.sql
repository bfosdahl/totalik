ALTER TABLE public.ks_module2_invoices ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.ks_module2_invoices ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.ks_module2_cost_entries ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.ks_module2_cost_entries ADD COLUMN IF NOT EXISTS file_name text;