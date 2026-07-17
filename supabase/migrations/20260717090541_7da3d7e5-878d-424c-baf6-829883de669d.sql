-- Safety net: protect overtime segments and start/end times on time_entries
CREATE OR REPLACE FUNCTION public.protect_time_entry_overtime_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Admins may correct anything (they use the edit dialog intentionally)
  v_is_admin := public.is_system_admin(auth.uid())
             OR public.is_company_admin(auth.uid());

  -- 1) Never allow overtime_segments to be cleared while hour_type still says overtime
  IF NEW.hour_type IS NOT NULL
     AND NEW.hour_type LIKE 'overtime%'
     AND OLD.overtime_segments IS NOT NULL
     AND jsonb_typeof(OLD.overtime_segments::jsonb) = 'array'
     AND jsonb_array_length(OLD.overtime_segments::jsonb) > 0
     AND (
       NEW.overtime_segments IS NULL
       OR jsonb_typeof(NEW.overtime_segments::jsonb) <> 'array'
       OR jsonb_array_length(NEW.overtime_segments::jsonb) = 0
     )
  THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Kan ikke fjerne overtidsdetaljer fra en overtidsføring (id=%). Endre hour_type til normal først, eller be admin gjøre korrigeringen.', NEW.id;
    END IF;
  END IF;

  -- 2) Never allow start_time/end_time to silently disappear on update
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS NULL AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Kan ikke fjerne fra-tidspunkt på timeføring (id=%). Endre til nytt tidspunkt eller be admin.', NEW.id;
  END IF;
  IF OLD.end_time IS NOT NULL AND NEW.end_time IS NULL AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Kan ikke fjerne til-tidspunkt på timeføring (id=%). Endre til nytt tidspunkt eller be admin.', NEW.id;
  END IF;

  -- 3) Never allow total hours to be zeroed out on an existing non-deleted entry
  IF COALESCE(OLD.hours, 0) > 0
     AND COALESCE(NEW.hours, 0) = 0
     AND COALESCE(NEW.is_deleted, false) = false
     AND NOT v_is_admin
  THEN
    RAISE EXCEPTION 'Kan ikke sette timer til 0 på en aktiv timeføring (id=%). Slett føringen i stedet.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_time_entry_overtime_data ON public.time_entries;
CREATE TRIGGER trg_protect_time_entry_overtime_data
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.protect_time_entry_overtime_data();