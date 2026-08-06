CREATE TABLE public.signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  signer_role text,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.signature_events TO authenticated;
GRANT ALL ON public.signature_events TO service_role;

ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own signature events"
ON public.signature_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System admins can view all signature events"
ON public.signature_events FOR SELECT TO authenticated
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "Company admins can view own company signature events"
ON public.signature_events FOR SELECT TO authenticated
USING (
  public.is_company_admin(auth.uid())
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE INDEX idx_signature_events_created_at ON public.signature_events (created_at DESC);
CREATE INDEX idx_signature_events_status_created ON public.signature_events (status, created_at DESC);
CREATE INDEX idx_signature_events_company ON public.signature_events (company_id, created_at DESC);