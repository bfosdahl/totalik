
CREATE OR REPLACE FUNCTION public.complete_fdv_control(
  p_control_id uuid,
  p_building_id uuid,
  p_company_id uuid,
  p_completed_by_id uuid,
  p_completed_by_name text,
  p_status text,
  p_findings text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_next_due_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert log entry
  INSERT INTO fdv_control_logs (
    control_id, building_id, company_id,
    completed_at, completed_by_id, completed_by_name,
    status, findings, next_due_date, notes
  ) VALUES (
    p_control_id, p_building_id, p_company_id,
    now(), p_completed_by_id, p_completed_by_name,
    p_status, p_findings, p_next_due_date, p_notes
  );

  -- Update control
  UPDATE fdv_controls SET
    status = CASE WHEN p_status = 'avvik' THEN 'avvik' ELSE 'utfort' END,
    last_completed_date = CURRENT_DATE::text,
    last_completed_by_id = p_completed_by_id,
    last_completed_by_name = p_completed_by_name,
    next_due_date = p_next_due_date::text
  WHERE id = p_control_id;
END;
$$;
