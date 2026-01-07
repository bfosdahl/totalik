-- Add policy to allow the handle_new_user trigger to insert profiles
-- The trigger runs with SECURITY DEFINER so it needs a way to bypass RLS for initial profile creation

-- Drop the existing function and recreate it with proper permissions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a policy that allows service_role to insert profiles (for the trigger)
-- This is a bypass policy for the trigger which runs as service_role via SECURITY DEFINER
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Also manually create the missing profile for bfosdahl@gmail.com
INSERT INTO public.profiles (user_id, email, first_name, last_name)
VALUES ('ebbd8642-dab3-482f-9881-30f5b9dcaa1a', 'bfosdahl@gmail.com', NULL, NULL)
ON CONFLICT (user_id) DO NOTHING;