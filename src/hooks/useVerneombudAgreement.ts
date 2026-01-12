import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export interface VerneombudAgreement {
  id: string;
  company_id: string;
  verneombud_name: string;
  verneombud_email: string | null;
  verneombud_phone: string | null;
  election_date: string | null;
  election_method: string | null;
  term_start: string | null;
  term_end: string | null;
  verneombud_signature: string | null;
  verneombud_signed_at: string | null;
  employer_name: string | null;
  employer_signature: string | null;
  employer_signed_at: string | null;
  training_completed: boolean | null;
  training_date: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useVerneombudAgreement() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: verneombudAgreement, isLoading } = useQuery({
    queryKey: ["verneombud-agreement", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("verneombud_agreements")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching verneombud agreement:", error);
        return null;
      }
      return data as VerneombudAgreement | null;
    },
    enabled: !!companyId,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["verneombud-agreement", companyId] });
  }, [queryClient, companyId]);

  return {
    verneombudAgreement,
    isLoading,
    hasVerneombudAgreement: !!verneombudAgreement,
    refetch,
  };
}
