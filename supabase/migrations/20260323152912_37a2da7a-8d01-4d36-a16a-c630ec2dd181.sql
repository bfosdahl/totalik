CREATE TABLE public.client_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  component_stack text,
  url text,
  user_agent text,
  source text NOT NULL DEFAULT 'error_boundary',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — only edge function with service role writes to this table
ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

-- Allow system_admin to read logs
CREATE POLICY "System admins can read error logs"
  ON public.client_error_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Index for querying recent errors
CREATE INDEX idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);
CREATE INDEX idx_client_error_logs_user_id ON public.client_error_logs (user_id);