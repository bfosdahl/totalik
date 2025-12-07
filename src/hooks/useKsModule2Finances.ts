import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectFinances {
  id: string;
  project_id: string;
  company_id: string;
  contract_sum: number;
  budget_materials: number;
  budget_labor: number;
  budget_subcontractors: number;
  budget_other: number;
  actual_materials: number;
  actual_labor: number;
  actual_subcontractors: number;
  actual_other: number;
  invoiced_amount: number;
  paid_amount: number;
  change_orders_sum: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostEntry {
  id: string;
  project_id: string;
  company_id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier: string | null;
  invoice_number: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  company_id: string;
  invoice_number: string;
  description: string | null;
  amount: number;
  invoice_date: string;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useKsModule2Finances(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch or create project finances
  const { data: finances, isLoading: financesLoading } = useQuery({
    queryKey: ["ks-module2-finances", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("ks_module2_finances")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as ProjectFinances | null;
    },
    enabled: !!projectId,
  });

  // Fetch cost entries
  const { data: costEntries = [], isLoading: costEntriesLoading } = useQuery({
    queryKey: ["ks-module2-cost-entries", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_cost_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as CostEntry[];
    },
    enabled: !!projectId,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["ks-module2-invoices", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("ks_module2_invoices")
        .select("*")
        .eq("project_id", projectId)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!projectId,
  });

  // Create or update finances
  const upsertFinances = useMutation({
    mutationFn: async (data: Partial<ProjectFinances> & { project_id: string; company_id: string }) => {
      const { data: result, error } = await supabase
        .from("ks_module2_finances")
        .upsert(data, { onConflict: "project_id" })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-finances", projectId] });
      toast({ title: "Økonomi oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved lagring", description: error.message, variant: "destructive" });
    },
  });

  // Create cost entry
  const createCostEntry = useMutation({
    mutationFn: async (entry: Omit<CostEntry, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ks_module2_cost_entries")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-cost-entries", projectId] });
      toast({ title: "Kostnad registrert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved registrering", description: error.message, variant: "destructive" });
    },
  });

  // Delete cost entry
  const deleteCostEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_cost_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-cost-entries", projectId] });
      toast({ title: "Kostnad slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
    },
  });

  // Create invoice
  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ks_module2_invoices")
        .insert(invoice)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-invoices", projectId] });
      toast({ title: "Faktura opprettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved opprettelse", description: error.message, variant: "destructive" });
    },
  });

  // Update invoice
  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-invoices", projectId] });
      toast({ title: "Faktura oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil ved oppdatering", description: error.message, variant: "destructive" });
    },
  });

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-invoices", projectId] });
      toast({ title: "Faktura slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
    },
  });

  return {
    finances,
    costEntries,
    invoices,
    isLoading: financesLoading || costEntriesLoading || invoicesLoading,
    upsertFinances,
    createCostEntry,
    deleteCostEntry,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
}
