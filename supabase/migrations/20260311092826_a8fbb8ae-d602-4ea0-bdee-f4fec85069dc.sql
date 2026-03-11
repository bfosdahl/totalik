-- Allow employees to insert their own courses
CREATE POLICY "Users can insert their own courses"
ON public.employee_courses
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow employees to delete their own courses
CREATE POLICY "Users can delete their own courses"
ON public.employee_courses
FOR DELETE
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow employees to update their own courses
CREATE POLICY "Users can update their own courses"
ON public.employee_courses
FOR UPDATE
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND employee_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);