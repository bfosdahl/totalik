-- Create table for company time clock QR codes
CREATE TABLE public.time_clock_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Hovedkontor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for time clock entries (clock in/out)
CREATE TABLE public.time_clock_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  qr_code_id UUID REFERENCES public.time_clock_qr_codes(id),
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(5,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_clock_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for QR codes
CREATE POLICY "Users can view QR codes for their company"
  ON public.time_clock_qr_codes FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can manage QR codes"
  ON public.time_clock_qr_codes FOR ALL
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

-- RLS policies for clock entries
CREATE POLICY "Users can view their own clock entries"
  ON public.time_clock_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can view all company clock entries"
  ON public.time_clock_entries FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
    AND (public.is_company_admin(auth.uid()) OR public.is_system_admin(auth.uid()))
  );

CREATE POLICY "Users can create their own clock entries"
  ON public.time_clock_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own active clock entries"
  ON public.time_clock_entries FOR UPDATE
  USING (user_id = auth.uid() AND status = 'active');

-- Create indexes
CREATE INDEX idx_time_clock_qr_codes_company ON public.time_clock_qr_codes(company_id);
CREATE INDEX idx_time_clock_qr_codes_code ON public.time_clock_qr_codes(code);
CREATE INDEX idx_time_clock_entries_user ON public.time_clock_entries(user_id);
CREATE INDEX idx_time_clock_entries_company ON public.time_clock_entries(company_id);
CREATE INDEX idx_time_clock_entries_status ON public.time_clock_entries(status);