-- Create bucket for IK/HMS SDS files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ik-hms-sds', 'ik-hms-sds', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for authenticated users to manage their own company's SDS files
CREATE POLICY "Users can view their company SDS files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ik-hms-sds' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload SDS files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ik-hms-sds' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete SDS files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ik-hms-sds' AND auth.uid() IS NOT NULL);