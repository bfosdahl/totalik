import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const WELCOME_TERMS_VERSION = "velkomstpakke-1.0";

interface WelcomePackageInfo {
  isWelcomePackage: boolean;
  trialEndsOn: string | null;
  startedOn: string | null;
  packageType: string | null;
  hasAccepted: boolean;
}

/**
 * Velkomstpakke-kunder (6 mnd gratis) må godkjenne egne vilkår ved innlogging,
 * slik at bindings- og oppsigelsesvilkårene er dokumentert.
 */
export const useWelcomePackageTerms = (
  userId: string | undefined,
  companyId: string | null | undefined,
) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<WelcomePackageInfo>({
    queryKey: ["welcome-package-terms", userId, companyId],
    queryFn: async () => {
      const empty: WelcomePackageInfo = {
        isWelcomePackage: false,
        trialEndsOn: null,
        startedOn: null,
        packageType: null,
        hasAccepted: true,
      };
      if (!userId || !companyId) return empty;

      const { data: company, error } = await supabase
        .from("companies")
        .select("welcome_package, welcome_package_type, welcome_package_started_on, trial_ends_on")
        .eq("id", companyId)
        .maybeSingle();

      if (error || !company || !(company as Record<string, unknown>).welcome_package) return empty;

      const { data: accepted } = await supabase
        .from("user_terms_acceptance")
        .select("id")
        .eq("user_id", userId)
        .eq("terms_version", WELCOME_TERMS_VERSION)
        .maybeSingle();

      const c = company as Record<string, unknown>;
      return {
        isWelcomePackage: true,
        trialEndsOn: (c.trial_ends_on as string) ?? null,
        startedOn: (c.welcome_package_started_on as string) ?? null,
        packageType: (c.welcome_package_type as string) ?? null,
        hasAccepted: !!accepted,
      };
    },
    enabled: !!userId && !!companyId,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user ID");
      const { error } = await supabase.from("user_terms_acceptance").insert({
        user_id: userId,
        terms_version: WELCOME_TERMS_VERSION,
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-package-terms", userId, companyId] });
    },
  });

  return {
    info: data,
    isLoading,
    needsAcceptance: !!data?.isWelcomePackage && !data.hasAccepted,
    acceptTerms: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
  };
};
