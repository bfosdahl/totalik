ALTER TABLE public.company_notification_settings
  ADD COLUMN IF NOT EXISTS shift_reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shift_reminder_time time NOT NULL DEFAULT '06:00',
  ADD COLUMN IF NOT EXISTS shift_reminder_evening_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shift_reminder_evening_time time NOT NULL DEFAULT '19:00';

ALTER TABLE public.user_notification_settings
  ADD COLUMN IF NOT EXISTS notify_shifts_push boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_shifts_email boolean NOT NULL DEFAULT true;

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS notification_log_dedupe_key_uidx
  ON public.notification_log (dedupe_key)
  WHERE dedupe_key IS NOT NULL;