import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface HmsSjaRisk {
  id: string;
  description: string;
  probability: number;
  consequence: number;
}

export interface HmsSjaMeasure {
  id: string;
  riskId: string;
  description: string;
  responsible: string;
}

export interface HmsSja {
  id: string;
  company_id: string;
  sja_number: string;
  title: string;
  description: string | null;
  location: string | null;
  planned_date: string | null;
  responsible_name: string | null;
  responsible_id: string | null;
  participants: string | null;
  work_description: string | null;
  risks: HmsSjaRisk[];
  measures: HmsSjaMeasure[];
  emergency_procedures: string | null;
  ppe_required: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  completed_at: string | null;
  completed_by_id: string | null;
  completed_by_name: string | null;
  leader_signature: string | null;
  participants_signatures: { name: string; signature: string }[];
  created_at: string;
  updated_at: string;
}

export interface CreateHmsSjaInput {
  title: string;
  description?: string;
  location?: string;
  planned_date?: string;
  responsible_name?: string;
  responsible_id?: string;
  participants?: string;
  work_description?: string;
  risks?: HmsSjaRisk[];
  measures?: HmsSjaMeasure[];
  emergency_procedures?: string;
  ppe_required?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export function useHmsSja() {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { data: sjaList = [], isLoading, refetch } = useQuery({
    queryKey: ["hms-sja", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("hms_sja")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        risks: (item.risks as unknown as HmsSjaRisk[]) || [],
        measures: (item.measures as unknown as HmsSjaMeasure[]) || [],
        participants_signatures: (item.participants_signatures as unknown as { name: string; signature: string }[]) || [],
      })) as HmsSja[];
    },
    enabled: !!company?.id,
  });

  const createSja = useMutation({
    mutationFn: async (input: CreateHmsSjaInput) => {
      if (!company?.id) throw new Error("No company");
      
      const { data, error } = await supabase
        .from("hms_sja")
        .insert([{
          company_id: company.id,
          sja_number: "",
          title: input.title,
          description: input.description || null,
          location: input.location || null,
          planned_date: input.planned_date || null,
          responsible_name: input.responsible_name || null,
          responsible_id: input.responsible_id || null,
          participants: input.participants || null,
          work_description: input.work_description || null,
          risks: (input.risks || []) as unknown as Json,
          measures: (input.measures || []) as unknown as Json,
          emergency_procedures: input.emergency_procedures || null,
          ppe_required: input.ppe_required || null,
          risk_level: input.risk_level || 'medium',
          status: 'draft',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja", company?.id] });
      toast.success("SJA opprettet");
    },
    onError: (error) => {
      console.error("Error creating SJA:", error);
      toast.error("Kunne ikke opprette SJA");
    },
  });

  const updateSja = useMutation({
    mutationFn: async ({ id, risks, measures, ...updates }: Partial<HmsSja> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (risks) updateData.risks = risks as unknown as Record<string, unknown>[];
      if (measures) updateData.measures = measures as unknown as Record<string, unknown>[];
      
      const { data, error } = await supabase
        .from("hms_sja")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja", company?.id] });
      toast.success("SJA oppdatert");
    },
    onError: (error) => {
      console.error("Error updating SJA:", error);
      toast.error("Kunne ikke oppdatere SJA");
    },
  });

  const deleteSja = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hms_sja")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja", company?.id] });
      toast.success("SJA slettet");
    },
    onError: (error) => {
      console.error("Error deleting SJA:", error);
      toast.error("Kunne ikke slette SJA");
    },
  });

  const completeSja = useMutation({
    mutationFn: async ({ 
      id, 
      leaderSignature, 
      participantsSignatures,
      completedByName 
    }: { 
      id: string; 
      leaderSignature: string;
      participantsSignatures?: { name: string; signature: string }[];
      completedByName: string;
    }) => {
      const { data, error } = await supabase
        .from("hms_sja")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_name: completedByName,
          leader_signature: leaderSignature,
          participants_signatures: participantsSignatures || [],
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hms-sja", company?.id] });
      toast.success("SJA fullført og signert");
    },
    onError: (error) => {
      console.error("Error completing SJA:", error);
      toast.error("Kunne ikke fullføre SJA");
    },
  });

  return {
    sjaList,
    isLoading,
    refetch,
    createSja,
    updateSja,
    deleteSja,
    completeSja,
  };
}
