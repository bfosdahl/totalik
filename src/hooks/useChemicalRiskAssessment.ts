import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { toast } from "sonner";

export interface WorkTask {
  id: string;
  description: string;
  frequency: string; // 'daglig', 'ukentlig', 'månedlig', 'sjelden'
  duration_minutes: number;
}

export interface ProtectiveMeasure {
  id: string;
  type: 'teknisk' | 'organisatorisk' | 'verneutstyr' | 'opplæring';
  description: string;
  implemented: boolean;
  responsible?: string;
  deadline?: string;
}

export interface Measurement {
  id: string;
  date: string;
  value: number;
  unit: string;
  location: string;
  exposure_limit?: number;
  measured_by: string;
  notes?: string;
}

export interface ChemicalRiskAssessment {
  id: string;
  company_id: string;
  company_chemical_entry_id: string;
  project_id: string | null;
  
  // Phase tracking
  current_phase: number;
  phase_1_completed: boolean;
  phase_2_completed: boolean;
  phase_3_completed: boolean;
  
  // Phase 1: Initial assessment
  hazard_identification: Record<string, any>;
  exposure_type: string | null;
  exposure_level: string | null;
  exposure_duration: string | null;
  exposed_workers_count: number | null;
  hazard_severity: number | null;
  exposure_probability: number | null;
  risk_level: string | null;
  work_tasks: WorkTask[];
  existing_measures: ProtectiveMeasure[];
  phase_1_conclusion: string | null;
  phase_1_needs_further_assessment: boolean;
  phase_1_assessed_at: string | null;
  phase_1_assessed_by_id: string | null;
  phase_1_assessed_by_name: string | null;
  
  // Phase 2
  phase_2_measurements: Measurement[];
  phase_2_measurement_method: string | null;
  phase_2_conclusion: string | null;
  phase_2_needs_detailed_assessment: boolean;
  phase_2_assessed_at: string | null;
  phase_2_assessed_by_id: string | null;
  phase_2_assessed_by_name: string | null;
  
  // Phase 3
  phase_3_measurements: Measurement[];
  phase_3_statistical_analysis: Record<string, any>;
  phase_3_conclusion: string | null;
  phase_3_assessed_at: string | null;
  phase_3_assessed_by_id: string | null;
  phase_3_assessed_by_name: string | null;
  
  // Measures
  planned_measures: ProtectiveMeasure[];
  implemented_measures: ProtectiveMeasure[];
  required_ppe: string[];
  
  // Health monitoring
  health_monitoring_required: boolean;
  health_monitoring_details: string | null;
  
  status: 'draft' | 'in_progress' | 'completed' | 'needs_review';
  created_at: string;
  updated_at: string;
}

// Get risk assessment for a specific chemical entry (either source)
export const useChemicalRiskAssessment = (
  chemicalEntryId: string | null,
  source: 'global' | 'ik_hms' = 'global'
) => {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["chemical-risk-assessment", chemicalEntryId, source],
    queryFn: async () => {
      if (!chemicalEntryId || !company?.id) return null;

      const column = source === 'ik_hms' 
        ? 'ik_hms_stoffkartotek_id' 
        : 'company_chemical_entry_id';

      const { data, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .select("*")
        .eq(column, chemicalEntryId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      const record = data as any;
      return {
        ...record,
        work_tasks: Array.isArray(record.work_tasks) ? record.work_tasks : [],
        existing_measures: Array.isArray(record.existing_measures) ? record.existing_measures : [],
        planned_measures: Array.isArray(record.planned_measures) ? record.planned_measures : [],
        implemented_measures: Array.isArray(record.implemented_measures) ? record.implemented_measures : [],
        required_ppe: Array.isArray(record.required_ppe) ? record.required_ppe : [],
        phase_2_measurements: Array.isArray(record.phase_2_measurements) ? record.phase_2_measurements : [],
        phase_3_measurements: Array.isArray(record.phase_3_measurements) ? record.phase_3_measurements : [],
      } as ChemicalRiskAssessment;
    },
    enabled: !!chemicalEntryId && !!company?.id,
  });
};

