UPDATE public.companies SET status = 'inactive' WHERE id = '20c45fe5-efdd-4a3d-aca0-5ef9ee271180';
UPDATE public.profiles SET is_active = false, status = 'suspended', deleted_at = now() WHERE company_id = '20c45fe5-efdd-4a3d-aca0-5ef9ee271180';
DELETE FROM public.user_roles WHERE user_id = '6c7ab6a9-daea-4507-a132-39a948c0fc2b';
DELETE FROM public.company_modules WHERE company_id = '20c45fe5-efdd-4a3d-aca0-5ef9ee271180';