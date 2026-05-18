import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ModuleDocumentType = "ik-mat" | "ik-alkohol" | "ik-hms";

export interface CompanyModuleDocument {
  id: string;
  company_id: string;
  module_type: ModuleDocumentType;
  folder_name: string | null;
  document_name: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export function useCompanyModuleDocuments(moduleType: ModuleDocumentType) {
  const queryClient = useQueryClient();
  const { company, profile } = useAuth();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["company-module-documents", company?.id, moduleType],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("company_module_documents")
        .select("*")
        .eq("company_id", company.id)
        .eq("module_type", moduleType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CompanyModuleDocument[];
    },
    enabled: !!company?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentName,
      description,
      folderName,
    }: {
      file: File;
      documentName: string;
      description?: string;
      folderName?: string;
    }) => {
      if (!company?.id || !profile) throw new Error("Ikke autentisert");

      // Sanitize filename
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/æ/gi, "ae")
        .replace(/ø/gi, "o")
        .replace(/å/gi, "a")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      const filePath = `${company.id}/${moduleType}/${Date.now()}_${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("company-module-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert into database
      const { data, error: dbError } = await supabase
        .from("company_module_documents")
        .insert({
          company_id: company.id,
          module_type: moduleType,
          document_name: documentName,
          description: description || null,
          folder_name: folderName || null,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by_id: profile.id,
          uploaded_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      toast.success("Dokument lastet opp");
      queryClient.invalidateQueries({ queryKey: ["company-module-documents", company?.id, moduleType] });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokument");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: CompanyModuleDocument) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("company-module-documents")
        .remove([document.file_path]);

      if (storageError) console.error("Storage delete error:", storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from("company_module_documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Dokument slettet");
      queryClient.invalidateQueries({ queryKey: ["company-module-documents", company?.id, moduleType] });
    },
    onError: () => {
      toast.error("Kunne ikke slette dokument");
    },
  });

  const moveDocument = useMutation({
    mutationFn: async ({ id, folderName }: { id: string; folderName: string | null }) => {
      const { error } = await supabase
        .from("company_module_documents")
        .update({ folder_name: folderName })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dokument flyttet");
      queryClient.invalidateQueries({ queryKey: ["company-module-documents", company?.id, moduleType] });
    },
    onError: () => {
      toast.error("Kunne ikke flytte dokument");
    },
  });

  // Delete an entire folder path (and all subfolders) – removes every document inside.
  const deleteFolder = useMutation({
    mutationFn: async (folderPath: string) => {
      const affected = documents.filter(
        (d) => d.folder_name === folderPath || (d.folder_name?.startsWith(folderPath + "/") ?? false)
      );
      if (affected.length > 0) {
        const paths = affected.map((d) => d.file_path);
        const { error: storageError } = await supabase.storage
          .from("company-module-documents")
          .remove(paths);
        if (storageError) console.error("Storage delete error:", storageError);

        const { error: dbError } = await supabase
          .from("company_module_documents")
          .delete()
          .in("id", affected.map((d) => d.id));
        if (dbError) throw dbError;
      }
      return affected.length;
    },
    onSuccess: (count) => {
      toast.success(count > 0 ? `Mappe slettet (${count} dokument${count === 1 ? "" : "er"})` : "Mappe slettet");
      queryClient.invalidateQueries({ queryKey: ["company-module-documents", company?.id, moduleType] });
    },
    onError: () => {
      toast.error("Kunne ikke slette mappe");
    },
  });

  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("company-module-documents")
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting download URL:", error);
      return null;
    }
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    moveDocument,
    deleteFolder,
    getDownloadUrl,
  };
}
