
-- Sequence for vernerunde numbers
CREATE SEQUENCE IF NOT EXISTS public.ks_module2_vernerunde_number_seq START 1;

-- Set the sequence to the current max so we don't collide with existing numbers
DO $$
DECLARE
  v_max INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(vernerunde_number, '[^0-9]', '', 'g'), '')::int), 0)
  INTO v_max
  FROM public.ks_module2_vernerunder;
  
  IF v_max > 0 THEN
    PERFORM setval('public.ks_module2_vernerunde_number_seq', v_max);
  END IF;
END $$;

-- Generator function
CREATE OR REPLACE FUNCTION public.generate_ks_module2_vernerunde_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('ks_module2_vernerunde_number_seq');
  RETURN 'VR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION public.set_ks_module2_vernerunde_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.vernerunde_number IS NULL OR NEW.vernerunde_number = '' THEN
    NEW.vernerunde_number := generate_ks_module2_vernerunde_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger on the table
DROP TRIGGER IF EXISTS set_vernerunde_number_trigger ON public.ks_module2_vernerunder;
CREATE TRIGGER set_vernerunde_number_trigger
BEFORE INSERT ON public.ks_module2_vernerunder
FOR EACH ROW
EXECUTE FUNCTION public.set_ks_module2_vernerunde_number();
