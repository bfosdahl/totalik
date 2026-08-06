import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { EmploymentContract } from "./useEmploymentContracts";

export function useMyContract() {
  const { profile, company } = useAuth();
  const queryClient = useQueryClient();

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['my-contract', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('employment_contracts')
        .select(`
          *,
          employee:profiles!employment_contracts_employee_id_fkey(
            id, first_name, last_name, email
          )
        `)
        .eq('employee_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EmploymentContract | null;
    },
    enabled: !!profile?.id,
  });

  const signAsEmployee = useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      if (!contract) throw new Error("Ingen kontrakt funnet");

      const updates: Record<string, unknown> = {
        signed_by_employee: true,
        employee_signature: signature,
      };

      // Check if employer already signed
      if (contract.signed_by_employer) {
        updates.status = 'active';
        const now = new Date();
        updates.signed_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      } else {
        updates.status = 'pending_signature';
      }

      const { data, error } = await supabase
        .from('employment_contracts')
        .update(updates as any)
        .eq('id', contract.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contract'] });
      queryClient.invalidateQueries({ queryKey: ['employment-contracts'] });
      toast.success("Avtale signert!");
    },
    onError: (error) => {
      console.error("Feil ved signering:", error);
      toast.error("Kunne ikke signere avtale");
    },
  });

  return {
    contract,
    isLoading,
    error,
    signAsEmployee,
    company,
  };
}
