-- Add DELETE policy for anonymous_messages
CREATE POLICY "Leaders and verneombud can delete anonymous messages"
ON public.anonymous_messages
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_leader_or_verneombud(auth.uid())
);

-- Add DELETE policy for anonymous_message_discussions
CREATE POLICY "Leaders and verneombud can delete discussions"
ON public.anonymous_message_discussions
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND is_leader_or_verneombud(auth.uid())
);