// Get all chemical risk assessments for a project
export const useProjectChemicalRiskAssessments = (projectId: string | null) => {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["project-chemical-risk-assessments", projectId, company?.id],
    queryFn: async () => {
      if (!projectId || !company?.id) return [];

      const { data, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .select(`
          *,
          company_chemical_entries:company_chemical_entry_id(
            *,
            global_chemicals:global_chemical_id(*)
          )
        `)
        .eq("company_id", company.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!projectId && !!company?.id,
  });
};

// Get all chemical risk assessments for the company (for Risikoanalyse page)
export const useCompanyChemicalRiskAssessments = () => {
  const { company } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();

  return useQuery({
    queryKey: ["company-chemical-risk-assessments", company?.id, filterDepartmentId],
    queryFn: async () => {
      if (!company?.id) return [];

      let q = supabase
        .from("chemical_risk_assessments" as any)
        .select(`
          *,
          company_chemical_entries:company_chemical_entry_id(
            *,
            global_chemicals:global_chemical_id(*)
          )
        `)
        .eq("company_id", company.id);
      q = filterDepartmentId
        ? q.eq("department_id", filterDepartmentId)
        : q.is("department_id", null);
      const { data, error } = await q.order("updated_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!company?.id,
  });
};

// Hook for CRUD operations
export const useChemicalRiskAssessmentMutations = (
  projectId: string | null,
  source: 'global' | 'ik_hms' = 'global'
) => {
  const queryClient = useQueryClient();
  const { company, profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

  // Create or initialize assessment
  const createAssessment = useMutation({
    mutationFn: async (chemicalEntryId: string) => {
      if (!company?.id) throw new Error("Mangler bedrift");

      const insertData: any = {
        company_id: company.id,
        department_id: filterDepartmentId,
        project_id: projectId,
        current_phase: 1,
        status: 'draft',
      };

      // Set the correct foreign key based on source
      if (source === 'ik_hms') {
        insertData.ik_hms_stoffkartotek_id = chemicalEntryId;
      } else {
        insertData.company_chemical_entry_id = chemicalEntryId;
      }

      const { data, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Already exists, fetch it
          const column = source === 'ik_hms' 
            ? 'ik_hms_stoffkartotek_id' 
            : 'company_chemical_entry_id';
          
          const { data: existing } = await supabase
            .from("chemical_risk_assessments" as any)
            .select("*")
            .eq(column, chemicalEntryId)
            .single();
          return existing;
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chemical-risk-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["project-chemical-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-chemical-risk-assessments"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke opprette risikovurdering");
    },
  });

  // Update Phase 1
  const updatePhase1 = useMutation({
    mutationFn: async ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: Partial<ChemicalRiskAssessment>;
    }) => {
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // If completing phase 1
      if (data.phase_1_completed) {
        updateData.phase_1_assessed_at = new Date().toISOString();
        updateData.phase_1_assessed_by_id = profile?.id;
        updateData.phase_1_assessed_by_name = userName;
        updateData.status = data.phase_1_needs_further_assessment ? 'in_progress' : 'completed';
      }

      const { data: result, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .update(updateData)
        .eq("id", assessmentId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chemical-risk-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["project-chemical-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-chemical-risk-assessments"] });
      toast.success("Risikovurdering oppdatert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke oppdatere");
    },
  });

  // Update Phase 2
  const updatePhase2 = useMutation({
    mutationFn: async ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: Partial<ChemicalRiskAssessment>;
    }) => {
      const updateData: any = {
        ...data,
        current_phase: 2,
        updated_at: new Date().toISOString(),
      };

      if (data.phase_2_completed) {
        updateData.phase_2_assessed_at = new Date().toISOString();
        updateData.phase_2_assessed_by_id = profile?.id;
        updateData.phase_2_assessed_by_name = userName;
        updateData.status = data.phase_2_needs_detailed_assessment ? 'in_progress' : 'completed';
      }

      const { data: result, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .update(updateData)
        .eq("id", assessmentId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chemical-risk-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["project-chemical-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-chemical-risk-assessments"] });
      toast.success("Fase 2 oppdatert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke oppdatere");
    },
  });

  // Update Phase 3
  const updatePhase3 = useMutation({
    mutationFn: async ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: Partial<ChemicalRiskAssessment>;
    }) => {
      const updateData: any = {
        ...data,
        current_phase: 3,
        updated_at: new Date().toISOString(),
      };

      if (data.phase_3_completed) {
        updateData.phase_3_assessed_at = new Date().toISOString();
        updateData.phase_3_assessed_by_id = profile?.id;
        updateData.phase_3_assessed_by_name = userName;
        updateData.status = 'completed';
      }

      const { data: result, error } = await supabase
        .from("chemical_risk_assessments" as any)
        .update(updateData)
        .eq("id", assessmentId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chemical-risk-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["project-chemical-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-chemical-risk-assessments"] });
      toast.success("Fase 3 oppdatert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke oppdatere");
    },
  });

  // Delete assessment
  const deleteAssessment = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase
        .from("chemical_risk_assessments" as any)
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chemical-risk-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["project-chemical-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-chemical-risk-assessments"] });
      toast.success("Risikovurdering slettet");
    },
    onError: () => {
      toast.error("Kunne ikke slette risikovurdering");
    },
  });

  return {
    createAssessment: createAssessment.mutateAsync,
    updatePhase1: updatePhase1.mutate,
    updatePhase2: updatePhase2.mutate,
    updatePhase3: updatePhase3.mutate,
    deleteAssessment: deleteAssessment.mutate,
    isCreating: createAssessment.isPending,
    isUpdating: updatePhase1.isPending || updatePhase2.isPending || updatePhase3.isPending,
    isDeleting: deleteAssessment.isPending,
  };
};

// Helper function to calculate risk level
export const calculateChemicalRiskLevel = (severity: number, probability: number) => {
  if (!severity || !probability) {
    return { level: "Ikke vurdert", color: "text-muted-foreground", bg: "bg-muted", score: 0 };
  }
  
  const score = severity * probability;
  
  if (score <= 5) {
    return { level: "Akseptabel", color: "text-green-700", bg: "bg-green-100", score };
  }
  if (score <= 10) {
    return { level: "Bør vurderes", color: "text-yellow-700", bg: "bg-yellow-100", score };
  }
  return { level: "Tiltak påkrevd", color: "text-red-700", bg: "bg-red-100", score };
};
