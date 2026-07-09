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
  industries?: string[];

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
  folder_id: string | null;
}

export interface AdminDocumentFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_folder_id: string | null;
  sort_order: number | null;
  module_type: string | null;
  created_at: string;
}

export type ModuleType = 'ik-hms' | 'ik-mat' | 'ks-bygg';

export function useAdminTemplatesForCustomers(moduleType?: ModuleType) {
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

  // Fetch document folders from admin table filtered by module type
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["admin-document-folders-customer", moduleType],
    queryFn: async () => {
      let query = supabase
        .from("admin_document_folders")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name");

      if (moduleType) {
        query = query.eq("module_type", moduleType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminDocumentFolder[];
    },
  });

  // Fetch documents from admin table filtered by folders in the selected module
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["admin-documents-customer", moduleType, folders],
    queryFn: async () => {
      if (moduleType && folders.length === 0) {
        return [] as AdminDocument[];
      }

      let query = supabase
        .from("admin_documents")
        .select("*")
        .order("document_name");

      if (moduleType) {
        const folderIds = folders.map(f => f.id);
        if (folderIds.length > 0) {
          query = query.in("folder_id", folderIds);
        } else {
          return [] as AdminDocument[];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
    enabled: !moduleType || folders.length > 0 || !foldersLoading,
  });

  // Build folder tree
  const getFolderTree = (): (AdminDocumentFolder & { children: AdminDocumentFolder[] })[] => {
    const rootFolders = folders.filter(f => !f.parent_folder_id);
    return rootFolders.map(folder => ({
      ...folder,
      children: folders.filter(f => f.parent_folder_id === folder.id),
    }));
  };

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
    folders,
    folderTree: getFolderTree(),
    isLoading: checklistsLoading || routinesLoading || documentsLoading || foldersLoading,
    getDocumentUrl,
  };
}
