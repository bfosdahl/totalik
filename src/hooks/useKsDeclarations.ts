import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export interface KsSelfDeclaration {
  id: string;
  company_id: string;
  company_name: string;
  company_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  declaration_date: string | null;
  manager_name: string | null;
  manager_signature: string | null;
  manager_signed_at: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useKsDeclarations() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: selfDeclaration, isLoading } = useQuery({
    queryKey: ["ks-self-declaration", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("ks_self_declarations")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching KS self-declaration:", error);
        return null;
      }
      return data as KsSelfDeclaration | null;
    },
    enabled: !!companyId,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["ks-self-declaration", companyId] });
  }, [queryClient, companyId]);

  return {
    selfDeclaration,
    isLoading,
    hasSelfDeclaration: !!selfDeclaration,
    refetch,
  };
}
