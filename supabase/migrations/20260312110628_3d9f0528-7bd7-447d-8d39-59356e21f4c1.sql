
-- Tighten the anon policy to only allow updating status-related fields
DROP POLICY IF EXISTS "Anon can update email_logs for webhooks" ON public.email_logs;

-- Replace with a more restrictive policy that still allows webhook updates
-- The webhook edge function uses service_role key internally, so anon policy not needed
DROP POLICY IF EXISTS "Service role full access on email_logs" ON public.email_logs;

-- Service role bypasses RLS by default, so we don't need an explicit policy
-- Just ensure the edge function uses SUPABASE_SERVICE_ROLE_KEY
