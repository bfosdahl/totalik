import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface Checkpoint {
  id: string;
  text: string;
  description?: string;
}

const parseCheckpoints = (data: Json | null): Checkpoint[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return { id: crypto.randomUUID(), text: item };
    }
    return {
      id: item.id || crypto.randomUUID(),
      text: item.text || item.checkpoint_text || item.checkpoint || '',
      description: item.description || item.help_text || item.help || undefined,
    };
  });
};

export interface CompanyKsChecklistTemplate {
  id: string;
  company_id: string;
  template_name: string;
  description: string | null;
  category: string;
  checkpoints: Checkpoint[];
  is_active: boolean;
  trade: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface SelectedAdminTemplate {
  id: string;
  company_id: string;
  template_type: string;
  admin_template_id: string;
  selected_at: string;
  selected_by_id: string | null;
}

export function useCompanyKsChecklistTemplates() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const [templates, setTemplates] = useState<CompanyKsChecklistTemplate[]>([]);
  const [selectedAdminTemplates, setSelectedAdminTemplates] = useState<SelectedAdminTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const [templatesRes, selectedRes] = await Promise.all([
        supabase
          .from("company_ks_checklist_templates")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("company_ks_selected_templates")
          .select("*")
          .eq("company_id", companyId),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (selectedRes.error) throw selectedRes.error;
      
      // Parse checkpoints from JSON
      const parsedTemplates: CompanyKsChecklistTemplate[] = (templatesRes.data || []).map(t => ({
        ...t,
        checkpoints: parseCheckpoints(t.checkpoints),
      }));
      
      setTemplates(parsedTemplates);
      setSelectedAdminTemplates(selectedRes.data || []);
    } catch (error) {
      console.error("Error fetching checklist templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (input: {
    template_name: string;
    description?: string;
    category?: string;
    checkpoints?: Checkpoint[];
    trade?: string;
  }) => {
    if (!companyId) return null;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_checklist_templates")
        .insert({
          company_id: companyId,
          template_name: input.template_name,
          description: input.description || null,
          category: input.category || "general",
          checkpoints: (input.checkpoints || []) as unknown as Json,
          trade: input.trade || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      const parsed: CompanyKsChecklistTemplate = { 
        ...data, 
        checkpoints: parseCheckpoints(data.checkpoints),
      };
      setTemplates(prev => [parsed, ...prev]);
      toast({ title: "Sjekklistemal opprettet" });
      return parsed;
    } catch (error) {
      console.error("Error creating template:", error);
      toast({ title: "Kunne ikke opprette mal", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<CompanyKsChecklistTemplate>) => {
    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUpdates: any = { ...updates };
      if (updates.checkpoints) {
        dbUpdates.checkpoints = updates.checkpoints as unknown as Json;
      }
      const { error } = await supabase
        .from("company_ks_checklist_templates")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast({ title: "Mal oppdatert" });
    } catch (error) {
      console.error("Error updating template:", error);
      toast({ title: "Kunne ikke oppdatere mal", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_checklist_templates")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: (profile as any)?.user_id || null,
        })
        .eq("id", id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: "Mal slettet" });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Kunne ikke slette mal", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Select/deselect admin templates
  const selectAdminTemplate = async (templateType: 'checklist' | 'routine' | 'document', adminTemplateId: string, adminTemplate?: { template_name: string; description?: string | null; category?: string; checkpoints?: Json }) => {
    if (!companyId || !profile) return false;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_selected_templates")
        .insert({
          company_id: companyId,
          template_type: templateType,
          admin_template_id: adminTemplateId,
          selected_by_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSelectedAdminTemplates(prev => [...prev, data]);

      // If it's a checklist and we have template data, also create a company checklist template
      if (templateType === 'checklist' && adminTemplate) {
        const { data: newTemplate, error: createError } = await supabase
          .from("company_ks_checklist_templates")
          .insert({
            company_id: companyId,
            template_name: adminTemplate.template_name,
            description: adminTemplate.description || null,
            category: adminTemplate.category || "general",
            checkpoints: adminTemplate.checkpoints || [],
          })
          .select()
          .single();

        if (!createError && newTemplate) {
          const parsed: CompanyKsChecklistTemplate = {
            ...newTemplate,
            checkpoints: parseCheckpoints(newTemplate.checkpoints),
          };
          setTemplates(prev => [parsed, ...prev]);
        }
      }

      toast({ title: "Mal lagt til" });
      return true;
    } catch (error) {
      console.error("Error selecting admin template:", error);
      toast({ title: "Kunne ikke velge mal", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deselectAdminTemplate = async (templateType: string, adminTemplateId: string) => {
    if (!companyId) return false;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_selected_templates")
        .delete()
        .eq("company_id", companyId)
        .eq("template_type", templateType)
        .eq("admin_template_id", adminTemplateId);

      if (error) throw error;
      
      setSelectedAdminTemplates(prev => 
        prev.filter(t => !(t.template_type === templateType && t.admin_template_id === adminTemplateId))
      );
      toast({ title: "Mal fjernet" });
      return true;
    } catch (error) {
      console.error("Error deselecting admin template:", error);
      toast({ title: "Kunne ikke fjerne mal", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const isAdminTemplateSelected = (templateType: string, adminTemplateId: string) => {
    return selectedAdminTemplates.some(
      t => t.template_type === templateType && t.admin_template_id === adminTemplateId
    );
  };

  const getSelectedAdminTemplateIds = (templateType: string) => {
    return selectedAdminTemplates
      .filter(t => t.template_type === templateType)
      .map(t => t.admin_template_id);
  };

  const customCategories = [...new Set(templates.map(t => t.category))];

  return {
    templates,
    customCategories,
    selectedAdminTemplates,
    isLoading,
    isSaving,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectAdminTemplate,
    deselectAdminTemplate,
    isAdminTemplateSelected,
    getSelectedAdminTemplateIds,
    refetch: fetchTemplates,
  };
}
