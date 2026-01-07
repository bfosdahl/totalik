-- Fix overly permissive RLS policy on ai_rate_limits table

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.ai_rate_limits;

-- Create specific policy for authenticated users to manage their own rate limits
CREATE POLICY "Users can manage their own rate limits"
ON public.ai_rate_limits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);