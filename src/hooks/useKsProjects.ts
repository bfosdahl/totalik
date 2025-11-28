import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KsProjectResponsibility {
  id?: string;
  project_id?: string;
  role_type: 'SØK' | 'PRO' | 'UTF' | 'KTR';
  funksjon: string;
  ansvarlig_navn: string;
  created_at?: string;
  updated_at?: string;
}

export interface KsProject {
  id: string;
  company_id: string;
  name: string;
  project_number: string;
  address: string | null;
  client_name: string | null;
  tiltaksklasse: string | null;
  ansvarsrolle: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  ansvarlig_soker: string | null;
  ansvarlig_soker_funksjon: string | null;
  ansvarlig_prosjekterende: string | null;
  ansvarlig_prosjekterende_funksjon: string | null;
  ansvarlig_utforende: string | null;
  ansvarlig_utforende_funksjon: string | null;
  ansvarlig_kontrollerende: string | null;
  ansvarlig_kontrollerende_funksjon: string | null;
  responsibilities?: KsProjectResponsibility[];
}

export interface KsTemplate {
  id: string;
  name: string;
  description: string | null;
  trade: string | null;
  phase: string | null;
  is_system_default: boolean;
}

export interface KsTemplateItem {
  id: string;
  template_id: string;
  order_index: number;
  text: string;
  help_text: string | null;
  category: string | null;
}

export interface KsChecklist {
  id: string;
  project_id: string;
  template_id: string;
  phase: string | null;
  filled_by_user_id: string | null;
  filled_at: string | null;
  created_at: string;
  template?: KsTemplate;
}

export interface KsChecklistItem {
  id: string;
  checklist_id: string;
  template_item_id: string;
  status: string;
  comment: string | null;
  template_item?: KsTemplateItem;
}

export interface NewKsProjectInput {
  name: string;
  address?: string;
  client_name?: string;
  tiltaksklasse?: string;
  ansvarsrolle?: string;
  start_date: string;
  end_date?: string;
  ansvarlig_soker?: string;
  ansvarlig_soker_funksjon?: string;
  ansvarlig_prosjekterende?: string;
  ansvarlig_prosjekterende_funksjon?: string;
  ansvarlig_utforende?: string;
  ansvarlig_utforende_funksjon?: string;
  ansvarlig_kontrollerende?: string;
  ansvarlig_kontrollerende_funksjon?: string;
  responsibilities?: Omit<KsProjectResponsibility, 'id' | 'project_id' | 'created_at' | 'updated_at'>[];
}

