
-- Sekvens for avviksnummer (global, atomisk)
CREATE SEQUENCE IF NOT EXISTS deviation_number_seq START 1;

-- Sett sekvensen til nåværende globale maks for å unngå kollisjon
SELECT setval('deviation_number_seq',
  COALESCE(
    (SELECT MAX(num) FROM (
      SELECT CAST(SUBSTRING(deviation_number FROM 'DEV-(\d+)') AS INTEGER) as num
      FROM deviations WHERE deviation_number ~ '^DEV-\d+$'
      UNION ALL
      SELECT CAST(SUBSTRING(deviation_number FROM 'IKM-(\d+)') AS INTEGER) as num
      FROM deviations WHERE deviation_number ~ '^IKM-\d+$'
      UNION ALL
      SELECT CAST(SUBSTRING(deviation_number FROM 'AVV-(\d+)') AS INTEGER) as num
      FROM deviations WHERE deviation_number ~ '^AVV-\d+$'
    ) sub),
    0
  )
);

-- Funksjon: genererer neste nummer basert på prefiks
CREATE OR REPLACE FUNCTION public.generate_deviation_number(p_prefix text DEFAULT 'DEV')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('deviation_number_seq');
  RETURN p_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

-- Trigger-funksjon: setter deviation_number automatisk ved INSERT
CREATE OR REPLACE FUNCTION public.set_deviation_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prefix TEXT;
BEGIN
  IF NEW.deviation_number IS NULL OR NEW.deviation_number = '' THEN
    -- Velg prefiks basert på type
    IF NEW.type = 'ik_mat' THEN
      prefix := 'IKM';
    ELSE
      prefix := 'DEV';
    END IF;
    NEW.deviation_number := generate_deviation_number(prefix);
  END IF;
  RETURN NEW;
END;
$$;

-- Opprett trigger
CREATE TRIGGER trg_set_deviation_number
  BEFORE INSERT ON public.deviations
  FOR EACH ROW
  EXECUTE FUNCTION set_deviation_number();
