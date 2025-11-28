-- Add next of kin fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS next_of_kin_name text,
ADD COLUMN IF NOT EXISTS next_of_kin_phone text,
ADD COLUMN IF NOT EXISTS next_of_kin_relation text;

-- Create employee_documents table
CREATE TABLE public.employee_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  description text,
  uploaded_by uuid REFERENCES public.profiles(id),
  uploaded_by_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create employee_courses table for tracking certifications/courses
CREATE TABLE public.employee_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  course_provider text,
  certificate_number text,
  completed_date date NOT NULL,
  expiry_date date,
  validity_years integer,
  status text NOT NULL DEFAULT 'active',
  notes text,
  reminder_sent_30_days boolean DEFAULT false,
  reminder_sent_7_days boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_documents
CREATE POLICY "Users can view their own documents"
ON public.employee_documents FOR SELECT
USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view documents in their company"
ON public.employee_documents FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can manage documents in their company"
ON public.employee_documents FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all documents"
ON public.employee_documents FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- RLS policies for employee_courses
CREATE POLICY "Users can view their own courses"
ON public.employee_courses FOR SELECT
USING (employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view courses in their company"
ON public.employee_courses FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can manage courses in their company"
ON public.employee_courses FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "System admins can manage all courses"
ON public.employee_courses FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee-documents bucket
CREATE POLICY "Users can view their own employee documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Company admins can view all employee documents in their company"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-documents' AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-documents' AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

CREATE POLICY "Company admins can delete employee documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee-documents' AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER update_employee_documents_updated_at
BEFORE UPDATE ON public.employee_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_courses_updated_at
BEFORE UPDATE ON public.employee_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();