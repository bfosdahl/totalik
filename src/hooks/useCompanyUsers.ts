import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export function useCompanyUsers() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["company-users", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as CompanyUser[];
    },
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getUserDisplayName = useCallback((user: CompanyUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email || "Ukjent bruker";
  }, []);

  return { users, isLoading, error, refetch, getUserDisplayName };
}
