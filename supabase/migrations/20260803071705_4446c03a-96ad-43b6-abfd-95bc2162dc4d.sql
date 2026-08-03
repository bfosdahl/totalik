UPDATE public.profiles
SET company_id = 'be8a06dc-4a3c-490f-8e58-9800fd1d35a5',
    updated_at = now()
WHERE user_id = '481725f9-83a1-4352-9e03-31f14782e1d3';

-- Verify the update
SELECT id, user_id, email, company_id FROM public.profiles WHERE user_id = '481725f9-83a1-4352-9e03-31f14782e1d3';