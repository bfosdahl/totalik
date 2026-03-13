
-- Create a function that syncs employee_count based on active profiles
CREATE OR REPLACE FUNCTION public.sync_company_employee_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_count integer;
BEGIN
  -- Determine the company_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
  ELSE
    v_company_id := NEW.company_id;
  END IF;

  -- Also handle old company_id on UPDATE if it changed
  IF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id AND OLD.company_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE company_id = OLD.company_id AND is_active = true;
    
    UPDATE public.companies SET employee_count = v_count WHERE id = OLD.company_id;
  END IF;

  IF v_company_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE company_id = v_company_id AND is_active = true;
    
    UPDATE public.companies SET employee_count = v_count WHERE id = v_company_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trg_sync_employee_count ON public.profiles;
CREATE TRIGGER trg_sync_employee_count
AFTER INSERT OR UPDATE OF company_id, is_active OR DELETE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_company_employee_count();

-- Backfill: update all companies with correct counts now
UPDATE public.companies c
SET employee_count = (
  SELECT COUNT(*) FROM public.profiles p 
  WHERE p.company_id = c.id AND p.is_active = true
);
