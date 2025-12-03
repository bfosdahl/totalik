import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KsModule2DocumentTemplate {
  id: string;
  company_id: string | null;
  title: string;
  category: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  version: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_system_template: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useKsModule2DocumentTemplates = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["ks-module2-document-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_module2_document_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KsModule2DocumentTemplate[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      title,
      category,
      description,
      isSystemTemplate = false,
    }: {
      file: File;
      title: string;
      category: string;
      description?: string;
      isSystemTemplate?: boolean;
    }) => {
      // Sanitize filename
      const sanitizedFileName = file.name
        .replace(/[^\w\s.-æøåÆØÅ]/g, "")
        .replace(/\s+/g, "_");
      
      const timestamp = Date.now();
      const filePath = `document-templates/${timestamp}_${sanitizedFileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("ks-module2-documents")
        .upload(filePath, file);

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes("Bucket not found")) {
          throw new Error("Storage bucket ikke konfigurert. Kontakt administrator.");
        }
        throw uploadError;
      }

      // Create database record
      const { data, error } = await supabase
        .from("ks_module2_document_templates")
        .insert({
          title,
          category,
          description,
          file_path: filePath,
          file_name: sanitizedFileName,
          file_type: file.type,
          file_size: file.size,
          is_system_template: isSystemTemplate,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-document-templates"] });
      toast.success("Dokument lastet opp");
    },
    onError: (error: Error) => {
      toast.error(`Kunne ikke laste opp: ${error.message}`);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: KsModule2DocumentTemplate) => {
      // Delete from storage
      await supabase.storage
        .from("ks-module2-documents")
        .remove([doc.file_path]);

      // Delete from database
      const { error } = await supabase
        .from("ks_module2_document_templates")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-document-templates"] });
      toast.success("Dokument slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette dokument");
    },
  });

  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("ks-module2-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      toast.error("Kunne ikke generere nedlastingslenke");
      return null;
    }
    return data.signedUrl;
  };

  return {
    documents,
    isLoading,
    uploadDocument: uploadDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    getDownloadUrl,
    isUploading: uploadDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
};
