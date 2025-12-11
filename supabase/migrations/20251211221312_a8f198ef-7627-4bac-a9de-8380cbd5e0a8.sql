-- Fix search_path for generate_inspection_number function
CREATE OR REPLACE FUNCTION generate_inspection_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(inspection_number FROM 'BEF-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.simple_project_inspections
  WHERE company_id = p_company_id;
  
  RETURN 'BEF-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;