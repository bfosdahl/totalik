import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CompanyKsDocument {
  id: string;
  company_id: string;
  document_name: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  folder_id: string | null;
  project_id: string | null;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    project_name: string;
  } | null;
}

export interface CompanyKsDocumentFolder {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  parent_folder_id: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCompanyKsDocuments() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const [documents, setDocuments] = useState<CompanyKsDocument[]>([]);
  const [folders, setFolders] = useState<CompanyKsDocumentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        supabase
          .from("company_ks_documents")
          .select(`
            *,
            project:ks_module2_projects(id, project_name)
          `)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("company_ks_document_folders")
          .select("*")
          .eq("company_id", companyId)
          .order("sort_order", { ascending: true }),
      ]);

      if (docsRes.error) throw docsRes.error;
      if (foldersRes.error) throw foldersRes.error;
      
      setDocuments(docsRes.data || []);
      setFolders(foldersRes.data || []);
    } catch (error) {
      console.error("Error fetching KS documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    file: File,
    options: {
      documentName?: string;
      description?: string;
      folderId?: string;
      projectId?: string;
      isTemplate?: boolean;
    } = {}
  ) => {
    if (!companyId || !profile) return null;
    
    setIsSaving(true);
    try {
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/æ/gi, "ae")
        .replace(/ø/gi, "o")
        .replace(/å/gi, "a")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${companyId}/ks-documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      const { data, error } = await supabase
        .from("company_ks_documents")
        .insert({
          company_id: companyId,
          document_name: options.documentName || file.name,
          description: options.description || null,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          folder_id: options.folderId || null,
          project_id: options.projectId || null,
          uploaded_by_id: profile.id,
          uploaded_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          is_template: options.isTemplate || false,
        })
        .select(`
          *,
          project:ks_module2_projects(id, project_name)
        `)
        .single();

      if (error) throw error;
      
      setDocuments(prev => [data, ...prev]);
      toast({ title: "Dokument lastet opp" });
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({ title: "Kunne ikke laste opp dokument", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDocument = async (id: string, updates: Partial<CompanyKsDocument>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_documents")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      toast({ title: "Dokument oppdatert" });
    } catch (error) {
      console.error("Error updating document:", error);
      toast({ title: "Kunne ikke oppdatere dokument", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    setIsSaving(true);
    try {
      // Delete from storage
      await supabase.storage
        .from("company-documents")
        .remove([doc.file_path]);
      
      // Delete from database
      const { error } = await supabase
        .from("company_ks_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast({ title: "Dokument slettet" });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({ title: "Kunne ikke slette dokument", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("company-documents")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  };

  // Folder operations
  const createFolder = async (name: string, parentFolderId?: string, color?: string) => {
    if (!companyId) return null;
    
    setIsSaving(true);
    try {
      const maxOrder = folders.length > 0 
        ? Math.max(...folders.map(f => f.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("company_ks_document_folders")
        .insert({
          company_id: companyId,
          name,
          parent_folder_id: parentFolderId || null,
          color: color || null,
          sort_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [...prev, data]);
      toast({ title: "Mappe opprettet" });
      return data;
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({ title: "Kunne ikke opprette mappe", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateFolder = async (id: string, updates: Partial<CompanyKsDocumentFolder>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_document_folders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      toast({ title: "Mappe oppdatert" });
    } catch (error) {
      console.error("Error updating folder:", error);
      toast({ title: "Kunne ikke oppdatere mappe", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFolder = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_document_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setFolders(prev => prev.filter(f => f.id !== id));
      // Reset folder_id on documents in this folder
      setDocuments(prev => prev.map(d => 
        d.folder_id === id ? { ...d, folder_id: null } : d
      ));
      toast({ title: "Mappe slettet" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({ title: "Kunne ikke slette mappe", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get documents by folder
  const getDocumentsByFolder = (folderId: string | null) => {
    return documents.filter(d => d.folder_id === folderId);
  };

  // Helper to get documents by project
  const getDocumentsByProject = (projectId: string) => {
    return documents.filter(d => d.project_id === projectId);
  };

  return {
    documents,
    folders,
    isLoading,
    isSaving,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
    createFolder,
    updateFolder,
    deleteFolder,
    getDocumentsByFolder,
    getDocumentsByProject,
    refetch: fetchDocuments,
  };
}
