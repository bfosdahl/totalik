import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { toast } from "sonner";

export interface CompanyLawRegulation {
  id: string;
  company_id: string;
  law_name: string;
  description: string | null;
  link: string | null;
  category: string | null;
  is_employee_based: boolean;
  employee_threshold: number | null;
  is_manually_added: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewLawRegulation {
  law_name: string;
  description?: string;
  link?: string;
  category?: string;
  is_employee_based?: boolean;
  employee_threshold?: number;
  is_manually_added?: boolean;
}

export const useCompanyLawsRegulations = () => {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: savedLaws = [], isLoading } = useQuery({
    queryKey: ["company-laws-regulations", companyId, filterDepartmentId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let q = supabase
        .from("company_laws_regulations")
        .select("*")
        .eq("company_id", companyId);
      q = filterDepartmentId
        ? q.eq("department_id", filterDepartmentId)
        : q.is("department_id", null);
      const { data, error } = await q.order("created_at", { ascending: true });

      if (error) throw error;
      return data as CompanyLawRegulation[];
    },
    enabled: !!companyId,
  });

  const saveLawsMutation = useMutation({
    mutationFn: async (laws: NewLawRegulation[]) => {
      if (!companyId) throw new Error("Ingen bedrift valgt");

      const lawsWithCompanyId = laws.map(law => ({
        ...law,
        company_id: companyId,
        department_id: filterDepartmentId,
      }));

      const { data, error } = await supabase
        .from("company_laws_regulations")
        .insert(lawsWithCompanyId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-laws-regulations", companyId] });
      toast.success("Lover og forskrifter lagret");
    },
    onError: (error) => {
      console.error("Error saving laws:", error);
      toast.error("Kunne ikke lagre lover og forskrifter");
    },
  });

  const addLawMutation = useMutation({
    mutationFn: async (law: NewLawRegulation) => {
      if (!companyId) throw new Error("Ingen bedrift valgt");

      const { data, error } = await supabase
        .from("company_laws_regulations")
        .insert({
          ...law,
          company_id: companyId,
          department_id: filterDepartmentId,
          is_manually_added: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-laws-regulations", companyId] });
      toast.success("Lov/forskrift lagt til");
    },
    onError: (error) => {
      console.error("Error adding law:", error);
      toast.error("Kunne ikke legge til lov/forskrift");
    },
  });

  const deleteLawMutation = useMutation({
    mutationFn: async (lawId: string) => {
      const { error } = await supabase
        .from("company_laws_regulations")
        .delete()
        .eq("id", lawId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-laws-regulations", companyId] });
      toast.success("Lov/forskrift slettet");
    },
    onError: (error) => {
      console.error("Error deleting law:", error);
      toast.error("Kunne ikke slette lov/forskrift");
    },
  });

  const clearAllLawsMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Ingen bedrift valgt");

      let dq = supabase
        .from("company_laws_regulations")
        .delete()
        .eq("company_id", companyId);
      dq = filterDepartmentId
        ? dq.eq("department_id", filterDepartmentId)
        : dq.is("department_id", null);
      const { error } = await dq;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-laws-regulations", companyId] });
      toast.success("Alle lover og forskrifter slettet");
    },
    onError: (error) => {
      console.error("Error clearing laws:", error);
      toast.error("Kunne ikke slette lover og forskrifter");
    },
  });

  return {
    savedLaws,
    isLoading,
    saveLaws: saveLawsMutation.mutate,
    addLaw: addLawMutation.mutate,
    deleteLaw: deleteLawMutation.mutate,
    clearAllLaws: clearAllLawsMutation.mutate,
    isSaving: saveLawsMutation.isPending,
    isAdding: addLawMutation.isPending,
    isDeleting: deleteLawMutation.isPending,
  };
};
