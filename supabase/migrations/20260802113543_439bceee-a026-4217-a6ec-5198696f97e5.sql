ALTER TABLE public.ik_mat_sensors ADD COLUMN IF NOT EXISTS simulation_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ik_mat_sensors ADD COLUMN IF NOT EXISTS simulated_payload JSONB DEFAULT NULL;

ALTER TABLE public.company_notification_settings ADD COLUMN IF NOT EXISTS sensor_alarm_email BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.company_notification_settings ADD COLUMN IF NOT EXISTS sensor_alarm_email_recipients TEXT[] DEFAULT NULL;
ALTER TABLE public.company_notification_settings ADD COLUMN IF NOT EXISTS sensor_alarm_sms BOOLEAN NOT NULL DEFAULT false;

GRANT UPDATE (sensor_alarm_email, sensor_alarm_email_recipients, sensor_alarm_sms) ON public.company_notification_settings TO authenticated;
GRANT ALL ON public.company_notification_settings TO service_role;