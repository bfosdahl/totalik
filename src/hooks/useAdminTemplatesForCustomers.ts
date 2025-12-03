import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminChecklistTemplate {
  id: string;
  template_name: string;
  category: string;
  description: string | null;
  checkpoints: any[];
  version: string | null;
  is_mandatory: boolean | null;
  is_locked: boolean | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export interface AdminRoutineTemplate {
  id: string;
  routine_name: string;
  category: string;
  description: string | null;
  content: string;
  file_path: string | null;
  version: string | null;
  is_mandatory: boolean | null;
  is_locked: boolean | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export interface AdminDocument {
  id: string;
  document_name: string;
  category: string | null;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  version: string | null;
  is_mandatory: boolean | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export function useAdminTemplatesForCustomers() {
  // Fetch checklist templates from admin table
  const { data: checklistTemplates = [], isLoading: checklistsLoading } = useQuery({
    queryKey: ["admin-checklist-templates-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_checklist_templates")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("template_name");

      if (error) throw error;
      return (data || []) as AdminChecklistTemplate[];
    },
  });

  // Fetch routine templates from admin table
  const { data: routineTemplates = [], isLoading: routinesLoading } = useQuery({
    queryKey: ["admin-routine-templates-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_routine_templates")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("routine_name");

      if (error) throw error;
      return (data || []) as AdminRoutineTemplate[];
    },
  });

  // Fetch documents from admin table
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["admin-documents-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .order("category")
        .order("document_name");

      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("admin-documents")
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error("Error getting document URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    checklistTemplates,
    routineTemplates,
    documents,
    isLoading: checklistsLoading || routinesLoading || documentsLoading,
    getDocumentUrl,
  };
}
