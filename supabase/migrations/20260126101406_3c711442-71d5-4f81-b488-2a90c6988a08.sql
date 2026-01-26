-- Drop existing check constraint and add updated one with 'vernerunde'
ALTER TABLE public.audit_form_responses 
DROP CONSTRAINT IF EXISTS audit_form_responses_form_type_check;

ALTER TABLE public.audit_form_responses 
ADD CONSTRAINT audit_form_responses_form_type_check 
CHECK (form_type IN ('annual_hms', 'elkontroll', 'fysiske_forhold', 'daglig_drift', 'vernerunde'));