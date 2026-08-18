CREATE TABLE IF NOT EXISTS public.nextcom_service_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  template_key text NOT NULL,
  recipient_email text NOT NULL,
  company_name text,
  product_names text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, template_key)
);

GRANT SELECT ON public.nextcom_service_emails TO authenticated;
GRANT ALL ON public.nextcom_service_emails TO service_role;

ALTER TABLE public.nextcom_service_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view service emails"
ON public.nextcom_service_emails
FOR SELECT
TO authenticated
USING (public.is_system_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_nextcom_service_emails_sent_at ON public.nextcom_service_emails (sent_at DESC);