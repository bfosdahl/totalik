
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT,
  email_type TEXT NOT NULL DEFAULT 'transactional',
  status TEXT NOT NULL DEFAULT 'sent',
  resend_email_id TEXT,
  sent_by TEXT,
  company_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for webhook lookups by resend_email_id
CREATE INDEX idx_email_logs_resend_email_id ON public.email_logs (resend_email_id);
CREATE INDEX idx_email_logs_status ON public.email_logs (status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);

-- RLS: only system admins can read
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can read email_logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert email_logs"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin(auth.uid()));

-- Allow service role (edge functions) to insert/update without RLS
CREATE POLICY "Service role full access on email_logs"
  ON public.email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon role for webhook inserts/updates (edge function uses anon key with verify_jwt=false)
CREATE POLICY "Anon can update email_logs for webhooks"
  ON public.email_logs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
