import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Finding {
  id: string;
  description: string;
  location: string;
  severity: "low" | "medium" | "high";
  status: "open" | "closed";
  responsible?: string;
  deadline?: string;
  closedDate?: string;
}

export interface KsModule2Vernerunde {
  id: string;
  project_id: string;
  company_id: string;
  vernerunde_number: string;
  title: string;
  scheduled_date: string;
  completed_date: string | null;
  responsible_name: string;
  responsible_id: string | null;
  participants: string[] | null;
  status: string;
  findings: Finding[];
  notes: string | null;
  completed_by_name: string | null;
  completed_by_id: string | null;
  signature_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVernerundeInput {
  project_id: string;
  title: string;
  scheduled_date: string;
  responsible_name: string;
  responsible_id?: string;
  participants?: string[];
  notes?: string;
}

export function useKsModule2Vernerunder(projectId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: vernerunder = [], isLoading, refetch } = useQuery({
    queryKey: ["ks-module2-vernerunder", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_vernerunder")
        .select("*")
        .eq("project_id", projectId)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        findings: Array.isArray(item.findings) ? item.findings as unknown as Finding[] : [],
      })) as KsModule2Vernerunde[];
    },
    enabled: !!projectId,
  });

  const createVernerunde = useMutation({
    mutationFn: async (input: CreateVernerundeInput) => {
      if (!profile?.company_id) throw new Error("Ingen bedrift funnet");

      // Get next number
      const { data: existing } = await supabase
        .from("ks_module2_vernerunder")
        .select("vernerunde_number")
        .eq("project_id", input.project_id)
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existing && existing.length > 0) {
        const lastNum = parseInt(existing[0].vernerunde_number.replace("VR-", "")) || 0;
        nextNumber = lastNum + 1;
      }

      const { data, error } = await supabase
        .from("ks_module2_vernerunder")
        .insert({
          ...input,
          company_id: profile.company_id,
          vernerunde_number: `VR-${String(nextNumber).padStart(3, "0")}`,
          status: "planned",
          findings: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-vernerunder", projectId] });
      toast.success("Vernerunde planlagt");
    },
    onError: (error) => {
      console.error("Error creating vernerunde:", error);
      toast.error("Kunne ikke opprette vernerunde");
    },
  });

  const updateVernerunde = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2Vernerunde> & { id: string }) => {
      const { findings: findingsUpdate, ...restUpdates } = updates;
      const updatePayload = findingsUpdate 
        ? { ...restUpdates, findings: JSON.parse(JSON.stringify(findingsUpdate)) as Json }
        : restUpdates;
      
      const { data, error } = await supabase
        .from("ks_module2_vernerunder")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-vernerunder", projectId] });
      toast.success("Vernerunde oppdatert");
    },
    onError: (error) => {
      console.error("Error updating vernerunde:", error);
      toast.error("Kunne ikke oppdatere vernerunde");
    },
  });

  const deleteVernerunde = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_vernerunder")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-vernerunder", projectId] });
      toast.success("Vernerunde slettet");
    },
    onError: (error) => {
      console.error("Error deleting vernerunde:", error);
      toast.error("Kunne ikke slette vernerunde");
    },
  });

  const completeVernerunde = useMutation({
    mutationFn: async ({ id, findings, signature_data }: { id: string; findings?: Finding[]; signature_data?: string }) => {
      const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined;
      
      const { data, error } = await supabase
        .from("ks_module2_vernerunder")
        .update({
          status: "completed",
          completed_date: new Date().toISOString().split('T')[0],
          completed_by_name: fullName,
          completed_by_id: profile?.id,
          findings: JSON.parse(JSON.stringify(findings || [])) as Json,
          signature_data,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-vernerunder", projectId] });
      toast.success("Vernerunde fullført");
    },
    onError: (error) => {
      console.error("Error completing vernerunde:", error);
      toast.error("Kunne ikke fullføre vernerunde");
    },
  });

  return {
    vernerunder,
    isLoading,
    refetch,
    createVernerunde,
    updateVernerunde,
    deleteVernerunde,
    completeVernerunde,
  };
}
