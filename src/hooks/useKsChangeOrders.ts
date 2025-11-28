import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsChangeOrder {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  price_ex_vat: number | null;
  estimated_hours: number | null;
  customer_approved: boolean;
  approved_at: string | null;
  pdf_url: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useKsChangeOrders = (projectId: string | null) => {
  const [changeOrders, setChangeOrders] = useState<KsChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  const fetchChangeOrders = async () => {
    if (!projectId) {
      setChangeOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ks_change_orders")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChangeOrders(data || []);
    } catch (error) {
      console.error("Error fetching change orders:", error);
      toast.error("Kunne ikke hente endringsmeldinger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChangeOrders();
  }, [projectId]);

  const createChangeOrder = async (input: Omit<KsChangeOrder, "id" | "created_at" | "updated_at" | "created_by_user_id" | "pdf_url" | "approved_at">) => {
    try {
      const { data, error } = await supabase
        .from("ks_change_orders")
        .insert({
          ...input,
          created_by_user_id: profile?.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Endringsmelding opprettet");
      await fetchChangeOrders();
      return data;
    } catch (error) {
      console.error("Error creating change order:", error);
      toast.error("Kunne ikke opprette endringsmelding");
      return null;
    }
  };

  const updateChangeOrder = async (id: string, updates: Partial<KsChangeOrder>) => {
    try {
      const { error } = await supabase
        .from("ks_change_orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Endringsmelding oppdatert");
      await fetchChangeOrders();
      return true;
    } catch (error) {
      console.error("Error updating change order:", error);
      toast.error("Kunne ikke oppdatere endringsmelding");
      return false;
    }
  };

  const deleteChangeOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_change_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Endringsmelding slettet");
      await fetchChangeOrders();
      return true;
    } catch (error) {
      console.error("Error deleting change order:", error);
      toast.error("Kunne ikke slette endringsmelding");
      return false;
    }
  };

  return {
    changeOrders,
    isLoading,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    refetch: fetchChangeOrders,
  };
};