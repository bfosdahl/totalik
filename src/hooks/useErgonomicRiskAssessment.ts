import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type ErgonomicAssessmentType = "muskel_skjelett" | "vibrasjon" | "stoy";
export type ErgonomicAssessmentStatus = "draft" | "in_progress" | "completed" | "needs_review";

export interface RiskFactor {
  factor: string;
  frequency: string;
  duration: string;
  intensity: string;
  description?: string;
}

export interface ProtectiveMeasure {
  measure: string;
  implemented: boolean;
  responsible?: string;
  deadline?: string;
}

export interface ErgonomicRiskAssessment {
  id: string;
  company_id: string;
  department_id?: string;
  project_id?: string;
  assessment_type: ErgonomicAssessmentType[];
  equipment?: string[];
  title: string;
  description?: string;
  work_area?: string;
  job_role?: string;
  risk_factors: RiskFactor[];
  exposed_workers_count?: number;
  exposure_frequency?: string;
  exposure_duration?: string;
  vibration_type?: string;
  vibration_level?: number;
  vibration_exposure_time?: number;
  vibration_equipment?: string[];
  noise_level?: number;
  noise_peak_level?: number;
  noise_exposure_time?: number;
  noise_sources?: string[];
  consequence_severity?: number;
  probability?: number;
  risk_score?: number;
  risk_level?: string;
  existing_measures: ProtectiveMeasure[];
  required_ppe: string[];
  planned_measures: ProtectiveMeasure[];
  implemented_measures: ProtectiveMeasure[];
  health_monitoring_required: boolean;
  health_monitoring_details?: string;
  assessed_by_id?: string;
  assessed_by_name?: string;
  assessed_at?: string;
  conclusion?: string;
  recommendations?: string;
  follow_up_date?: string;
  status: ErgonomicAssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateErgonomicAssessmentInput {
  assessment_type: ErgonomicAssessmentType[];
  title: string;
  description?: string;
  work_area?: string;
  job_role?: string;
  equipment?: string[];
}

export interface UpdateErgonomicAssessmentInput extends Partial<Omit<ErgonomicRiskAssessment, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'risk_score' | 'risk_level'>> {
  id: string;
}

// Helper to convert DB response to typed interface
function mapDbToAssessment(data: any): ErgonomicRiskAssessment {
  return {
    ...data,
    assessment_type: (data.assessment_type as ErgonomicAssessmentType[]) || [],
    equipment: (data.equipment as string[]) || [],
    status: data.status as ErgonomicAssessmentStatus,
    risk_factors: (data.risk_factors as RiskFactor[]) || [],
    existing_measures: (data.existing_measures as ProtectiveMeasure[]) || [],
    required_ppe: (data.required_ppe as string[]) || [],
    planned_measures: (data.planned_measures as ProtectiveMeasure[]) || [],
    implemented_measures: (data.implemented_measures as ProtectiveMeasure[]) || [],
    vibration_equipment: (data.vibration_equipment as string[]) || [],
    noise_sources: (data.noise_sources as string[]) || [],
  };
}

export function useErgonomicRiskAssessments() {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["ergonomic-risk-assessments", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from("ergonomic_risk_assessments")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbToAssessment);
    },
    enabled: !!company?.id,
  });
}

export function useErgonomicRiskAssessment(assessmentId: string | null) {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["ergonomic-risk-assessment", assessmentId],
    queryFn: async () => {
      if (!assessmentId || !company?.id) return null;

      const { data, error } = await supabase
        .from("ergonomic_risk_assessments")
        .select("*")
        .eq("id", assessmentId)
        .eq("company_id", company.id)
        .single();

      if (error) throw error;
      return mapDbToAssessment(data);
    },
    enabled: !!assessmentId && !!company?.id,
  });
}

export function useCreateErgonomicAssessment() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateErgonomicAssessmentInput) => {
      if (!company?.id) throw new Error("Ingen bedrift valgt");

      const { data, error } = await supabase
        .from("ergonomic_risk_assessments")
        .insert({
          company_id: company.id,
          assessment_type: input.assessment_type,
          title: input.title,
          description: input.description,
          work_area: input.work_area,
          job_role: input.job_role,
          equipment: input.equipment || [],
          status: "draft",
          risk_factors: [],
          existing_measures: [],
          required_ppe: [],
          planned_measures: [],
          implemented_measures: [],
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToAssessment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ergonomic-risk-assessments"] });
      toast.success("Risikovurdering opprettet");
    },
    onError: (error) => {
      console.error("Failed to create assessment:", error);
      toast.error("Kunne ikke opprette risikovurdering");
    },
  });
}

