-- Add AVDELINGER to module_pricing
INSERT INTO public.module_pricing (module_type, module_name, description, price_monthly, is_active)
VALUES ('AVDELINGER', 'Avdelinger', 'Organiser bedriften i avdelinger med egne brukere og data', 199.00, true)
ON CONFLICT (module_type) DO NOTHING;