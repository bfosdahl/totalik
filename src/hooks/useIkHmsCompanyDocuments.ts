import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface IkHmsCompanyDocument {
  id: string;
  company_id: string;
  document_name: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_CATEGORIES = [
  "Arbeidsavtaler",
  "HMS-dokumenter",
  "Rutiner og prosedyrer",
  "Risikovurderinger",
  "Opplæring",
  "Sertifikater",
  "Forsikringer",
  "Generelt",
];

export const useIkHmsCompanyDocuments = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["ik-hms-company-documents", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("ik_hms_company_documents")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IkHmsCompanyDocument[];
    },
    enabled: !!companyId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentName,
      description,
      category,
      uploaderName,
    }: {
      file: File;
      documentName: string;
      description?: string;
      category: string;
      uploaderName: string;
    }) => {
      if (!companyId) throw new Error("Ingen bedrift valgt");

      // Sanitize filename
      const sanitizedFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[æÆ]/g, "ae")
        .replace(/[øØ]/g, "o")
        .replace(/[åÅ]/g, "a")
        .replace(/[^\w\s.-]/g, "")
        .replace(/\s+/g, "_");

      const timestamp = Date.now();
      const filePath = `${companyId}/${timestamp}_${sanitizedFileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("ik-hms-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error } = await supabase
        .from("ik_hms_company_documents")
        .insert({
          company_id: companyId,
          document_name: documentName,
          description,
          category,
          file_path: filePath,
          file_name: sanitizedFileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_by_name: uploaderName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-hms-company-documents", companyId] });
      toast.success("Dokument lastet opp");
    },
    onError: (error: Error) => {
      toast.error(`Kunne ikke laste opp: ${error.message}`);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: IkHmsCompanyDocument) => {
      // Delete from storage
      await supabase.storage
        .from("ik-hms-documents")
        .remove([doc.file_path]);

      // Delete from database
      const { error } = await supabase
        .from("ik_hms_company_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-hms-company-documents", companyId] });
      toast.success("Dokument slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette dokument");
    },
  });

  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("ik-hms-documents")
      .createSignedUrl(filePath, 3600);

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
