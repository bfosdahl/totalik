import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackSignature } from "@/utils/signatureMonitor";

export interface TrainingRecord {
  id: string;
  company_id: string;
  employee_user_id: string | null;
  employee_name: string;
  training_topic: string;
  training_description: string | null;
  signed_at: string | null;
  signature_data: string | null;
  signed_digitally: boolean;
  created_at: string;
  updated_at: string;
}

export function useIkAlkoholTraining() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: trainingRecords = [], isLoading } = useQuery({
    queryKey: ["ik-alkohol-training", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_training_records")
        .select("*")
        .eq("company_id", companyId)
        .order("employee_name");
      if (error) throw error;
      return data as TrainingRecord[];
    },
    enabled: !!companyId,
  });

  const createRecord = useMutation({
    mutationFn: async (record: {
      employee_user_id?: string | null;
      employee_name: string;
      training_topic?: string;
      training_description?: string;
    }) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("ik_alkohol_training_records")
        .insert({ company_id: companyId, ...record } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast.success("Opplæringsregistrering opprettet");
    },
    onError: () => toast.error("Kunne ikke opprette registrering"),
  });

  const signRecord = useMutation({
    mutationFn: async ({ id, signature_data }: { id: string; signature_data?: string }) => {
      return trackSignature(
        { entityType: "ik_alkohol_training", entityId: id, signerRole: "employee" },
        async () => {
          const { error } = await supabase
            .from("ik_alkohol_training_records")
            .update({
              signed_at: new Date().toISOString(),
              signed_digitally: true,
              signature_data: signature_data || null,
            } as any)
            .eq("id", id);
          if (error) throw error;
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast.success("Opplæring signert");
    },
    onError: () => toast.error("Kunne ikke signere"),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_alkohol_training_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-training"] });
      toast.success("Registrering slettet");
    },
    onError: () => toast.error("Kunne ikke slette"),
  });

  return {
    trainingRecords,
    isLoading,
    createRecord,
    signRecord,
    deleteRecord,
  };
}
