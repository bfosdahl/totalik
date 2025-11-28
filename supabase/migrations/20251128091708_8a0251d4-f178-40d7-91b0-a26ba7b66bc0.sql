-- Add reminder columns for HMS card 90 and 60 days
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hms_card_reminder_sent_90_days boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hms_card_reminder_sent_60_days boolean DEFAULT false;

-- Create company_modules table for module management
CREATE TABLE IF NOT EXISTS public.company_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_type text NOT NULL CHECK (module_type IN ('IK_HMS', 'IK_MAT', 'IK_ALKOHOL', 'IK_BYGG', 'PERSONALHANDBOK')),
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, module_type)
);

-- Enable RLS on company_modules
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company modules"
ON public.company_modules FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company modules"
ON public.company_modules FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all modules"
ON public.company_modules FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_projects table
CREATE TABLE IF NOT EXISTS public.ks_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  client_name text,
  tiltaksklasse text CHECK (tiltaksklasse IN ('1', '2', '3')),
  ansvarsrolle text DEFAULT 'UTF – Tømrerarbeid og montering av trekonstruksjoner',
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'planlagt' CHECK (status IN ('planlagt', 'pågår', 'ferdig', 'arkivert')),
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company KS projects"
ON public.ks_projects FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create KS projects in their company"
ON public.ks_projects FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their company KS projects"
ON public.ks_projects FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (is_company_admin(auth.uid()) OR is_system_admin(auth.uid()))
);

CREATE POLICY "System admins can manage all KS projects"
ON public.ks_projects FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_templates table
CREATE TABLE IF NOT EXISTS public.ks_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trade text DEFAULT 'UTF – Tømrer',
  phase text,
  is_system_default boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view KS templates"
ON public.ks_templates FOR SELECT
USING (true);

CREATE POLICY "Only system admins can manage KS templates"
ON public.ks_templates FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_template_items table
CREATE TABLE IF NOT EXISTS public.ks_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.ks_templates(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  text text NOT NULL,
  help_text text,
  category text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view KS template items"
ON public.ks_template_items FOR SELECT
USING (true);

CREATE POLICY "Only system admins can manage KS template items"
ON public.ks_template_items FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_checklists table
CREATE TABLE IF NOT EXISTS public.ks_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.ks_templates(id),
  phase text,
  filled_by_user_id uuid REFERENCES auth.users(id),
  filled_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KS checklists for their company projects"
ON public.ks_checklists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_checklists.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can create KS checklists for their company projects"
ON public.ks_checklists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_checklists.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can update their own KS checklists"
ON public.ks_checklists FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_checklists.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System admins can manage all KS checklists"
ON public.ks_checklists FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_checklist_items table
CREATE TABLE IF NOT EXISTS public.ks_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.ks_checklists(id) ON DELETE CASCADE,
  template_item_id uuid NOT NULL REFERENCES public.ks_template_items(id),
  status text DEFAULT 'pending' CHECK (status IN ('OK', 'AVVIK', 'IKKE_AKTUELT', 'pending')),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KS checklist items for their company"
ON public.ks_checklist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_checklists
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklists.id = ks_checklist_items.checklist_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage KS checklist items for their company"
ON public.ks_checklist_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_checklists
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklists.id = ks_checklist_items.checklist_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_checklists
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklists.id = ks_checklist_items.checklist_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System admins can manage all KS checklist items"
ON public.ks_checklist_items FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_photos table
CREATE TABLE IF NOT EXISTS public.ks_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id uuid NOT NULL REFERENCES public.ks_checklist_items(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  taken_by_user_id uuid REFERENCES auth.users(id),
  taken_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KS photos for their company"
ON public.ks_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_checklist_items
    JOIN public.ks_checklists ON ks_checklists.id = ks_checklist_items.checklist_id
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklist_items.id = ks_photos.checklist_item_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage KS photos for their company"
ON public.ks_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_checklist_items
    JOIN public.ks_checklists ON ks_checklists.id = ks_checklist_items.checklist_id
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklist_items.id = ks_photos.checklist_item_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_checklist_items
    JOIN public.ks_checklists ON ks_checklists.id = ks_checklist_items.checklist_id
    JOIN public.ks_projects ON ks_projects.id = ks_checklists.project_id
    WHERE ks_checklist_items.id = ks_photos.checklist_item_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System admins can manage all KS photos"
ON public.ks_photos FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_change_orders table
CREATE TABLE IF NOT EXISTS public.ks_change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_hours numeric,
  price_ex_vat numeric,
  created_by_user_id uuid REFERENCES auth.users(id),
  customer_approved boolean DEFAULT false,
  approved_at timestamp with time zone,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change orders for their company projects"
ON public.ks_change_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_change_orders.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage change orders for their company projects"
ON public.ks_change_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_change_orders.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_change_orders.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System admins can manage all change orders"
ON public.ks_change_orders FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create ks_sja table (for future SJA functionality)
CREATE TABLE IF NOT EXISTS public.ks_sja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.ks_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  hazards_json jsonb DEFAULT '[]'::jsonb,
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ks_sja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SJA for their company projects"
ON public.ks_sja FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_sja.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can manage SJA for their company projects"
ON public.ks_sja FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_sja.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ks_projects
    WHERE ks_projects.id = ks_sja.project_id
    AND ks_projects.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "System admins can manage all SJA"
ON public.ks_sja FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_company_modules_updated_at
BEFORE UPDATE ON public.company_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_projects_updated_at
BEFORE UPDATE ON public.ks_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_templates_updated_at
BEFORE UPDATE ON public.ks_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_checklist_items_updated_at
BEFORE UPDATE ON public.ks_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_change_orders_updated_at
BEFORE UPDATE ON public.ks_change_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ks_sja_updated_at
BEFORE UPDATE ON public.ks_sja
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();