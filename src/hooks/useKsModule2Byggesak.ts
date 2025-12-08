import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Byggesak {
  id: string;
  project_id: string;
  company_id: string;
  case_number: string | null;
  municipality: string | null;
  gnr: string | null;
  bnr: string | null;
  fnr: string | null;
  snr: string | null;
  property_address: string | null;
  building_type: string | null;
  tiltaksklasse: string;
  application_type: string | null;
  søker_role: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ByggesakForm {
  id: string;
  byggesak_id: string;
  project_id: string;
  company_id: string;
  template_id: string | null;
  form_number: string;
  form_name: string;
  form_category: string;
  status: string;
  form_data: Record<string, unknown>;
  signature_data: Record<string, unknown> | null;
  signed_by_name: string | null;
  signed_at: string | null;
  pdf_file_path: string | null;
  uploaded_file_path: string | null;
  sent_to: string | null;
  sent_at: string | null;
  notes: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ByggesakTemplate {
  id: string;
  form_number: string;
  form_name: string;
  form_category: string;
  description: string | null;
  version: string | null;
  language: string;
  pdf_file_path: string | null;
  is_active: boolean;
  sort_order: number;
  required_fields: string[];
}

export function useByggesakTemplates() {
  return useQuery({
    queryKey: ["byggesak-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_byggesak_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as ByggesakTemplate[];
    },
  });
}

export function useProjectByggesak(projectId: string) {
  return useQuery({
    queryKey: ["project-byggesak", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_module2_byggesak")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as Byggesak | null;
    },
    enabled: !!projectId,
  });
}

export function useByggesakForms(byggesakId: string | undefined) {
  return useQuery({
    queryKey: ["byggesak-forms", byggesakId],
    queryFn: async () => {
      if (!byggesakId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_byggesak_forms")
        .select("*")
        .eq("byggesak_id", byggesakId)
        .order("form_category", { ascending: true });

      if (error) throw error;
      return data as ByggesakForm[];
    },
    enabled: !!byggesakId,
  });
}

export function useCreateByggesak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Byggesak>) => {
      const { data: result, error } = await supabase
        .from("ks_module2_byggesak")
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-byggesak", variables.project_id] });
      toast.success("Byggesak opprettet");
    },
    onError: (error) => {
      console.error("Error creating byggesak:", error);
      toast.error("Kunne ikke opprette byggesak");
    },
  });
}

export function useUpdateByggesak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Byggesak> & { id: string }) => {
      const { error } = await supabase
        .from("ks_module2_byggesak")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-byggesak"] });
      toast.success("Byggesak oppdatert");
    },
    onError: (error) => {
      console.error("Error updating byggesak:", error);
      toast.error("Kunne ikke oppdatere byggesak");
    },
  });
}

export function useCreateByggesakForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Partial<ByggesakForm>, 'form_data'> & { form_data?: Record<string, unknown> }) => {
      const { data: result, error } = await supabase
        .from("ks_module2_byggesak_forms")
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["byggesak-forms", variables.byggesak_id] });
      toast.success("Blankett opprettet");
    },
    onError: (error) => {
      console.error("Error creating form:", error);
      toast.error("Kunne ikke opprette blankett");
    },
  });
}

export function useUpdateByggesakForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("ks_module2_byggesak_forms")
        .update(data as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["byggesak-forms"] });
      toast.success("Blankett oppdatert");
    },
    onError: (error) => {
      console.error("Error updating form:", error);
      toast.error("Kunne ikke oppdatere blankett");
    },
  });
}

export function useInitializeByggesak(projectId: string, companyId: string) {
  const createByggesak = useCreateByggesak();
  const createForm = useCreateByggesakForm();
  const { data: templates } = useByggesakTemplates();

  const initialize = async () => {
    // Create the byggesak
    const byggesak = await createByggesak.mutateAsync({
      project_id: projectId,
      company_id: companyId,
      status: "not_started",
    });

    // Create default forms from templates
    if (templates && byggesak) {
      const defaultForms = templates.filter(t => 
        ["5154", "5181", "5185", "5167"].includes(t.form_number)
      );

      for (const template of defaultForms) {
        await createForm.mutateAsync({
          byggesak_id: byggesak.id,
          project_id: projectId,
          company_id: companyId,
          template_id: template.id,
          form_number: template.form_number,
          form_name: template.form_name,
          form_category: template.form_category,
          status: "not_started",
          form_data: {},
        });
      }
    }

    return byggesak;
  };

  return { initialize, isLoading: createByggesak.isPending };
}
