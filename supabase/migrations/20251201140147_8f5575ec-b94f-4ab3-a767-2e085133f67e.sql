-- Create time_entries table for time registration
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  entry_date DATE NOT NULL,
  hours NUMERIC(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  project_name TEXT,
  project_id UUID,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_time_entries_company_date ON public.time_entries(company_id, entry_date);
CREATE INDEX idx_time_entries_user_date ON public.time_entries(user_id, entry_date);

-- RLS Policies

-- Users can view their own time entries
CREATE POLICY "Users can view their own time entries"
ON public.time_entries
FOR SELECT
USING (user_id = auth.uid());

-- Company admins can view all time entries in their company
CREATE POLICY "Company admins can view all company time entries"
ON public.time_entries
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Users can create their own time entries
CREATE POLICY "Users can create their own time entries"
ON public.time_entries
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND company_id = get_user_company_id(auth.uid())
);

-- Users can update their own draft/submitted entries
CREATE POLICY "Users can update their own time entries"
ON public.time_entries
FOR UPDATE
USING (
  user_id = auth.uid() 
  AND status IN ('draft', 'submitted', 'rejected')
);

-- Company admins can update any entry in their company (for approval)
CREATE POLICY "Company admins can update company time entries"
ON public.time_entries
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- Users can delete their own draft entries
CREATE POLICY "Users can delete their own draft time entries"
ON public.time_entries
FOR DELETE
USING (
  user_id = auth.uid() 
  AND status = 'draft'
);

-- Company admins can delete any entry in their company
CREATE POLICY "Company admins can delete company time entries"
ON public.time_entries
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

-- System admins can manage all
CREATE POLICY "System admins can manage all time entries"
ON public.time_entries
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();