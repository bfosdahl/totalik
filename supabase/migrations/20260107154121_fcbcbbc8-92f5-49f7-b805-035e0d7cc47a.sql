-- Create table to store terms acceptance records
CREATE TABLE public.user_terms_acceptance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  terms_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint so each user can only have one acceptance per version
CREATE UNIQUE INDEX user_terms_acceptance_user_version_idx ON public.user_terms_acceptance (user_id, terms_version);

-- Enable RLS
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptance records
CREATE POLICY "Users can view their own terms acceptance"
ON public.user_terms_acceptance
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own acceptance records
CREATE POLICY "Users can accept terms"
ON public.user_terms_acceptance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System admins can view all acceptance records
CREATE POLICY "System admins can view all terms acceptance"
ON public.user_terms_acceptance
FOR SELECT
USING (public.is_system_admin(auth.uid()));