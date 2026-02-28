
-- Kjørebok (Driving Log) for Norwegian tax compliance
-- Required fields per Skatteetaten: dato, formål, startsted, sluttsted, km-stand start/slutt, kjørelengde, biltype

CREATE TABLE public.driving_log_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Trip details (Skatteetaten requirements)
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose TEXT NOT NULL, -- Formål med turen
  start_location TEXT NOT NULL, -- Startsted
  end_location TEXT NOT NULL, -- Sluttsted (destinasjon)
  via_locations TEXT, -- Evt. stoppesteder
  
  -- Odometer readings (km-stand)
  odometer_start NUMERIC(10,1) NOT NULL, -- km-stand ved start
  odometer_end NUMERIC(10,1) NOT NULL, -- km-stand ved ankomst
  distance_km NUMERIC(8,1) GENERATED ALWAYS AS (odometer_end - odometer_start) STORED, -- Kjørelengde
  
  -- Vehicle info
  vehicle_type TEXT NOT NULL DEFAULT 'company', -- 'company' = firmabil, 'private' = privatbil
  vehicle_registration TEXT, -- Registreringsnummer
  vehicle_description TEXT, -- Bilbeskrivelse (merke/modell)
  
  -- Trip classification (Skatteetaten)
  trip_type TEXT NOT NULL DEFAULT 'business', -- 'business' = yrkeskjøring, 'private' = privat, 'commute' = arbeidsreise
  
  -- Additional info
  passenger_count INTEGER DEFAULT 0,
  passengers TEXT, -- Navn på passasjerer
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driving_log_entries ENABLE ROW LEVEL SECURITY;

-- Users can see their own entries
CREATE POLICY "Users can view own driving log entries"
ON public.driving_log_entries FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own entries  
CREATE POLICY "Users can insert own driving log entries"
ON public.driving_log_entries FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update their own entries
CREATE POLICY "Users can update own driving log entries"
ON public.driving_log_entries FOR UPDATE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own entries
CREATE POLICY "Users can delete own driving log entries"
ON public.driving_log_entries FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Company admins can view all entries in their company
CREATE POLICY "Company admins can view company driving logs"
ON public.driving_log_entries FOR SELECT
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  AND (
    is_company_admin(auth.uid()) OR is_system_admin(auth.uid())
  )
);

-- Updated_at trigger
CREATE TRIGGER update_driving_log_entries_updated_at
  BEFORE UPDATE ON public.driving_log_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_driving_log_entries_user_id ON public.driving_log_entries(user_id);
CREATE INDEX idx_driving_log_entries_trip_date ON public.driving_log_entries(trip_date DESC);
CREATE INDEX idx_driving_log_entries_company_id ON public.driving_log_entries(company_id);
