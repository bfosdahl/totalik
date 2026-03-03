import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TripExpense {
  id: string;
  trip_id: string;
  user_id: string;
  company_id: string;
  category: string;
  description: string;
  amount: number;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  trip_id: string;
  category: string;
  description: string;
  amount: number;
  receipt_file?: File;
}

export function useTripExpenses(tripId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const expenses = useQuery({
    queryKey: ["trip-expenses", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_log_expenses")
        .select("*")
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TripExpense[];
    },
    enabled: !!tripId && !!profile?.id,
  });

  const addExpense = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      if (!profile?.id || !profile?.company_id) throw new Error("Ikke innlogget");

      let receipt_path: string | null = null;

      if (input.receipt_file) {
        const fileExt = input.receipt_file.name.split(".").pop();
        const filePath = `${profile.id}/${input.trip_id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("driving-log-receipts")
          .upload(filePath, input.receipt_file);

        if (uploadError) throw uploadError;
        receipt_path = filePath;
      }

      const { data, error } = await supabase
        .from("driving_log_expenses")
        .insert({
          trip_id: input.trip_id,
          user_id: profile.id,
          company_id: profile.company_id,
          category: input.category,
          description: input.description,
          amount: input.amount,
          receipt_path,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-expenses", tripId] });
      toast.success("Utgift lagt til");
    },
    onError: (error) => {
      toast.error("Kunne ikke legge til utgift: " + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (expense: TripExpense) => {
      if (expense.receipt_path) {
        await supabase.storage
          .from("driving-log-receipts")
          .remove([expense.receipt_path]);
      }

      const { error } = await supabase
        .from("driving_log_expenses")
        .delete()
        .eq("id", expense.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-expenses", tripId] });
      toast.success("Utgift slettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke slette utgift: " + error.message);
    },
  });

  const totalExpenses = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return { expenses, addExpense, deleteExpense, totalExpenses };
}
