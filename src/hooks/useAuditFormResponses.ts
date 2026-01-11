import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type FormType = "annual_hms" | "elkontroll" | "fysiske_forhold" | "daglig_drift" | "vernerunde";

export interface AuditFormResponse {
  id: string;
  company_id: string;
  audit_id: string | null;
  form_type: FormType;
  form_data: Json;
  completed_at: string | null;
  completed_by_id: string | null;
  completed_by_name: string | null;
  revision_date: string | null;
  participants: string | null;
  auditor_name: string | null;
  manager_name: string | null;
  status: "draft" | "completed";
  created_at: string;
  updated_at: string;
}

export const formTypeLabels: Record<FormType, string> = {
  annual_hms: "Årlig HMS-revisjon",
  elkontroll: "El-Kontroll",
  fysiske_forhold: "Fysiske arbeidsforhold",
  daglig_drift: "Daglig drift",
  vernerunde: "Vernerunde",
};

export function useAuditFormResponses() {
  const { profile, user } = useAuth();
  const companyId = profile?.company_id;
  const departmentId = profile?.primary_department_id;
  const [responses, setResponses] = useState<AuditFormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchResponses = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("audit_form_responses")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResponses((data || []) as AuditFormResponse[]);
    } catch (error) {
      console.error("Error fetching audit form responses:", error);
      toast.error("Kunne ikke hente revisjonsskjema");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const getLatestByFormType = useCallback((formType: FormType) => {
    return responses
      .filter(r => r.form_type === formType && r.status === "completed")
      .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())[0];
  }, [responses]);

  const getDraftByFormType = useCallback((formType: FormType) => {
    return responses.find(r => r.form_type === formType && r.status === "draft");
  }, [responses]);

  const saveFormResponse = useCallback(
    async (
      formType: FormType,
      formData: Json,
      metadata: {
        revision_date?: string;
        participants?: string;
        auditor_name?: string;
        manager_name?: string;
      },
      status: "draft" | "completed" = "draft",
      existingId?: string
    ) => {
      if (!companyId) {
        toast.error("Ingen bedrift funnet");
        return null;
      }

      try {
        setIsSaving(true);

        const payload = {
          company_id: companyId,
          department_id: departmentId || null,
          form_type: formType,
          form_data: formData,
          revision_date: metadata.revision_date || null,
          participants: metadata.participants || null,
          auditor_name: metadata.auditor_name || null,
          manager_name: metadata.manager_name || null,
          status,
          completed_at: status === "completed" ? new Date().toISOString() : null,
          completed_by_id: status === "completed" ? profile?.id || null : null,
          completed_by_name: status === "completed" ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || null : null,
        };

        let result;
        if (existingId) {
          const { data, error } = await supabase
            .from("audit_form_responses")
            .update(payload)
            .eq("id", existingId)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from("audit_form_responses")
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        await fetchResponses();
        toast.success(status === "completed" ? "Skjema fullført og lagret" : "Skjema lagret som utkast");
        return result as AuditFormResponse;
      } catch (error) {
        console.error("Error saving audit form response:", error);
        toast.error("Kunne ikke lagre skjema");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [companyId, user?.id, profile, fetchResponses]
  );

  const deleteFormResponse = useCallback(
    async (id: string) => {
      try {
        setIsSaving(true);
        const { error } = await supabase
          .from("audit_form_responses")
          .delete()
          .eq("id", id);

        if (error) throw error;
        setResponses(prev => prev.filter(r => r.id !== id));
        toast.success("Skjema slettet");
      } catch (error) {
        console.error("Error deleting audit form response:", error);
        toast.error("Kunne ikke slette skjema");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Get completed forms for handbook
  const completedForms = responses.filter(r => r.status === "completed");

  return {
    responses,
    completedForms,
    isLoading,
    isSaving,
    getLatestByFormType,
    getDraftByFormType,
    saveFormResponse,
    deleteFormResponse,
    refetch: fetchResponses,
  };
}
