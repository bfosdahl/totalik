import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { useToast } from "@/hooks/use-toast";

export interface TraceabilityRecord {
  id: string;
  company_id: string;
  supplier_name: string;
  product_name: string;
  batch_number: string | null;
  production_date: string | null;
  receipt_date: string;
  expiry_date: string | null;
  receipt_temperature: number | null;
  document_path: string | null;
  notes: string | null;
  allergens: string[];
  expiry_type: 'best_before' | 'use_by';
  is_internal_production: boolean;
  internal_shelf_life_days: number | null;
  produced_by: string | null;
  created_at: string;
  updated_at: string;
}

export const ALLERGEN_OPTIONS = [
  'Gluten', 'Skalldyr', 'Egg', 'Fisk', 'Peanøtter', 'Soya',
  'Melk (laktose)', 'Nøtter', 'Selleri', 'Sennep', 'Sesamfrø',
  'Svoveldioksid/sulfitter', 'Lupin', 'Bløtdyr'
] as const;

export const useIkMatTraceability = (companyId: string | undefined) => {
  const { toast } = useToast();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["ik-mat-traceability", companyId, filterDepartmentId],
    queryFn: async () => {
      if (!companyId) return [];

      let q = supabase
        .from("ik_mat_traceability_records")
        .select("*")
        .eq("company_id", companyId);
      q = filterDepartmentId
        ? q.eq("department_id", filterDepartmentId)
        : q.is("department_id", null);
      const { data, error } = await q.order("receipt_date", { ascending: false });

      if (error) throw error;
      return data as TraceabilityRecord[];
    },
    enabled: !!companyId,
  });

  const createRecord = useMutation({
    mutationFn: async (record: Omit<TraceabilityRecord, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ik_mat_traceability_records")
        .insert({ ...record, department_id: filterDepartmentId } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-traceability", companyId] });
      toast({
        title: "Suksess",
        description: "Varemottak registrert",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke registrere varemottak",
        variant: "destructive",
      });
      console.error("Error creating traceability record:", error);
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TraceabilityRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("ik_mat_traceability_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-traceability", companyId] });
      toast({
        title: "Suksess",
        description: "Varemottak oppdatert",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere varemottak",
        variant: "destructive",
      });
      console.error("Error updating traceability record:", error);
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_mat_traceability_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-mat-traceability", companyId] });
      toast({
        title: "Suksess",
        description: "Varemottak slettet",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke slette varemottak",
        variant: "destructive",
      });
      console.error("Error deleting traceability record:", error);
    },
  });

  const uploadDocument = async (file: File, companyId: string, recordId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}-${Date.now()}.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ik-mat-traceability')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  };

  const getDocumentUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from('ik-mat-traceability')
      .createSignedUrl(path, 3600); // 1 hour expiry
    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    records: records || [],
    isLoading,
    createRecord: createRecord.mutate,
    updateRecord: updateRecord.mutate,
    deleteRecord: deleteRecord.mutate,
    uploadDocument,
    getDocumentUrl,
  };
};
