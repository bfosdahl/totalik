import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_TERMS_VERSION = "1.0";

export const useTermsAcceptance = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: hasAcceptedTerms, isLoading } = useQuery({
    queryKey: ["terms-acceptance", userId],
    queryFn: async () => {
      if (!userId) return true; // Don't block if no user

      const { data, error } = await supabase
        .from("user_terms_acceptance")
        .select("id")
        .eq("user_id", userId)
        .eq("terms_version", CURRENT_TERMS_VERSION)
        .maybeSingle();

      if (error) {
        console.error("Error checking terms acceptance:", error);
        return true; // Don't block on error
      }

      return !!data;
    },
    enabled: !!userId,
  });

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user ID");

      const { error } = await supabase.from("user_terms_acceptance").insert({
        user_id: userId,
        terms_version: CURRENT_TERMS_VERSION,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms-acceptance", userId] });
    },
  });

  return {
    hasAcceptedTerms: hasAcceptedTerms ?? true,
    isLoading,
    acceptTerms: acceptTermsMutation.mutateAsync,
    isAccepting: acceptTermsMutation.isPending,
  };
};
