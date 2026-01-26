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

export interface VerneombudFromProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

export function useVerneombudAgreement() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  // Fetch formal verneombud agreement
  const { data: verneombudAgreement, isLoading: isLoadingAgreement } = useQuery({
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

  // Fetch verneombud from profiles (set via Organisering page or AI setup)
  const { data: verneombudFromProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["verneombud-profile", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email, phone")
        .eq("company_id", companyId)
        .eq("is_verneombud", true)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching verneombud from profile:", error);
        return null;
      }
      return data as VerneombudFromProfile | null;
    },
    enabled: !!companyId,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["verneombud-agreement", companyId] });
    queryClient.invalidateQueries({ queryKey: ["verneombud-profile", companyId] });
  }, [queryClient, companyId]);

  // Consider having a verneombud if either there's a formal agreement OR someone marked as verneombud in profiles
  const hasVerneombudAgreement = !!verneombudAgreement;
  const hasVerneombudFromProfile = !!verneombudFromProfile;
  const hasAnyVerneombud = hasVerneombudAgreement || hasVerneombudFromProfile;

  return {
    verneombudAgreement,
    verneombudFromProfile,
    isLoading: isLoadingAgreement || isLoadingProfile,
    hasVerneombudAgreement,
    hasVerneombudFromProfile,
    hasAnyVerneombud,
    refetch,
  };
}
