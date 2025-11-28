-- Fix search_path for generate_project_number function
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
  project_num text;
BEGIN
  next_num := nextval('ks_project_number_seq');
  project_num := 'PRJ-' || LPAD(next_num::text, 5, '0');
  RETURN project_num;
END;
$$;

-- Fix search_path for set_project_number function
CREATE OR REPLACE FUNCTION set_project_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.project_number IS NULL THEN
    NEW.project_number := generate_project_number();
  END IF;
  RETURN NEW;
END;
$$;