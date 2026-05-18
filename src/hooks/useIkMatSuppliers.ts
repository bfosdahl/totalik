import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { toast } from "sonner";

export interface IkMatSupplier {
  id: string;
  company_id: string;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  service_type: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_document_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useIkMatSuppliers() {
  const { company } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["ik-mat-suppliers", company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];

      let q = supabase
        .from("ik_mat_suppliers")
        .select("*")
        .eq("company_id", company.id);
      q = filterDepartmentId
        ? q.eq("department_id", filterDepartmentId)
        : q.is("department_id", null);
      const { data, error } = await q.order("created_at", { ascending: false });

      if (error) throw error;
      return data as IkMatSupplier[];
    },
    enabled: !!company?.id,
  });

  const createSupplier = useMutation({
    mutationFn: async (supplierData: Omit<IkMatSupplier, "id" | "company_id" | "created_at" | "updated_at">) => {
      if (!company?.id) throw new Error("No company ID");

      const { data, error } = await supabase
        .from("ik_mat_suppliers")
        .insert({
          ...supplierData,
          company_id: company.id,
          department_id: filterDepartmentId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-suppliers"] });
      toast.success("Leverandør opprettet");
    },
    onError: (error) => {
      console.error("Error creating supplier:", error);
      toast.error("Kunne ikke opprette leverandør");
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplierData }: Partial<IkMatSupplier> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_mat_suppliers")
        .update(supplierData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-suppliers"] });
      toast.success("Leverandør oppdatert");
    },
    onError: (error) => {
      console.error("Error updating supplier:", error);
      toast.error("Kunne ikke oppdatere leverandør");
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_mat_suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-suppliers"] });
      toast.success("Leverandør slettet");
    },
    onError: (error) => {
      console.error("Error deleting supplier:", error);
      toast.error("Kunne ikke slette leverandør");
    },
  });

  return {
    suppliers,
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
