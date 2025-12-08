-- Create table for verneombud exemption agreements
CREATE TABLE public.verneombud_exemption_agreements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    total_employees INTEGER NOT NULL,
    agreement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employer_name TEXT NOT NULL,
    employer_signature TEXT, -- Base64 signature
    employer_signed_at TIMESTAMP WITH TIME ZONE,
    employee_signatures JSONB DEFAULT '[]'::jsonb, -- Array of {name, signature, signed_at}
    status TEXT NOT NULL DEFAULT 'draft', -- draft, active, expired
    valid_until DATE, -- Becomes invalid when company reaches 5+ employees
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (company_id)
);

-- Enable RLS
ALTER TABLE public.verneombud_exemption_agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's exemption agreement"
ON public.verneombud_exemption_agreements
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can create exemption agreements"
ON public.verneombud_exemption_agreements
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their exemption agreements"
ON public.verneombud_exemption_agreements
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can delete their exemption agreements"
ON public.verneombud_exemption_agreements
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_verneombud_exemption_agreements_updated_at
BEFORE UPDATE ON public.verneombud_exemption_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();