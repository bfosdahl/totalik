
INSERT INTO public.company_modules (company_id, module_type, is_active, settings)
VALUES ('f867f814-0347-4ad7-86b9-ca657a122467','IK_HMS',true,
        '{"industry":"produksjon","importedBransje":"Produksjon/Butikk","setupComplete":true}'::jsonb)
ON CONFLICT DO NOTHING;

UPDATE public.companies
SET brreg_employee_count = 3, employee_count = 3
WHERE id = 'f867f814-0347-4ad7-86b9-ca657a122467';
