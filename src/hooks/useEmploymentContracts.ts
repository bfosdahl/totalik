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
  work_description: string | null;
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
  
  // Workplace
  workplace_address: string | null;
  has_multiple_workplaces: boolean;
  remote_work_allowed: boolean;
  remote_work_details: string | null;
  
  // Working hours
  working_hours_per_week: number;
  working_hours_per_day: number | null;
  work_time_arrangement: string | null;
  break_duration_minutes: number;
  variable_working_hours: boolean;
  variable_hours_description: string | null;
  shift_change_rules: string | null;
  
  // Temporary
  temporary_reason: string | null;
  
  // Vacation
  vacation_days: number;
  holiday_pay_percentage: number;
  vacation_rules: string | null;
  
  // Salary
  salary_amount: number | null;
  salary_type: string;
  payment_method: string;
  payment_day: number;
  overtime_compensation: string | null;
  other_allowances: string | null;
  
  // Notice
  notice_period_employee_months: number;
  notice_period_employer_months: number;
  termination_procedures: string | null;
  
  // Staffing
  is_staffing_agency: boolean;
  client_company_name: string | null;
  client_company_org_number: string | null;
  
  // Benefits
  training_provisions: string | null;
  pension_scheme: string | null;
  insurance_provisions: string | null;
  sick_pay_rules: string | null;
  
  // Collective agreement
  has_collective_agreement: boolean;
  collective_agreement_name: string | null;
  collective_agreement_parties: string | null;
  
  // Special
  special_work_time_exemptions: boolean;
  special_work_time_details: string | null;
  
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
  work_description?: string;
  employment_percentage: number;
  start_date: string;
  end_date?: string | null;
  probation_period_months?: number | null;
  notes?: string | null;
  
  // Extended fields
  workplace_address?: string;
  has_multiple_workplaces?: boolean;
  remote_work_allowed?: boolean;
  remote_work_details?: string;
  working_hours_per_week?: number;
  working_hours_per_day?: number;
  work_time_arrangement?: string;
  break_duration_minutes?: number;
  variable_working_hours?: boolean;
  variable_hours_description?: string;
  shift_change_rules?: string;
  temporary_reason?: string;
  vacation_days?: number;
  holiday_pay_percentage?: number;
  vacation_rules?: string;
  salary_amount?: number;
  salary_type?: string;
  payment_method?: string;
  payment_day?: number;
  overtime_compensation?: string;
  other_allowances?: string;
  notice_period_employee_months?: number;
  notice_period_employer_months?: number;
  termination_procedures?: string;
  is_staffing_agency?: boolean;
  client_company_name?: string;
  client_company_org_number?: string;
  training_provisions?: string;
  pension_scheme?: string;
  insurance_provisions?: string;
  sick_pay_rules?: string;
  has_collective_agreement?: boolean;
  collective_agreement_name?: string;
  collective_agreement_parties?: string;
  special_work_time_exemptions?: boolean;
  special_work_time_details?: string;
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
          work_description: formData.work_description || null,
          employment_percentage: formData.employment_percentage,
          start_date: formData.start_date,
          end_date: formData.end_date && formData.end_date.trim() !== '' ? formData.end_date : null,
          probation_period_months: formData.probation_period_months || null,
          notes: formData.notes || null,
          status: 'draft',
          signed_by_employee: false,
          signed_by_employer: false,
          
          // Extended fields
          workplace_address: formData.workplace_address || null,
          has_multiple_workplaces: formData.has_multiple_workplaces || false,
          remote_work_allowed: formData.remote_work_allowed || false,
          remote_work_details: formData.remote_work_details || null,
          working_hours_per_week: formData.working_hours_per_week || 37.5,
          working_hours_per_day: formData.working_hours_per_day || null,
          work_time_arrangement: formData.work_time_arrangement || 'normal',
          break_duration_minutes: formData.break_duration_minutes || 30,
          variable_working_hours: formData.variable_working_hours || false,
          variable_hours_description: formData.variable_hours_description || null,
          shift_change_rules: formData.shift_change_rules || null,
          temporary_reason: formData.temporary_reason || null,
          vacation_days: formData.vacation_days || 25,
          holiday_pay_percentage: formData.holiday_pay_percentage || 10.2,
          vacation_rules: formData.vacation_rules || null,
          salary_amount: formData.salary_amount || null,
          salary_type: formData.salary_type || 'monthly',
          payment_method: formData.payment_method || 'bank_transfer',
          payment_day: formData.payment_day || 15,
          overtime_compensation: formData.overtime_compensation || null,
          other_allowances: formData.other_allowances || null,
          notice_period_employee_months: formData.notice_period_employee_months || 1,
          notice_period_employer_months: formData.notice_period_employer_months || 1,
          termination_procedures: formData.termination_procedures || null,
          is_staffing_agency: formData.is_staffing_agency || false,
          client_company_name: formData.client_company_name || null,
          client_company_org_number: formData.client_company_org_number || null,
          training_provisions: formData.training_provisions || null,
          pension_scheme: formData.pension_scheme || null,
          insurance_provisions: formData.insurance_provisions || null,
          sick_pay_rules: formData.sick_pay_rules || null,
          has_collective_agreement: formData.has_collective_agreement || false,
          collective_agreement_name: formData.collective_agreement_name || null,
          collective_agreement_parties: formData.collective_agreement_parties || null,
          special_work_time_exemptions: formData.special_work_time_exemptions || false,
          special_work_time_details: formData.special_work_time_details || null,
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
      // Remove joined relation fields that are not actual columns
      const { employee, created_at, updated_at, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('employment_contracts')
        .update(cleanUpdates)
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
