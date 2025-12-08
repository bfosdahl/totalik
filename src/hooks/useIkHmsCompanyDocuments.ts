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

// IK-HMS folder categories matching admin structure
export const IK_HMS_CATEGORIES = [
  {
    id: "1",
    name: "Grunnlag & Policy",
    subfolders: ["HMS-policy", "Visjon og mål", "Organisasjonskart"],
    icon: "Shield",
    color: "bg-blue-500"
  },
  {
    id: "2", 
    name: "Verneombud",
    subfolders: ["Avtale om verneombud", "Avtale om fritak for verneombud", "Vernerunde sjekkliste (papir)", "Årsrapport verneombud"],
    icon: "UserCheck",
    color: "bg-emerald-500"
  },
  {
    id: "3",
    name: "Risiko & SJA",
    subfolders: ["SJA-mal papir", "Risikovurdering papir", "Fareidentifikasjon"],
    icon: "AlertTriangle",
    color: "bg-amber-500"
  },
  {
    id: "4",
    name: "Rutiner",
    subfolders: ["Avviksskjema", "Skademelding", "Nestenulykke-melding", "Fraværsskjema"],
    icon: "ClipboardList",
    color: "bg-purple-500"
  },
  {
    id: "5",
    name: "Opplæring & Kurs",
    subfolders: ["Arbeidsavtale mal", "Medarbeidersamtale mal", "Kursbevis mal", "Kompetanseoversikt"],
    icon: "GraduationCap",
    color: "bg-indigo-500"
  },
  {
    id: "6",
    name: "Stoffkartotek",
    subfolders: ["Kjemikalieliste mal", "Sikkerhetsdatablad – blank"],
    icon: "FlaskConical",
    color: "bg-rose-500"
  },
  {
    id: "7",
    name: "Beredskap & Førstehjelp",
    subfolders: ["Beredskapsplan mal", "Branninstruks", "Førstehjelpsinstruks"],
    icon: "HeartPulse",
    color: "bg-red-500"
  },
  {
    id: "8",
    name: "Diverse & Egendefinerte",
    subfolders: [],
    icon: "FolderPlus",
    color: "bg-slate-500"
  }
];

// Flat list for dropdowns
export const DOCUMENT_CATEGORIES = [
  "Grunnlag & Policy",
  "Verneombud",
  "Risiko & SJA",
  "Rutiner",
  "Opplæring & Kurs",
  "Stoffkartotek",
  "Beredskap & Førstehjelp",
  "Diverse & Egendefinerte",
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
