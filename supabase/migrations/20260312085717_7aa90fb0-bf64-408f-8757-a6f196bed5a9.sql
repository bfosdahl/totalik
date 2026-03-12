
CREATE TABLE public.user_provisioning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid REFERENCES companies(id),
  role text NOT NULL DEFAULT 'user',
  created_by_id uuid,
  auth_created boolean DEFAULT false,
  profile_updated boolean DEFAULT false,
  role_assigned boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  reset_link_generated boolean DEFAULT false,
  all_verified boolean DEFAULT false,
  error_message text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_provisioning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view provisioning logs"
ON public.user_provisioning_log
FOR SELECT
TO authenticated
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert provisioning logs"
ON public.user_provisioning_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_system_admin(auth.uid()));

-- Also allow service role (edge functions) to insert
CREATE POLICY "Service role can manage provisioning logs"
ON public.user_provisioning_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
