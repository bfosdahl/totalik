import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsProjectDocument {
  id: string;
  project_id: string;
  company_id: string;
  document_name: string;
  document_number: string | null;
  category: 'tegninger' | 'beskrivelser' | 'sha_plan' | 'bilder' | 'endringsmeldinger' | 'fdv' | 'samsvar';
  version: number;
  is_latest_version: boolean;
  supersedes_document_id: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface NewKsProjectDocumentInput {
  document_name: string;
  document_number?: string;
  category: KsProjectDocument['category'];
  description?: string;
  file: File;
  supersedes_document_id?: string;
}

export const useKsProjectDocuments = (projectId: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['ks-project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ks_project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('version', { ascending: false });

      if (error) throw error;
      return data as KsProjectDocument[];
    },
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: NewKsProjectDocumentInput) => {
      if (!profile?.company_id) throw new Error("Ingen bedrift funnet");

      // Upload file to storage
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${projectId}/${input.category}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, input.file);

      if (uploadError) throw uploadError;

      // Determine version number
      let version = 1;
      if (input.supersedes_document_id) {
        // Get the version of the document being superseded
        const { data: oldDoc } = await supabase
          .from('ks_project_documents')
          .select('version')
          .eq('id', input.supersedes_document_id)
          .single();
        
        if (oldDoc) {
          version = oldDoc.version + 1;
          
          // Mark old document as not latest
          await supabase
            .from('ks_project_documents')
            .update({ is_latest_version: false })
            .eq('id', input.supersedes_document_id);
        }
      }

      // Create document record
      const { data, error } = await supabase
        .from('ks_project_documents')
        .insert({
          project_id: projectId,
          company_id: profile.company_id,
          document_name: input.document_name,
          document_number: input.document_number || null,
          category: input.category,
          version,
          is_latest_version: true,
          supersedes_document_id: input.supersedes_document_id || null,
          file_path: fileName,
          file_name: input.file.name,
          file_size: input.file.size,
          file_type: input.file.type,
          description: input.description || null,
          uploaded_by: profile.id,
          uploaded_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-project-documents', projectId] });
      toast.success("Dokument lastet opp");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error("Kunne ikke laste opp dokument");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get document info first
      const { data: doc } = await supabase
        .from('ks_project_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (!doc) throw new Error("Dokument ikke funnet");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('ks_project_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-project-documents', projectId] });
      toast.success("Dokument slettet");
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error("Kunne ikke slette dokument");
    },
  });

  const downloadDocument = async (document: KsProjectDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dokument lastet ned");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Kunne ikke laste ned dokument");
    }
  };

  return {
    documents: documents || [],
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    downloadDocument,
  };
};
