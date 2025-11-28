-- Add project_number to ks_projects
ALTER TABLE ks_projects
ADD COLUMN IF NOT EXISTS project_number text;

-- Create sequence for project numbers
CREATE SEQUENCE IF NOT EXISTS ks_project_number_seq START WITH 1;

-- Create function to generate project number
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS text
LANGUAGE plpgsql
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

-- Add trigger to auto-generate project number on insert
CREATE OR REPLACE FUNCTION set_project_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_number IS NULL THEN
    NEW.project_number := generate_project_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_project_number ON ks_projects;
CREATE TRIGGER trigger_set_project_number
  BEFORE INSERT ON ks_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_number();

-- Update existing projects with project numbers if they don't have one
UPDATE ks_projects 
SET project_number = generate_project_number()
WHERE project_number IS NULL;