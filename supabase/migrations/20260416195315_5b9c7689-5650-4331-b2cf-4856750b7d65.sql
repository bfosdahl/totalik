
-- ===== KS Module2 SJA =====
CREATE SEQUENCE IF NOT EXISTS public.ks_module2_sja_number_seq START 1;

DO $$
DECLARE v_max INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(sja_number, '[^0-9]', '', 'g'), '')::int), 0)
  INTO v_max FROM public.ks_module2_sja;
  IF v_max > 0 THEN PERFORM setval('public.ks_module2_sja_number_seq', v_max); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_sja_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE next_num INTEGER;
BEGIN
  next_num := nextval('ks_module2_sja_number_seq');
  RETURN 'SJA-' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ks_module2_sja_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.sja_number IS NULL OR NEW.sja_number = '' THEN
    NEW.sja_number := generate_ks_module2_sja_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ks_module2_sja_number_trigger ON public.ks_module2_sja;
CREATE TRIGGER set_ks_module2_sja_number_trigger
BEFORE INSERT ON public.ks_module2_sja
FOR EACH ROW EXECUTE FUNCTION public.set_ks_module2_sja_number();

-- ===== Audits (revisjoner) =====
CREATE SEQUENCE IF NOT EXISTS public.audits_number_seq START 1;

DO $$
DECLARE v_max INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(audit_number, '[^0-9]', '', 'g'), '')::int), 0)
  INTO v_max FROM public.audits WHERE audit_number LIKE 'REV-%';
  IF v_max > 0 THEN PERFORM setval('public.audits_number_seq', v_max); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_audit_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE next_num INTEGER;
BEGIN
  next_num := nextval('audits_number_seq');
  RETURN 'REV-' || LPAD(next_num::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_audit_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.audit_number IS NULL OR NEW.audit_number = '' THEN
    NEW.audit_number := generate_audit_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_audit_number_trigger ON public.audits;
CREATE TRIGGER set_audit_number_trigger
BEFORE INSERT ON public.audits
FOR EACH ROW EXECUTE FUNCTION public.set_audit_number();
