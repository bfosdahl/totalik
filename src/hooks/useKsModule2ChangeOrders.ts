import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KsModule2ChangeOrder {
  id: string;
  project_id: string;
  company_id: string;
  change_order_number: string;
  title: string;
  description: string | null;
  reason: string | null;
  requested_by: string | null;
  requested_date: string | null;
  estimated_hours: number | null;
  hourly_rate: number | null;
  material_cost: number | null;
  total_cost: number | null;
  status: string;
  customer_approved: boolean;
  customer_approved_at: string | null;
  customer_approved_by: string | null;
  customer_signature: string | null;
  internal_notes: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_name: string | null;
}

export type NewKsModule2ChangeOrder = Omit<
  KsModule2ChangeOrder,
  "id" | "change_order_number" | "created_at" | "updated_at"
>;

export function useKsModule2ChangeOrders(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: changeOrders = [], isLoading, refetch } = useQuery({
    queryKey: ["ks-module2-change-orders", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("ks_module2_change_orders")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KsModule2ChangeOrder[];
    },
    enabled: !!projectId,
  });

  const createChangeOrder = useMutation({
    mutationFn: async (newOrder: Partial<NewKsModule2ChangeOrder>) => {
      const { data, error } = await supabase
        .from("ks_module2_change_orders")
        .insert([newOrder as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-change-orders", projectId] });
      toast({ title: "Endringsmelding opprettet" });
    },
    onError: (error) => {
      console.error("Error creating change order:", error);
      toast({ title: "Feil ved opprettelse", variant: "destructive" });
    },
  });

  const updateChangeOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2ChangeOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_change_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-change-orders", projectId] });
      toast({ title: "Endringsmelding oppdatert" });
    },
    onError: (error) => {
      console.error("Error updating change order:", error);
      toast({ title: "Feil ved oppdatering", variant: "destructive" });
    },
  });

  const deleteChangeOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_change_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-change-orders", projectId] });
      toast({ title: "Endringsmelding slettet" });
    },
    onError: (error) => {
      console.error("Error deleting change order:", error);
      toast({ title: "Feil ved sletting", variant: "destructive" });
    },
  });

  const approveChangeOrder = useMutation({
    mutationFn: async ({ id, approvedBy, signature }: { id: string; approvedBy: string; signature?: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_change_orders")
        .update({
          status: "approved",
          customer_approved: true,
          customer_approved_at: new Date().toISOString(),
          customer_approved_by: approvedBy,
          customer_signature: signature || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-change-orders", projectId] });
      toast({ title: "Endringsmelding godkjent av kunde" });
    },
    onError: (error) => {
      console.error("Error approving change order:", error);
      toast({ title: "Feil ved godkjenning", variant: "destructive" });
    },
  });

  return {
    changeOrders,
    isLoading,
    refetch,
    createChangeOrder: createChangeOrder.mutate,
    updateChangeOrder: updateChangeOrder.mutate,
    deleteChangeOrder: deleteChangeOrder.mutate,
    approveChangeOrder: approveChangeOrder.mutate,
    isCreating: createChangeOrder.isPending,
    isUpdating: updateChangeOrder.isPending,
  };
}
