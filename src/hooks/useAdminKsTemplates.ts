import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminChecklistTemplate {
  id: string;
  template_name: string;
  description: string | null;
  category: string;
  trade: string | null;
  checkpoints: Array<{ checkpoint_text: string; help_text: string }>;
  is_active: boolean;
  version: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_mandatory: boolean | null;
  is_locked: boolean | null;
  content_html: string | null;
  attached_pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRoutineTemplate {
  id: string;
  routine_name: string;
  description: string | null;
  category: string;
  content: string;
  file_path: string | null;
  is_active: boolean;
  version: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_mandatory: boolean | null;
  is_locked: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDocument {
  id: string;
  document_name: string;
  document_type: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by_name: string;
  version: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_mandatory: boolean | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export const CHECKLIST_CATEGORIES = [
  "Tømrerarbeid - Yttervegger",
  "Tømrerarbeid - Innvendige vegger",
  "Tømrerarbeid - Takstoler",
  "Tømrerarbeid - Gulv",
  "Tømrerarbeid - Himling",
  "Våtrom - Membran (NS 3600)",
  "Våtrom - Flislegging",
  "Våtrom - Rør og sluk",
  "Betongstøp - Gulv på grunn",
  "Betongstøp - Vegger",
  "Betongstøp - Dekker",
  "Betongstøp - Fundamenter",
  "Grunnarbeid - Drenering",
  "Grunnarbeid - Radonsperre",
  "Vinduer og dører",
  "Isolasjon - Yttervegger",
  "Isolasjon - Tak",
  "Lufttetthet",
  "Brannkrav",
  "Førprosjekt - Risiko",
  "Førprosjekt - Muligheter",
  "Sluttkontroll - Leilighet",
  "Sluttkontroll - Enebolig",
  "Sluttkontroll - Næring",
  "FDV-kontroll",
  "Overtakelse",
  "Underentreprenør - Gransking",
  "Underentreprenør - HMS",
  "Ansvarlig kontrollerende",
  "Generell egenkontroll",
];

export const ROUTINE_CATEGORIES = [
  "Kvalitetssikring - Generelt",
  "Ansvar og myndighet",
  "Underentreprenørkontroll",
  "Avvikshåndtering",
  "Dokumentstyring",
  "Kompetanse og opplæring",
  "Revisjon og forbedring",
  "HMS på byggeplass",
  "Materialmottak",
  "Prosjektering",
  "Utførelse",
  "Kontroll",
];

export const DOCUMENT_CATEGORIES = [
  "Samsvarserklæring",
  "Nabovarsel",
  "Søknadsskjema",
  "Kontrollskjema",
  "HMS-dokumenter",
  "Kontrakter",
  "FDV-maler",
  "Annet",
];

export const useAdminKsTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch checklist templates
  const { data: checklistTemplates = [], isLoading: isLoadingChecklists } = useQuery({
    queryKey: ["admin-checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_checklist_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return (data || []).map((t) => {
        let checkpoints: Array<{ checkpoint_text: string; help_text: string }> = [];
        try {
          const raw = Array.isArray(t.checkpoints) ? t.checkpoints : [];
          checkpoints = raw.map((c: any) => ({
            checkpoint_text: typeof c === "string" ? c : (c?.checkpoint_text || c?.text || c?.checkpoint || ""),
            help_text: typeof c === "string" ? "" : (c?.help_text || ""),
          }));
        } catch {
          checkpoints = [];
        }
        return { ...t, checkpoints } as AdminChecklistTemplate;
      });
    },
  });

  // Fetch routine templates
  const { data: routineTemplates = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["admin-routine-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_routine_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as AdminRoutineTemplate[];
    },
  });

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as AdminDocument[];
    },
  });

  // Create checklist template
  const createChecklistTemplate = useMutation({
    mutationFn: async (template: Partial<AdminChecklistTemplate>) => {
      const { data, error } = await supabase
        .from("admin_checklist_templates")
        .insert({
          template_name: template.template_name!,
          description: template.description,
          category: template.category || "Generell egenkontroll",
          trade: template.trade,
          checkpoints: template.checkpoints || [],
          is_active: template.is_active ?? true,
          version: template.version || "2025.1",
          valid_from: template.valid_from,
          valid_to: template.valid_to,
          is_mandatory: template.is_mandatory ?? false,
          is_locked: template.is_locked ?? false,
          content_html: template.content_html,
          attached_pdf_path: template.attached_pdf_path,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
      toast.success("Sjekkliste-mal opprettet");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke opprette mal", { description: error.message });
    },
  });

  // Update checklist template
  const updateChecklistTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminChecklistTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("admin_checklist_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
      toast.success("Sjekkliste-mal oppdatert");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke oppdatere mal", { description: error.message });
    },
  });

  // Delete checklist template
  const deleteChecklistTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_checklist_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
      toast.success("Sjekkliste-mal slettet");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke slette mal", { description: error.message });
    },
  });

  // Create routine template
  const createRoutineTemplate = useMutation({
    mutationFn: async (template: Partial<AdminRoutineTemplate>) => {
      const { data, error } = await supabase
        .from("admin_routine_templates")
        .insert({
          routine_name: template.routine_name!,
          description: template.description,
          category: template.category || "Kvalitetssikring - Generelt",
          content: template.content || "",
          file_path: template.file_path,
          is_active: template.is_active ?? true,
          version: template.version || "2025.1",
          valid_from: template.valid_from,
          valid_to: template.valid_to,
          is_mandatory: template.is_mandatory ?? false,
          is_locked: template.is_locked ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates"] });
      toast.success("Rutine-mal opprettet");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke opprette rutine", { description: error.message });
    },
  });

  // Update routine template
  const updateRoutineTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminRoutineTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("admin_routine_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates"] });
      toast.success("Rutine-mal oppdatert");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke oppdatere rutine", { description: error.message });
    },
  });

  // Delete routine template
  const deleteRoutineTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_routine_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates"] });
      toast.success("Rutine-mal slettet");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke slette rutine", { description: error.message });
    },
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      documentName,
      documentType,
      description,
      category,
      uploadedByName,
      isMandatory,
      version,
    }: {
      file: File;
      documentName: string;
      documentType: string;
      description?: string;
      category?: string;
      uploadedByName: string;
      isMandatory?: boolean;
      version?: string;
    }) => {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `admin/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("admin_documents")
        .insert({
          document_name: documentName,
          document_type: documentType,
          description,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by_name: uploadedByName,
          category: category || "Annet",
          is_mandatory: isMandatory ?? false,
          version: version || "2025.1",
          valid_from: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Dokument lastet opp");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke laste opp dokument", { description: error.message });
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from("admin-documents")
        .remove([filePath]);

      if (storageError) console.warn("Could not delete file from storage:", storageError);

      const { error } = await supabase
        .from("admin_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Dokument slettet");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke slette dokument", { description: error.message });
    },
  });

  // Get document URL
  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("admin-documents")
      .createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  };

  // Send notification for new version
  const sendVersionNotification = useMutation({
    mutationFn: async ({
      templateType,
      templateId,
      version,
      message,
      dueDate,
    }: {
      templateType: string;
      templateId: string;
      version: string;
      message: string;
      dueDate?: string;
    }) => {
      const { data, error } = await supabase
        .from("ks_module2_template_notifications")
        .insert({
          template_type: templateType,
          template_id: templateId,
          version,
          notification_message: message,
          due_date: dueDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Varsel sendt til alle kunder");
    },
    onError: (error: Error) => {
      toast.error("Kunne ikke sende varsel", { description: error.message });
    },
  });

  return {
    checklistTemplates,
    routineTemplates,
    documents,
    isLoading: isLoadingChecklists || isLoadingRoutines || isLoadingDocuments,
    createChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    createRoutineTemplate,
    updateRoutineTemplate,
    deleteRoutineTemplate,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    sendVersionNotification,
  };
};
