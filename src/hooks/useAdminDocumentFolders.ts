import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminDocumentFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  parent_folder_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useAdminDocumentFolders() {
  const queryClient = useQueryClient();

  const { data: folders, isLoading } = useQuery({
    queryKey: ["admin-document-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_document_folders")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as AdminDocumentFolder[];
    },
  });

  const createFolder = useMutation({
    mutationFn: async (folder: Omit<AdminDocumentFolder, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("admin_document_folders")
        .insert(folder)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Mappe opprettet");
      queryClient.invalidateQueries({ queryKey: ["admin-document-folders"] });
    },
    onError: () => {
      toast.error("Kunne ikke opprette mappe");
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminDocumentFolder> & { id: string }) => {
      const { data, error } = await supabase
        .from("admin_document_folders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Mappe oppdatert");
      queryClient.invalidateQueries({ queryKey: ["admin-document-folders"] });
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere mappe");
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_document_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mappe slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-document-folders"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette mappe");
    },
  });

  const reorderFolders = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from("admin_document_folders")
          .update({ sort_order: index })
          .eq("id", id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-document-folders"] });
    },
  });

  // Get folders organized as tree structure
  const getFolderTree = () => {
    if (!folders) return [];
    
    const rootFolders = folders.filter(f => !f.parent_folder_id);
    const getChildren = (parentId: string): AdminDocumentFolder[] => {
      return folders.filter(f => f.parent_folder_id === parentId);
    };

    return rootFolders.map(folder => ({
      ...folder,
      children: getChildren(folder.id),
    }));
  };

  return {
    folders,
    folderTree: getFolderTree(),
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
  };
}
