-- 1. Drop the permissive duplicate INSERT policy on driving_log_entries
DROP POLICY IF EXISTS "Users can insert own driving log entries" ON public.driving_log_entries;

-- 2. Add a fixed search_path to attach_audit_trigger
CREATE OR REPLACE FUNCTION public.attach_audit_trigger(p_table text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trigger_name text := 'trg_audit_' || p_table;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=p_table) THEN
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change_generic()',
      v_trigger_name, p_table
    );
  END IF;
END;
$function$;