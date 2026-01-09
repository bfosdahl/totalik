-- Add org_number to company_departments
ALTER TABLE public.company_departments 
ADD COLUMN IF NOT EXISTS org_number text;

-- Add department_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_admin';

-- Create function to check if user is department admin for a specific department
CREATE OR REPLACE FUNCTION public.is_department_admin_for(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_departments
    WHERE user_id = _user_id
      AND department_id = _department_id
      AND is_department_admin = true
  )
$$;

-- Create function to check if user is any department admin
CREATE OR REPLACE FUNCTION public.is_any_department_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_departments
    WHERE user_id = _user_id
      AND is_department_admin = true
  )
$$;

-- Create function to get departments user is admin for
CREATE OR REPLACE FUNCTION public.get_admin_department_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id 
  FROM public.user_departments
  WHERE user_id = _user_id
    AND is_department_admin = true
$$;