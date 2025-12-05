-- Fix RLS policies for ik_hms_stoffkartotek
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company's stoffkartotek" ON public.ik_hms_stoffkartotek;
DROP POLICY IF EXISTS "Users can create stoffkartotek for their company" ON public.ik_hms_stoffkartotek;
DROP POLICY IF EXISTS "Users can update their company's stoffkartotek" ON public.ik_hms_stoffkartotek;
DROP POLICY IF EXISTS "Users can delete their company's stoffkartotek" ON public.ik_hms_stoffkartotek;

-- Create corrected RLS policies (using user_id instead of id)
CREATE POLICY "Users can view their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stoffkartotek for their company"
  ON public.ik_hms_stoffkartotek
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's stoffkartotek"
  ON public.ik_hms_stoffkartotek
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );