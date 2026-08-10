CREATE INDEX IF NOT EXISTS idx_simple_project_inspections_company_id
  ON public.simple_project_inspections(company_id);

CREATE OR REPLACE FUNCTION public.pad_number(p_num BIGINT, p_len INT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE WHEN length(p_num::text) >= p_len THEN p_num::text
              ELSE lpad(p_num::text, p_len, '0') END;
$$;

CREATE OR REPLACE FUNCTION public.generate_deviation_number(p_prefix text DEFAULT 'DEV')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN p_prefix || '-' || public.pad_number(nextval('deviation_number_seq'), 3);
END; $function$;

CREATE OR REPLACE FUNCTION public.set_deviation_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE prefix TEXT; candidate TEXT; attempts INT := 0;
BEGIN
  IF NEW.deviation_number IS NULL OR NEW.deviation_number = '' THEN
    prefix := CASE WHEN NEW.type = 'ik_mat' THEN 'IKM' ELSE 'DEV' END;
    LOOP
      candidate := generate_deviation_number(prefix);
      attempts := attempts + 1;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.deviations d
        WHERE d.company_id = NEW.company_id AND d.deviation_number = candidate
      );
      IF attempts >= 10000 THEN
        RAISE EXCEPTION 'Kunne ikke generere unikt avviksnummer for prefiks %', prefix;
      END IF;
    END LOOP;
    NEW.deviation_number := candidate;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.generate_audit_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'REV-' || public.pad_number(nextval('audits_number_seq'), 3); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_checklist_template_number(p_category text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE prefix TEXT;
BEGIN
  CASE p_category
    WHEN 'ks_bygg' THEN prefix := 'KS-Sjk';
    WHEN 'hms' THEN prefix := 'HMS-Sjk';
    WHEN 'ik_mat' THEN prefix := 'MAT-Sjk';
    ELSE prefix := UPPER(LEFT(COALESCE(p_category, 'GEN'), 3)) || '-Sjk';
  END CASE;
  RETURN prefix || '_' || public.pad_number(nextval('admin_checklist_template_number_seq'), 4);
END; $function$;

CREATE OR REPLACE FUNCTION public.generate_document_template_number(p_category text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE prefix TEXT;
BEGIN
  CASE p_category
    WHEN 'ks_bygg' THEN prefix := 'KS-Dok';
    WHEN 'hms' THEN prefix := 'HMS-Dok';
    WHEN 'ik_mat' THEN prefix := 'MAT-Dok';
    WHEN 'ik_alkohol' THEN prefix := 'ALK-Dok';
    ELSE prefix := UPPER(LEFT(COALESCE(p_category, 'GEN'), 3)) || '-Dok';
  END CASE;
  RETURN prefix || '_' || public.pad_number(nextval('admin_document_template_number_seq'), 4);
END; $function$;

CREATE OR REPLACE FUNCTION public.generate_routine_template_number(p_module text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE prefix TEXT;
BEGIN
  CASE p_module
    WHEN 'ks_ik_bygg' THEN prefix := 'KS-Rut';
    WHEN 'ik_hms' THEN prefix := 'HMS-Rut';
    WHEN 'ik_mat' THEN prefix := 'MAT-Rut';
    WHEN 'ik_alkohol' THEN prefix := 'ALK-Rut';
    WHEN 'felles' THEN prefix := 'FEL-Rut';
    ELSE prefix := UPPER(LEFT(COALESCE(p_module, 'GEN'), 3)) || '-Rut';
  END CASE;
  RETURN prefix || '_' || public.pad_number(nextval('admin_routine_template_number_seq'), 4);
END; $function$;

CREATE OR REPLACE FUNCTION public.generate_forsvarlighetsvurdering_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'FV-' || public.pad_number(nextval('forsvarlighetsvurdering_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_hms_sja_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'SJA-HMS-' || public.pad_number(nextval('hms_sja_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_daily_report_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'DR-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' ||
  public.pad_number(nextval('ks_daily_report_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_avvik_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'AVV-' || public.pad_number(nextval('ks_module2_avvik_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_change_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'EM-' || public.pad_number(nextval('ks_module2_change_order_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_claim_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'REK-' || public.pad_number(nextval('ks_module2_claim_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_meeting_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'MR-' || public.pad_number(nextval('ks_module2_meeting_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_project_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'PRJ-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' ||
  public.pad_number(nextval('ks_module2_project_number_seq'), 3); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_routine_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'RUT-' || public.pad_number(nextval('ks_module2_routine_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_sja_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'SJA-' || public.pad_number(nextval('ks_module2_sja_number_seq'), 3); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_uk_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'UK-' || public.pad_number(nextval('ks_module2_uk_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_ks_module2_vernerunde_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'VR-' || public.pad_number(nextval('ks_module2_vernerunde_number_seq'), 3); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'PRJ-' || public.pad_number(nextval('ks_project_number_seq'), 5); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_travel_expense_report_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN 'RR-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' ||
  public.pad_number(nextval('travel_expense_report_number_seq'), 4); END; $function$;

CREATE OR REPLACE FUNCTION public.generate_anonymous_message_number(p_company_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT; v_next BIGINT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(message_number, '^AM-\d{4}-', ''), '')::BIGINT), 0) + 1
  INTO v_next FROM anonymous_messages
  WHERE company_id = p_company_id
    AND message_number LIKE 'AM-' || v_year || '-%'
    AND regexp_replace(message_number, '^AM-\d{4}-', '') ~ '^\d+$';
  RETURN 'AM-' || v_year || '-' || public.pad_number(v_next, 3);
END; $function$;

CREATE OR REPLACE FUNCTION public.generate_inspection_number(p_company_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE next_num BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(inspection_number FROM 'BEF-(\d+)') AS BIGINT)), 0) + 1
  INTO next_num
  FROM public.simple_project_inspections
  WHERE company_id = p_company_id
    AND inspection_number ~ '^BEF-\d+$';
  RETURN 'BEF-' || public.pad_number(next_num, 4);
END; $function$;