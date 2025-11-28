import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubcontractorInspection {
  id: string;
  subcontractor_id: string;
  project_id: string;
  company_id: string;
  inspection_date: string;
  inspector_name: string;
  work_area: string;
  status: 'approved' | 'approved_with_remarks' | 'rejected';
  findings: string | null;
  corrective_actions: string | null;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NewInspectionInput {
  inspection_date: string;
  inspector_name: string;
  work_area: string;
  status: SubcontractorInspection['status'];
  findings?: string;
  corrective_actions?: string;
}

export const useSubcontractorInspections = (subcontractorId: string | null, projectId: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['subcontractor-inspections', subcontractorId],
    queryFn: async () => {
      if (!subcontractorId) return [];
      const { data, error } = await supabase
        .from('ks_subcontractor_inspections')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('inspection_date', { ascending: false });

      if (error) throw error;
      return data as SubcontractorInspection[];
    },
    enabled: !!subcontractorId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: NewInspectionInput) => {
      if (!profile?.company_id || !subcontractorId) throw new Error("Ingen bedrift eller underleverandør funnet");

      const { data, error } = await supabase
        .from('ks_subcontractor_inspections')
        .insert({
          subcontractor_id: subcontractorId,
          project_id: projectId,
          company_id: profile.company_id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractor-inspections', subcontractorId] });
      toast.success("Kontroll registrert");
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error("Kunne ikke registrere kontroll");
    },
  });

  return {
    inspections: inspections || [],
    isLoading,
    createInspection: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
