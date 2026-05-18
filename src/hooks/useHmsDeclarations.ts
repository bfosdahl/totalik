import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { useCallback } from "react";

export interface HmsSelfDeclaration {
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
  employee_rep_name: string | null;
  employee_rep_signature: string | null;
  employee_rep_signed_at: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerneombudExemptionAgreement {
  id: string;
  company_id: string;
  total_employees: number | null;
  agreement_date: string | null;
  employer_name: string | null;
  employer_signature: string | null;
  employer_signed_at: string | null;
  employee_signatures: Array<{
    name: string;
    signature: string;
    signed_at: string;
  }> | null;
  status: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useHmsDeclarations() {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: selfDeclaration, isLoading: isLoadingSelfDeclaration } = useQuery({
    queryKey: ["hms-self-declaration", companyId, filterDepartmentId],
    queryFn: async () => {
      if (!companyId) return null;
      let q = supabase
        .from("hms_self_declarations")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active");
      q = filterDepartmentId
        ? q.eq("department_id", filterDepartmentId)
        : q.is("department_id", null);
      const { data, error } = await q.maybeSingle();
      
      if (error) {
        console.error("Error fetching HMS self-declaration:", error);
        return null;
      }
      return data as HmsSelfDeclaration | null;
    },
    enabled: !!companyId,
  });

  const { data: verneombudExemption, isLoading: isLoadingExemption } = useQuery({
    queryKey: ["verneombud-exemption", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("verneombud_exemption_agreements")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching verneombud exemption:", error);
        return null;
      }
      
      // Parse employee_signatures from JSON
      if (data?.employee_signatures) {
        return {
          ...data,
          employee_signatures: data.employee_signatures as VerneombudExemptionAgreement["employee_signatures"],
        } as VerneombudExemptionAgreement;
      }
      return data as VerneombudExemptionAgreement | null;
    },
    enabled: !!companyId,
  });

  // Function to refresh data after saving
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["hms-self-declaration", companyId] });
    queryClient.invalidateQueries({ queryKey: ["verneombud-exemption", companyId] });
  }, [queryClient, companyId]);
  void filterDepartmentId;

  return {
    selfDeclaration,
    verneombudExemption,
    isLoading: isLoadingSelfDeclaration || isLoadingExemption,
    hasSelfDeclaration: !!selfDeclaration,
    hasVerneombudExemption: !!verneombudExemption,
    refetch,
  };
}
