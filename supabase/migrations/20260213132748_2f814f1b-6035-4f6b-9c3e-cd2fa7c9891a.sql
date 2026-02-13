-- Add routine_number column to company_ks_routines
ALTER TABLE public.company_ks_routines
ADD COLUMN routine_number text;

-- Auto-generate routine numbers for existing rows
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM public.company_ks_routines ORDER BY created_at ASC LOOP
    UPDATE public.company_ks_routines 
    SET routine_number = 'KS-Rut_' || LPAD(counter::TEXT, 4, '0')
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;