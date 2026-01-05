-- Drop the existing check constraint and recreate with ALL module types included
ALTER TABLE public.company_modules DROP CONSTRAINT IF EXISTS company_modules_module_type_check;

ALTER TABLE public.company_modules ADD CONSTRAINT company_modules_module_type_check 
CHECK (module_type IN ('IK_HMS', 'IK_MAT', 'IK_BYGG', 'IK_ALKOHOL', 'KS', 'HR', 'GDPR', 'TIMEREGISTRERING', 'PERSONALHANDBOK', 'AVDELINGER'));