export function useKsProjects() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<KsProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!profile?.company_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ks_projects')
        .select(`
          *,
          responsibilities:ks_project_responsibilities(*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as KsProject[]);
    } catch (error) {
      console.error('Error fetching KS projects:', error);
      toast.error('Kunne ikke hente prosjekter');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchProjects();
    }
  }, [fetchProjects, profile?.company_id]);

  const createProject = useCallback(async (input: NewKsProjectInput) => {
    if (!profile?.company_id || !user?.id) {
      toast.error('Du må være logget inn');
      return null;
    }

    setIsSaving(true);
    try {
      const { responsibilities, ...projectData } = input;
      
      const { data, error } = await supabase
        .from('ks_projects')
        .insert({
          company_id: profile.company_id,
          created_by_user_id: user.id,
          name: projectData.name,
          address: projectData.address || null,
          client_name: projectData.client_name || null,
          tiltaksklasse: projectData.tiltaksklasse || null,
          ansvarsrolle: projectData.ansvarsrolle || 'UTF – Tømrerarbeid og montering av trekonstruksjoner',
          start_date: projectData.start_date,
          end_date: projectData.end_date || null,
          status: 'planlagt',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Insert responsibilities if provided
      if (responsibilities && responsibilities.length > 0) {
        const responsibilitiesData = responsibilities.map(r => ({
          ...r,
          project_id: data.id,
        }));
        
        const { error: respError } = await supabase
          .from('ks_project_responsibilities')
          .insert(responsibilitiesData);
          
        if (respError) throw respError;
      }
      
      setProjects(prev => [data, ...prev]);
      toast.success('Prosjekt opprettet');
      await fetchProjects(); // Refresh to get responsibilities
      return data;
    } catch (error) {
      console.error('Error creating KS project:', error);
      toast.error('Kunne ikke opprette prosjekt');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.company_id, user?.id, fetchProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<NewKsProjectInput>) => {
    setIsSaving(true);
    try {
      const { responsibilities, ...projectUpdates } = updates;
      
      const { data, error } = await supabase
        .from('ks_projects')
        .update(projectUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update responsibilities if provided
      if (responsibilities !== undefined) {
        // Delete existing responsibilities
        await supabase
          .from('ks_project_responsibilities')
          .delete()
          .eq('project_id', id);
        
        // Insert new responsibilities
        if (responsibilities.length > 0) {
          const responsibilitiesData = responsibilities.map(r => ({
            ...r,
            project_id: id,
          }));
          
          const { error: respError } = await supabase
            .from('ks_project_responsibilities')
            .insert(responsibilitiesData);
            
          if (respError) throw respError;
        }
      }
      
      setProjects(prev => prev.map(p => p.id === id ? data : p));
      toast.success('Prosjekt oppdatert');
      await fetchProjects(); // Refresh to get responsibilities
      return data;
    } catch (error) {
      console.error('Error updating KS project:', error);
      toast.error('Kunne ikke oppdatere prosjekt');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ks_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Prosjekt slettet');
      return true;
    } catch (error) {
      console.error('Error deleting KS project:', error);
      toast.error('Kunne ikke slette prosjekt');
      return false;
    }
  }, []);

  return {
    projects,
    isLoading,
    isSaving,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}

export function useKsTemplates() {
  const [templates, setTemplates] = useState<KsTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('ks_templates')
          .select('*')
          .order('phase', { ascending: true });

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching KS templates:', error);
        toast.error('Kunne ikke hente maler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, isLoading };
}

export function useKsChecklists(projectId: string | null) {
  const [checklists, setChecklists] = useState<KsChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChecklists = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ks_checklists')
        .select(`
          *,
          template:ks_templates(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error) {
      console.error('Error fetching KS checklists:', error);
      toast.error('Kunne ikke hente sjekklister');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchChecklists();
    }
  }, [fetchChecklists, projectId]);

  const createChecklist = useCallback(async (templateId: string) => {
    if (!projectId) return null;

    try {
      // Get template info
      const { data: template } = await supabase
        .from('ks_templates')
        .select('phase')
        .eq('id', templateId)
        .single();

      // Create checklist
      const { data: checklist, error } = await supabase
        .from('ks_checklists')
        .insert({
          project_id: projectId,
          template_id: templateId,
          phase: template?.phase || null,
        })
        .select(`
          *,
          template:ks_templates(*)
        `)
        .single();

      if (error) throw error;

      // Get template items
      const { data: templateItems } = await supabase
        .from('ks_template_items')
        .select('id')
        .eq('template_id', templateId);

      // Create checklist items for each template item
      if (templateItems && templateItems.length > 0) {
        const checklistItems = templateItems.map(item => ({
          checklist_id: checklist.id,
          template_item_id: item.id,
          status: 'pending',
        }));

        await supabase
          .from('ks_checklist_items')
          .insert(checklistItems);
      }

      setChecklists(prev => [checklist, ...prev]);
      toast.success('Sjekkliste opprettet');
      return checklist;
    } catch (error) {
      console.error('Error creating KS checklist:', error);
      toast.error('Kunne ikke opprette sjekkliste');
      return null;
    }
  }, [projectId]);

  return { checklists, isLoading, createChecklist, refetch: fetchChecklists };
}

export function useKsChecklistItems(checklistId: string | null) {
  const [items, setItems] = useState<KsChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!checklistId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ks_checklist_items')
        .select(`
          *,
          template_item:ks_template_items(*)
        `)
        .eq('checklist_id', checklistId)
        .order('template_item(order_index)', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching KS checklist items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checklistId]);

  useEffect(() => {
    if (checklistId) {
      fetchItems();
    }
  }, [fetchItems, checklistId]);

  const updateItem = useCallback(async (itemId: string, updates: { status?: string; comment?: string }) => {
    try {
      const { data, error } = await supabase
        .from('ks_checklist_items')
        .update(updates)
        .eq('id', itemId)
        .select(`
          *,
          template_item:ks_template_items(*)
        `)
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === itemId ? data : item));
      return data;
    } catch (error) {
      console.error('Error updating KS checklist item:', error);
      toast.error('Kunne ikke oppdatere punkt');
      return null;
    }
  }, []);

  return { items, isLoading, updateItem, refetch: fetchItems };
}
