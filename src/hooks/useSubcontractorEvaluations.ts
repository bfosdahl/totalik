import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubcontractorEvaluation {
  id: string;
  subcontractor_id: string;
  company_id: string;
  
  // Sjekkpunkter
  sentral_godkjenning: boolean | null;
  sentral_godkjenning_comment: string | null;
  lokal_godkjenning: boolean | null;
  lokal_godkjenning_comment: string | null;
  godkjenning_for_arbeid: boolean | null;
  godkjenning_for_arbeid_comment: string | null;
  andre_sertifikater: boolean | null;
  andre_sertifikater_comment: string | null;
  referanseprosjekter: boolean | null;
  referanseprosjekter_comment: string | null;
  jobbet_for_oss_for: boolean | null;
  jobbet_for_oss_for_comment: string | null;
  endringer_siden_sist: boolean | null;
  endringer_siden_sist_comment: string | null;
  arbeidskapasitet: boolean | null;
  arbeidskapasitet_comment: string | null;
  erfaring_kompetanse: boolean | null;
  erfaring_kompetanse_comment: string | null;
  forsikringer: boolean | null;
  forsikringer_comment: string | null;
  okonomi: boolean | null;
  okonomi_comment: string | null;
  garantier: boolean | null;
  garantier_comment: string | null;
  kontrakt: boolean | null;
  kontrakt_comment: string | null;
  lonnsklausuler: boolean | null;
  lonnsklausuler_comment: string | null;
  paseplikt: boolean | null;
  paseplikt_comment: string | null;
  kvalitetssystem: boolean | null;
  kvalitetssystem_comment: string | null;
  hms_system: boolean | null;
  hms_system_comment: string | null;
  
  // Konklusjon
  kan_brukes: 'godkjent' | 'ikke_godkjent' | 'godkjent_med_forbehold' | null;
  konklusjon_notes: string | null;
  
  // Metadata
  evaluated_by: string | null;
  evaluated_by_name: string;
  evaluated_at: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationInput {
  sentral_godkjenning?: boolean;
  sentral_godkjenning_comment?: string;
  lokal_godkjenning?: boolean;
  lokal_godkjenning_comment?: string;
  godkjenning_for_arbeid?: boolean;
  godkjenning_for_arbeid_comment?: string;
  andre_sertifikater?: boolean;
  andre_sertifikater_comment?: string;
  referanseprosjekter?: boolean;
  referanseprosjekter_comment?: string;
  jobbet_for_oss_for?: boolean;
  jobbet_for_oss_for_comment?: string;
  endringer_siden_sist?: boolean;
  endringer_siden_sist_comment?: string;
  arbeidskapasitet?: boolean;
  arbeidskapasitet_comment?: string;
  erfaring_kompetanse?: boolean;
  erfaring_kompetanse_comment?: string;
  forsikringer?: boolean;
  forsikringer_comment?: string;
  okonomi?: boolean;
  okonomi_comment?: string;
  garantier?: boolean;
  garantier_comment?: string;
  kontrakt?: boolean;
  kontrakt_comment?: string;
  lonnsklausuler?: boolean;
  lonnsklausuler_comment?: string;
  paseplikt?: boolean;
  paseplikt_comment?: string;
  kvalitetssystem?: boolean;
  kvalitetssystem_comment?: string;
  hms_system?: boolean;
  hms_system_comment?: string;
  kan_brukes?: 'godkjent' | 'ikke_godkjent' | 'godkjent_med_forbehold';
  konklusjon_notes?: string;
}

export const useSubcontractorEvaluations = (subcontractorId: string | null) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['subcontractor-evaluation', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return null;
      const { data, error } = await supabase
        .from('ks_subcontractor_evaluations')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .maybeSingle();

      if (error) throw error;
      return data as SubcontractorEvaluation | null;
    },
    enabled: !!subcontractorId,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (input: EvaluationInput) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Ingen bedrift eller underleverandør funnet");

      const payload = {
        subcontractor_id: subcontractorId,
        company_id: profile.company_id,
        evaluated_by: profile.id,
        evaluated_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
        ...input,
      };

      // Check if evaluation exists
      if (evaluation?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('ks_subcontractor_evaluations')
          .update(payload)
          .eq('id', evaluation.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('ks_subcontractor_evaluations')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subcontractor-evaluation', subcontractorId] });
      
      // Update approval status on subcontractor if kan_brukes is set
      if (data.kan_brukes && subcontractorId) {
        supabase
          .from('ks_project_subcontractors')
          .update({
            approval_status: data.kan_brukes,
            approval_date: new Date().toISOString(),
            approved_by: profile?.id,
            approval_notes: data.konklusjon_notes,
          })
          .eq('id', subcontractorId)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['ks-subcontractors'] });
          });
      }
      
      toast.success("Evaluering lagret");
    },
    onError: (error) => {
      console.error('Evaluation save error:', error);
      toast.error("Kunne ikke lagre evaluering");
    },
  });

  return {
    evaluation,
    isLoading,
    saveEvaluation: createOrUpdateMutation.mutate,
    isSaving: createOrUpdateMutation.isPending,
  };
};