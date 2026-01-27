-- Add language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'no';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language: no, pl, lt, en';

-- Create translations cache table to avoid re-translating same content
CREATE TABLE public.content_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'no',
  target_language TEXT NOT NULL,
  original_content TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'handbook',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, content_hash, target_language)
);

-- Enable RLS
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

-- Policies for content_translations
CREATE POLICY "Users can view translations for their company" 
ON public.content_translations 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create translations for their company" 
ON public.content_translations 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_content_translations_lookup 
ON public.content_translations(company_id, content_hash, target_language);