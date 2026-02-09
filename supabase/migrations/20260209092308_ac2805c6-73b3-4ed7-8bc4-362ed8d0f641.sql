-- Create org_chart_nodes table for hierarchical organization structure
CREATE TABLE public.org_chart_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES public.org_chart_nodes(id) ON DELETE SET NULL,
  role_title TEXT NOT NULL,
  role_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_root BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create org_chart_node_persons junction table for assigning people to nodes
CREATE TABLE public.org_chart_node_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES public.org_chart_nodes(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  person_email TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_org_chart_nodes_company ON public.org_chart_nodes(company_id);
CREATE INDEX idx_org_chart_nodes_parent ON public.org_chart_nodes(parent_node_id);
CREATE INDEX idx_org_chart_node_persons_node ON public.org_chart_node_persons(node_id);

-- Enable RLS
ALTER TABLE public.org_chart_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_chart_node_persons ENABLE ROW LEVEL SECURITY;

-- RLS policies for org_chart_nodes
CREATE POLICY "Users can view org chart nodes for their company"
ON public.org_chart_nodes
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Company admins can insert org chart nodes"
ON public.org_chart_nodes
FOR INSERT
WITH CHECK (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Company admins can update org chart nodes"
ON public.org_chart_nodes
FOR UPDATE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Company admins can delete org chart nodes"
ON public.org_chart_nodes
FOR DELETE
USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

-- RLS policies for org_chart_node_persons
CREATE POLICY "Users can view org chart persons for their company"
ON public.org_chart_node_persons
FOR SELECT
USING (
  node_id IN (
    SELECT id FROM org_chart_nodes 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Company admins can insert org chart persons"
ON public.org_chart_node_persons
FOR INSERT
WITH CHECK (
  node_id IN (
    SELECT id FROM org_chart_nodes 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Company admins can update org chart persons"
ON public.org_chart_node_persons
FOR UPDATE
USING (
  node_id IN (
    SELECT id FROM org_chart_nodes 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

CREATE POLICY "Company admins can delete org chart persons"
ON public.org_chart_node_persons
FOR DELETE
USING (
  node_id IN (
    SELECT id FROM org_chart_nodes 
    WHERE company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid())
  )
  AND (
    is_company_admin(auth.uid()) 
    OR is_system_admin(auth.uid())
    OR is_hms_responsible(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_org_chart_nodes_updated_at
BEFORE UPDATE ON public.org_chart_nodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check for circular references
CREATE OR REPLACE FUNCTION public.check_org_chart_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_parent_id UUID;
  visited_ids UUID[] := ARRAY[NEW.id];
BEGIN
  IF NEW.parent_node_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Traverse up the tree to check for cycles
  current_parent_id := NEW.parent_node_id;
  WHILE current_parent_id IS NOT NULL LOOP
    IF current_parent_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Circular reference detected in organization chart';
    END IF;
    visited_ids := array_append(visited_ids, current_parent_id);
    
    SELECT parent_node_id INTO current_parent_id
    FROM public.org_chart_nodes
    WHERE id = current_parent_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to prevent circular references
CREATE TRIGGER prevent_org_chart_circular_reference
BEFORE INSERT OR UPDATE ON public.org_chart_nodes
FOR EACH ROW
EXECUTE FUNCTION public.check_org_chart_circular_reference();