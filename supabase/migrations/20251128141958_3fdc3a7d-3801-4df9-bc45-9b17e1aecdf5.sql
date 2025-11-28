-- Add accent_color column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'blue';