-- Create table for dynamic admin document folders
CREATE TABLE public.admin_document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Folder',
  color TEXT DEFAULT 'blue',
  parent_folder_id UUID REFERENCES public.admin_document_folders(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to admin_documents table
ALTER TABLE public.admin_documents 
ADD COLUMN folder_id UUID REFERENCES public.admin_document_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.admin_document_folders ENABLE ROW LEVEL SECURITY;

-- Create policies for system admins only (using user_roles table)
CREATE POLICY "System admins can view all folders" 
ON public.admin_document_folders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'system_admin'
  )
);

CREATE POLICY "System admins can create folders" 
ON public.admin_document_folders 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'system_admin'
  )
);

CREATE POLICY "System admins can update folders" 
ON public.admin_document_folders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'system_admin'
  )
);

CREATE POLICY "System admins can delete folders" 
ON public.admin_document_folders 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'system_admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_document_folders_updated_at
BEFORE UPDATE ON public.admin_document_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();