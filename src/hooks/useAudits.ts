import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Audit {
  id: string;
  audit_number: string;
  title: string;
  type: "internal" | "external" | "routine";
  status: "scheduled" | "in-progress" | "completed" | "overdue";
  scheduled_date: string;
  area: string | null;
  responsible_id: string | null;
  responsible_name: string | null;
  description: string | null;
  checklist_total: number;
  checklist_completed: number;
  created_at: string;
  updated_at: string;
}

export interface NewAuditInput {
  title: string;
  type: "internal" | "external" | "routine";
  scheduled_date: string;
  area?: string;
  responsible_id?: string;
  responsible_name?: string;
  description?: string;
  checklist_total?: number;
}

export function useAudits() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const departmentId = profile?.primary_department_id;
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAudits = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setAudits((data || []) as Audit[]);
    } catch (error) {
      console.error("Error fetching audits:", error);
      toast.error("Kunne ikke hente revisjoner");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const getNextAuditNumber = useCallback(async (): Promise<string> => {
    if (!companyId) return "REV-001";

    const { data } = await supabase
      .from("audits")
      .select("audit_number")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].audit_number.replace("REV-", ""), 10);
      return `REV-${String(lastNumber + 1).padStart(3, "0")}`;
    }
    return "REV-001";
  }, [companyId]);

  const createAudit = useCallback(
    async (input: NewAuditInput) => {
      if (!companyId) {
        toast.error("Ingen bedrift funnet");
        return null;
      }

      try {
        setIsSaving(true);
        const auditNumber = await getNextAuditNumber();

        const { data, error } = await supabase
          .from("audits")
          .insert({
            company_id: companyId,
            department_id: departmentId || null,
            audit_number: auditNumber,
            title: input.title,
            type: input.type,
            scheduled_date: input.scheduled_date,
            area: input.area || null,
            responsible_id: input.responsible_id || null,
            responsible_name: input.responsible_name || null,
            description: input.description || null,
            checklist_total: input.checklist_total || 0,
            checklist_completed: 0,
          })
          .select()
          .single();

        if (error) throw error;

        await fetchAudits();
        toast.success("Revisjon opprettet");
        return data as Audit;
      } catch (error) {
        console.error("Error creating audit:", error);
        toast.error("Kunne ikke opprette revisjon");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [companyId, fetchAudits, getNextAuditNumber]
  );

  const updateAudit = useCallback(
    async (id: string, updates: Partial<Audit>) => {
      try {
        setIsSaving(true);
        const { error } = await supabase
          .from("audits")
          .update(updates)
          .eq("id", id);

        if (error) throw error;

        setAudits((prev) =>
          prev.map((audit) =>
            audit.id === id ? { ...audit, ...updates } : audit
          )
        );
        toast.success("Revisjon oppdatert");
      } catch (error) {
        console.error("Error updating audit:", error);
        toast.error("Kunne ikke oppdatere revisjon");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deleteAudit = useCallback(
    async (id: string) => {
      try {
        setIsSaving(true);
        const { error } = await supabase.from("audits").delete().eq("id", id);

        if (error) throw error;

        setAudits((prev) => prev.filter((audit) => audit.id !== id));
        toast.success("Revisjon slettet");
      } catch (error) {
        console.error("Error deleting audit:", error);
        toast.error("Kunne ikke slette revisjon");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Get upcoming audits (scheduled or in-progress, sorted by date)
  const upcomingAudits = audits.filter(
    (a) => a.status === "scheduled" || a.status === "in-progress"
  );

  return {
    audits,
    upcomingAudits,
    isLoading,
    isSaving,
    createAudit,
    updateAudit,
    deleteAudit,
    refetch: fetchAudits,
  };
}
