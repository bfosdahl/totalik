CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins manage system settings"
ON public.system_settings FOR ALL TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'nextcom_termination_status_ids',
  '{"status_ids": []}'::jsonb,
  'NextCom statusId-er som betyr «avsluttet kundeforhold» (hvit)'
)
ON CONFLICT (key) DO NOTHING;
