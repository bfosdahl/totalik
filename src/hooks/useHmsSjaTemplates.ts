import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SjaTemplateRow {
  id: string;
  activity: string;
  risk: string;
  measure: string;
}

export interface SjaTemplate {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  rows: SjaTemplateRow[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useHmsSjaTemplates() {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["hms-sja-templates", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("hms_sja_templates")
        .select("*")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        rows: (t.rows as SjaTemplateRow[]) || [],
      })) as SjaTemplate[];
    },
    enabled: !!company?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; description?: string; rows: SjaTemplateRow[] }) => {
      if (!company?.id) throw new Error("Ingen bedrift");
      const { data, error } = await supabase
        .from("hms_sja_templates")
        .insert([{
          company_id: company.id,
          name: input.name,
          description: input.description || null,
          rows: input.rows as any,
          created_by: user?.id || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja-templates", company?.id] });
      toast.success("SJA-mal lagret");
    },
    onError: (e: any) => toast.error("Kunne ikke lagre mal: " + e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hms_sja_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja-templates", company?.id] });
      toast.success("Mal slettet");
    },
  });

  return { templates, isLoading, createTemplate, deleteTemplate };
}
