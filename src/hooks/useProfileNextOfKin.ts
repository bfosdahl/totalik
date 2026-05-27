import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NextOfKin {
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  next_of_kin_relation: string | null;
}

export function useProfileNextOfKin(profileId: string | undefined) {
  return useQuery({
    queryKey: ["profile-next-of-kin", profileId],
    queryFn: async (): Promise<NextOfKin> => {
      if (!profileId) return { next_of_kin_name: null, next_of_kin_phone: null, next_of_kin_relation: null };
      const { data, error } = await supabase
        .from("profiles_next_of_kin")
        .select("next_of_kin_name, next_of_kin_phone, next_of_kin_relation")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data ?? { next_of_kin_name: null, next_of_kin_phone: null, next_of_kin_relation: null };
    },
    enabled: !!profileId,
  });
}

export function useUpdateProfileNextOfKin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { profileId: string; companyId: string } & NextOfKin) => {
      const { profileId, companyId, ...nok } = params;
      const { error } = await supabase
        .from("profiles_next_of_kin")
        .upsert(
          { profile_id: profileId, company_id: companyId, ...nok },
          { onConflict: "profile_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["profile-next-of-kin", vars.profileId] });
    },
  });
}
