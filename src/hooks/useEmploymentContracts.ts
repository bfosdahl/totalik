import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmploymentContract {
  id: string;
  company_id: string;
  employee_id: string;
  contract_type: string;
  contract_file_path: string | null;
  position: string;
  employment_percentage: number;
  start_date: string;
  end_date: string | null;
  probation_period_months: number | null;
  signed_date: string | null;
  signed_by_employee: boolean;
  signed_by_employer: boolean;
  employee_signature?: string | null;
  employer_signature?: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export interface ContractFormData {
  employee_id: string;
  contract_type: string;
  position: string;
  employment_percentage: number;
  start_date: string;
  end_date?: string | null;
  probation_period_months?: number | null;
  notes?: string | null;
}

export function useEmploymentContracts() {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['employment-contracts', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('employment_contracts')
        .select(`
          *,
          employee:profiles!employment_contracts_employee_id_fkey(
            id, first_name, last_name, email
          )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmploymentContract[];
    },
    enabled: !!company?.id,
  });

  const createContract = useMutation({
    mutationFn: async (formData: ContractFormData) => {
      if (!company?.id) throw new Error("Ingen bedrift valgt");

      const { data, error } = await supabase
        .from('employment_contracts')
        .insert({
          company_id: company.id,
          employee_id: formData.employee_id,
          contract_type: formData.contract_type,
          position: formData.position,
          employment_percentage: formData.employment_percentage,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          probation_period_months: formData.probation_period_months || null,
          notes: formData.notes || null,
          status: 'draft',
          signed_by_employee: false,
          signed_by_employer: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-contracts'] });
      toast.success("Ansettelsesavtale opprettet");
    },
    onError: (error) => {
      console.error("Feil ved oppretting av avtale:", error);
      toast.error("Kunne ikke opprette avtale");
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmploymentContract> & { id: string }) => {
      const { data, error } = await supabase
        .from('employment_contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-contracts'] });
      toast.success("Avtale oppdatert");
    },
    onError: (error) => {
      console.error("Feil ved oppdatering:", error);
      toast.error("Kunne ikke oppdatere avtale");
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employment_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-contracts'] });
      toast.success("Avtale slettet");
    },
    onError: (error) => {
      console.error("Feil ved sletting:", error);
      toast.error("Kunne ikke slette avtale");
    },
  });

  const signContract = useMutation({
    mutationFn: async ({ 
      id, 
      signatureType, 
      signature 
    }: { 
      id: string; 
      signatureType: 'employee' | 'employer';
      signature: string;
    }) => {
      const updates: Record<string, unknown> = {
        [`signed_by_${signatureType}`]: true,
        [`${signatureType}_signature`]: signature,
      };

      // Check if both parties have signed
      const contract = contracts.find(c => c.id === id);
      if (contract) {
        const bothSigned = signatureType === 'employee' 
          ? contract.signed_by_employer 
          : contract.signed_by_employee;
        
        if (bothSigned) {
          updates.status = 'active';
          updates.signed_date = new Date().toISOString().split('T')[0];
        } else {
          updates.status = 'pending_signature';
        }
      }

      const { data, error } = await supabase
        .from('employment_contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-contracts'] });
      toast.success("Avtale signert");
    },
    onError: (error) => {
      console.error("Feil ved signering:", error);
      toast.error("Kunne ikke signere avtale");
    },
  });

  // Computed stats
  const stats = {
    totalActive: contracts.filter(c => c.status === 'active').length,
    temporary: contracts.filter(c => c.contract_type === 'temporary' && c.status === 'active').length,
    onProbation: contracts.filter(c => {
      if (!c.probation_period_months || c.status !== 'active') return false;
      const startDate = new Date(c.start_date);
      const probationEnd = new Date(startDate);
      probationEnd.setMonth(probationEnd.getMonth() + c.probation_period_months);
      return new Date() < probationEnd;
    }).length,
    expiringSoon: contracts.filter(c => {
      if (!c.end_date || c.status !== 'active') return false;
      const endDate = new Date(c.end_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow && endDate >= new Date();
    }).length,
  };

  return {
    contracts,
    isLoading,
    error,
    stats,
    createContract,
    updateContract,
    deleteContract,
    signContract,
  };
}