export function useUpdateErgonomicAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateErgonomicAssessmentInput) => {
      const { id, ...updates } = input;

      // Convert typed arrays to Json for Supabase
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.risk_factors) {
        dbUpdates.risk_factors = updates.risk_factors as unknown as Json;
      }
      if (updates.existing_measures) {
        dbUpdates.existing_measures = updates.existing_measures as unknown as Json;
      }
      if (updates.planned_measures) {
        dbUpdates.planned_measures = updates.planned_measures as unknown as Json;
      }
      if (updates.implemented_measures) {
        dbUpdates.implemented_measures = updates.implemented_measures as unknown as Json;
      }
      if (updates.required_ppe) {
        dbUpdates.required_ppe = updates.required_ppe as unknown as Json;
      }

      const { data, error } = await supabase
        .from("ergonomic_risk_assessments")
        .update(dbUpdates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToAssessment(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ergonomic-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["ergonomic-risk-assessment", data.id] });
      toast.success("Risikovurdering oppdatert");
    },
    onError: (error) => {
      console.error("Failed to update assessment:", error);
      toast.error("Kunne ikke oppdatere risikovurdering");
    },
  });
}

export function useDeleteErgonomicAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase
        .from("ergonomic_risk_assessments")
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ergonomic-risk-assessments"] });
      toast.success("Risikovurdering slettet");
    },
    onError: (error) => {
      console.error("Failed to delete assessment:", error);
      toast.error("Kunne ikke slette risikovurdering");
    },
  });
}

// Helper function to calculate risk level
export function calculateErgonomicRiskLevel(severity: number, probability: number) {
  const score = severity * probability;
  
  if (score === 0) {
    return { score: 0, level: "Ikke vurdert", color: "text-muted-foreground", bg: "bg-muted" };
  }
  if (score <= 4) {
    return { score, level: "Lav", color: "text-green-700", bg: "bg-green-100" };
  }
  if (score <= 10) {
    return { score, level: "Middels", color: "text-yellow-700", bg: "bg-yellow-100" };
  }
  return { score, level: "Høy", color: "text-red-700", bg: "bg-red-100" };
}

// Predefined risk factors by assessment type
export const MUSKEL_SKJELETT_RISK_FACTORS = [
  "Tunge løft",
  "Bæring",
  "Skyving og trekking",
  "Ensidige gjentakende bevegelser",
  "Arbeid over skulderhøyde",
  "Arbeid i fremoverbøyd stilling",
  "Arbeid på huk eller knær",
  "Stående arbeid over lengre tid",
  "Sittende arbeid uten variasjon",
  "Vridning av kroppen",
  "Statisk belastning",
  "Høyt arbeidstempo",
];

export const VIBRASJON_RISK_FACTORS = [
  "Hånd-arm vibrasjoner fra verktøy",
  "Helkroppsvibrasjoner fra kjøretøy",
  "Langvarig eksponering",
  "Kulde som forsterker effekten",
  "Manglende vibrasjonsdempende utstyr",
];

export const STOY_RISK_FACTORS = [
  "Konstant støy over 80 dB",
  "Impulsstøy (slag, smell)",
  "Langvarig eksponering",
  "Manglende hørselvern",
  "Støy som hindrer kommunikasjon",
  "Støy fra maskiner og utstyr",
];

export const EXPOSURE_FREQUENCY_OPTIONS = [
  { value: "daglig", label: "Daglig" },
  { value: "ukentlig", label: "Ukentlig" },
  { value: "maanedlig", label: "Månedlig" },
  { value: "sjelden", label: "Sjelden" },
];

export const EXPOSURE_DURATION_OPTIONS = [
  { value: "<1_time", label: "Mindre enn 1 time" },
  { value: "1-2_timer", label: "1-2 timer" },
  { value: "2-4_timer", label: "2-4 timer" },
  { value: ">4_timer", label: "Mer enn 4 timer" },
];

export const PPE_OPTIONS = {
  muskel_skjelett: [
    "Kneputesett",
    "Løftebelte",
    "Ergonomiske hjelpemidler",
    "Regulerbart arbeidsutstyr",
  ],
  vibrasjon: [
    "Vibrasjonsdempende hansker",
    "Anti-vibrasjonshåndtak",
    "Vibrasjonsdempende sete",
  ],
  stoy: [
    "Ørepropper",
    "Øreklokker",
    "Støydempende kommunikasjonsutstyr",
  ],
};
