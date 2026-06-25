
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS admin_edit_reason text,
  ADD COLUMN IF NOT EXISTS admin_edited_by uuid,
  ADD COLUMN IF NOT EXISTS admin_edited_at timestamptz;

SELECT public.attach_audit_trigger('time_entries');
