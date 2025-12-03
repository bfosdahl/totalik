-- Create storage bucket for KS Module 2 avvik photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('ks-module2-avvik-photos', 'ks-module2-avvik-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for KS Module 2 checklist photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('ks-module2-checklist-photos', 'ks-module2-checklist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avvik photos
CREATE POLICY "Users can view avvik photos" ON storage.objects
FOR SELECT USING (bucket_id = 'ks-module2-avvik-photos');

CREATE POLICY "Users can upload avvik photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ks-module2-avvik-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete avvik photos" ON storage.objects
FOR DELETE USING (bucket_id = 'ks-module2-avvik-photos' AND auth.uid() IS NOT NULL);

-- Storage policies for checklist photos
CREATE POLICY "Users can view checklist photos" ON storage.objects
FOR SELECT USING (bucket_id = 'ks-module2-checklist-photos');

CREATE POLICY "Users can upload checklist photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ks-module2-checklist-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete checklist photos" ON storage.objects
FOR DELETE USING (bucket_id = 'ks-module2-checklist-photos' AND auth.uid() IS NOT NULL);