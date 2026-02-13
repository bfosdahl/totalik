
-- Add template_number columns
ALTER TABLE public.admin_routine_templates_v2 ADD COLUMN IF NOT EXISTS template_number text UNIQUE;
ALTER TABLE public.admin_checklist_templates ADD COLUMN IF NOT EXISTS template_number text UNIQUE;
ALTER TABLE public.admin_documents ADD COLUMN IF NOT EXISTS template_number text UNIQUE;

-- Sequences for each
CREATE SEQUENCE IF NOT EXISTS admin_routine_template_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS admin_checklist_template_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS admin_document_template_number_seq START 1;

-- Function to map module to prefix for routines
CREATE OR REPLACE FUNCTION public.generate_routine_template_number(p_module text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  next_num := nextval('admin_routine_template_number_seq');
  CASE p_module
    WHEN 'ks_ik_bygg' THEN prefix := 'KS-Rut';
    WHEN 'ik_hms' THEN prefix := 'HMS-Rut';
    WHEN 'ik_mat' THEN prefix := 'MAT-Rut';
    WHEN 'ik_alkohol' THEN prefix := 'ALK-Rut';
    WHEN 'felles' THEN prefix := 'FEL-Rut';
    ELSE prefix := UPPER(LEFT(p_module, 3)) || '-Rut';
  END CASE;
  RETURN prefix || '_' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Function for checklist numbers
CREATE OR REPLACE FUNCTION public.generate_checklist_template_number(p_category text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  next_num := nextval('admin_checklist_template_number_seq');
  CASE p_category
    WHEN 'ks_bygg' THEN prefix := 'KS-Sjk';
    WHEN 'hms' THEN prefix := 'HMS-Sjk';
    WHEN 'ik_mat' THEN prefix := 'MAT-Sjk';
    ELSE prefix := UPPER(LEFT(COALESCE(p_category, 'GEN'), 3)) || '-Sjk';
  END CASE;
  RETURN prefix || '_' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Function for document numbers  
CREATE OR REPLACE FUNCTION public.generate_document_template_number(p_category text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  next_num := nextval('admin_document_template_number_seq');
  CASE p_category
    WHEN 'ks_bygg' THEN prefix := 'KS-Dok';
    WHEN 'hms' THEN prefix := 'HMS-Dok';
    WHEN 'ik_mat' THEN prefix := 'MAT-Dok';
    WHEN 'ik_alkohol' THEN prefix := 'ALK-Dok';
    ELSE prefix := UPPER(LEFT(COALESCE(p_category, 'GEN'), 3)) || '-Dok';
  END CASE;
  RETURN prefix || '_' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.set_routine_template_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.template_number IS NULL OR NEW.template_number = '' THEN
    NEW.template_number := generate_routine_template_number(NEW.module);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_routine_template_number_trigger
BEFORE INSERT ON public.admin_routine_templates_v2
FOR EACH ROW
EXECUTE FUNCTION public.set_routine_template_number();

CREATE OR REPLACE FUNCTION public.set_checklist_template_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.template_number IS NULL OR NEW.template_number = '' THEN
    NEW.template_number := generate_checklist_template_number(NEW.category);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_checklist_template_number_trigger
BEFORE INSERT ON public.admin_checklist_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_checklist_template_number();

CREATE OR REPLACE FUNCTION public.set_document_template_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.template_number IS NULL OR NEW.template_number = '' THEN
    NEW.template_number := generate_document_template_number(NEW.category);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_document_template_number_trigger
BEFORE INSERT ON public.admin_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_document_template_number();

-- Backfill existing rows with numbers
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, module FROM admin_routine_templates_v2 WHERE template_number IS NULL ORDER BY created_at LOOP
    UPDATE admin_routine_templates_v2 SET template_number = generate_routine_template_number(rec.module) WHERE id = rec.id;
  END LOOP;
  
  FOR rec IN SELECT id, category FROM admin_checklist_templates WHERE template_number IS NULL ORDER BY created_at LOOP
    UPDATE admin_checklist_templates SET template_number = generate_checklist_template_number(rec.category) WHERE id = rec.id;
  END LOOP;
  
  FOR rec IN SELECT id, category FROM admin_documents WHERE template_number IS NULL ORDER BY created_at LOOP
    UPDATE admin_documents SET template_number = generate_document_template_number(rec.category) WHERE id = rec.id;
  END LOOP;
END;
$$;
