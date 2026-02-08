-- Drop the existing check constraint and recreate with IK_FDV included
ALTER TABLE public.company_modules DROP CONSTRAINT IF EXISTS company_modules_module_type_check;

ALTER TABLE public.company_modules ADD CONSTRAINT company_modules_module_type_check 
CHECK (module_type IN ('IK_HMS', 'IK_MAT', 'IK_ALKOHOL', 'IK_BYGG', 'IK_FDV', 'PERSONALHANDBOK', 'GDPR', 'APENHETSLOVEN', 'AVDELINGER', 'KS', 'HR', 'TIMEREGISTRERING'));