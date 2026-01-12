import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface RiskFactor {
  id: string;
  category: string;
  description: string;
  severity: "lav" | "moderat" | "hoy";
}

export interface RequiredMeasure {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  completed: boolean;
}

export interface TrainingTopic {
  id: string;
  topic: string;
  hours: number;
}

export interface Forsvarlighetsvurdering {
  id: string;
  company_id: string;
  department_id: string | null;
  assessment_number: string;
  assessment_date: string;
  assessment_type: "kortere_opplaring" | "arbeidstid" | "annet";
  title: string;
  description: string | null;
  employer_name: string;
  employer_title: string | null;
  verneombud_name: string | null;
  tillitsvalgt_name: string | null;
  other_participants: string | null;
  risk_factors: RiskFactor[];
  risk_level: "lav" | "moderat" | "hoy" | null;
  risk_justification: string | null;
  proposed_training_hours: number | null;
  training_justification: string | null;
  training_topics: TrainingTopic[];
  work_schedule_description: string | null;
  fatigue_assessment: string | null;
  work_life_balance_assessment: string | null;
  conclusion: "forsvarlig" | "ikke_forsvarlig" | "forsvarlig_med_tiltak";
  conclusion_justification: string | null;
  required_measures: RequiredMeasure[];
  next_review_date: string | null;
  review_frequency: string | null;
  employer_signature: string | null;
  employer_signed_at: string | null;
  verneombud_signature: string | null;
  verneombud_signed_at: string | null;
  tillitsvalgt_signature: string | null;
  tillitsvalgt_signed_at: string | null;
  status: "draft" | "pending_signatures" | "completed" | "archived";
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  created_by_name: string | null;
}

export type ForsvarlighetsvurderingInsert = Omit<
  Forsvarlighetsvurdering,
  "id" | "assessment_number" | "created_at" | "updated_at"
>;

export function useForsvarlighetsvurderinger() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: vurderinger = [], isLoading } = useQuery({
    queryKey: ["forsvarlighetsvurderinger", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("hms_forsvarlighetsvurderinger")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching forsvarlighetsvurderinger:", error);
        throw error;
      }

      return (data || []).map((item) => ({
        ...item,
        risk_factors: (item.risk_factors as unknown as RiskFactor[]) || [],
        training_topics: (item.training_topics as unknown as TrainingTopic[]) || [],
        required_measures: (item.required_measures as unknown as RequiredMeasure[]) || [],
      })) as Forsvarlighetsvurdering[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ForsvarlighetsvurderingInsert>) => {
      if (!companyId || !profile) throw new Error("Mangler bedrifts-ID");

      const insertData = {
        company_id: companyId,
        assessment_number: "", // Will be auto-generated
        assessment_date: data.assessment_date || new Date().toISOString().split("T")[0],
        assessment_type: data.assessment_type || "kortere_opplaring",
        title: data.title || "Ny forsvarlighetsvurdering",
        description: data.description || null,
        employer_name: data.employer_name || "",
        employer_title: data.employer_title || null,
        verneombud_name: data.verneombud_name || null,
        tillitsvalgt_name: data.tillitsvalgt_name || null,
        other_participants: data.other_participants || null,
        risk_factors: (data.risk_factors || []) as unknown as Json,
        risk_level: data.risk_level || null,
        risk_justification: data.risk_justification || null,
        proposed_training_hours: data.proposed_training_hours || null,
        training_justification: data.training_justification || null,
        training_topics: (data.training_topics || []) as unknown as Json,
        work_schedule_description: data.work_schedule_description || null,
        fatigue_assessment: data.fatigue_assessment || null,
        work_life_balance_assessment: data.work_life_balance_assessment || null,
        conclusion: data.conclusion || "forsvarlig",
        conclusion_justification: data.conclusion_justification || null,
        required_measures: (data.required_measures || []) as unknown as Json,
        next_review_date: data.next_review_date || null,
        review_frequency: data.review_frequency || null,
        status: data.status || "draft",
        created_by_id: profile.id,
        created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
      };

      const { data: result, error } = await supabase
        .from("hms_forsvarlighetsvurderinger")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forsvarlighetsvurderinger", companyId] });
      toast.success("Forsvarlighetsvurdering opprettet");
    },
    onError: (error) => {
      console.error("Error creating forsvarlighetsvurdering:", error);
      toast.error("Kunne ikke opprette forsvarlighetsvurdering");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, risk_factors, training_topics, required_measures, ...data }: Partial<Forsvarlighetsvurdering> & { id: string }) => {
      const updateData = {
        ...data,
        risk_factors: risk_factors ? (risk_factors as unknown as Json) : undefined,
        training_topics: training_topics ? (training_topics as unknown as Json) : undefined,
        required_measures: required_measures ? (required_measures as unknown as Json) : undefined,
      };
      const { error } = await supabase
        .from("hms_forsvarlighetsvurderinger")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forsvarlighetsvurderinger", companyId] });
      toast.success("Forsvarlighetsvurdering oppdatert");
    },
    onError: (error) => {
      console.error("Error updating forsvarlighetsvurdering:", error);
      toast.error("Kunne ikke oppdatere forsvarlighetsvurdering");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hms_forsvarlighetsvurderinger")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forsvarlighetsvurderinger", companyId] });
      toast.success("Forsvarlighetsvurdering slettet");
    },
    onError: (error) => {
      console.error("Error deleting forsvarlighetsvurdering:", error);
      toast.error("Kunne ikke slette forsvarlighetsvurdering");
    },
  });

  return {
    vurderinger,
    isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
