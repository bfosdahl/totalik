ALTER TABLE public.user_provisioning_log
  DROP CONSTRAINT IF EXISTS user_provisioning_log_company_id_fkey;

ALTER TABLE public.user_provisioning_log
  ADD CONSTRAINT user_provisioning_log_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;