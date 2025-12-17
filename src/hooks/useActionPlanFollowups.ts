import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ActionPlanFollowup {
  id: string;
  company_id: string;
  action_id: string;
  action_description: string;
  risk_description: string | null;
  followup_date: string;
  followup_type: 'status_check' | 'verification' | 'audit' | 'review';
  notes: string | null;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  completed_at: string | null;
  completed_by_id: string | null;
  completed_by_name: string | null;
  reminder_enabled: boolean;
  reminder_days_before: number;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFollowupInput {
  action_id: string;
  action_description: string;
  risk_description?: string;
  followup_date: string;
  followup_type?: 'status_check' | 'verification' | 'audit' | 'review';
  notes?: string;
  reminder_enabled?: boolean;
  reminder_days_before?: number;
}

export function useActionPlanFollowups() {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: followups = [], isLoading, refetch } = useQuery({
    queryKey: ["action-plan-followups", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("action_plan_followups")
        .select("*")
        .eq("company_id", company.id)
        .order("followup_date", { ascending: true });
      
      if (error) throw error;
      return data as ActionPlanFollowup[];
    },
    enabled: !!company?.id,
  });

  const createFollowup = useMutation({
    mutationFn: async (input: CreateFollowupInput) => {
      if (!company?.id) throw new Error("No company");
      
      const { data, error } = await supabase
        .from("action_plan_followups")
        .insert({
          company_id: company.id,
          action_id: input.action_id,
          action_description: input.action_description,
          risk_description: input.risk_description || null,
          followup_date: input.followup_date,
          followup_type: input.followup_type || 'status_check',
          notes: input.notes || null,
          reminder_enabled: input.reminder_enabled ?? true,
          reminder_days_before: input.reminder_days_before ?? 7,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plan-followups", company?.id] });
      toast.success("Oppfølging opprettet");
    },
    onError: (error) => {
      console.error("Error creating followup:", error);
      toast.error("Kunne ikke opprette oppfølging");
    },
  });

  const updateFollowup = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ActionPlanFollowup> & { id: string }) => {
      const { data, error } = await supabase
        .from("action_plan_followups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plan-followups", company?.id] });
      toast.success("Oppfølging oppdatert");
    },
    onError: (error) => {
      console.error("Error updating followup:", error);
      toast.error("Kunne ikke oppdatere oppfølging");
    },
  });

  const completeFollowup = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("action_plan_followups")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_id: profile?.id,
          completed_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Ukjent',
          notes: notes || null,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plan-followups", company?.id] });
      toast.success("Oppfølging fullført");
    },
    onError: (error) => {
      console.error("Error completing followup:", error);
      toast.error("Kunne ikke fullføre oppfølging");
    },
  });

  const deleteFollowup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("action_plan_followups")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plan-followups", company?.id] });
      toast.success("Oppfølging slettet");
    },
    onError: (error) => {
      console.error("Error deleting followup:", error);
      toast.error("Kunne ikke slette oppfølging");
    },
  });

  // Get upcoming followups (next 7 days)
  const upcomingFollowups = followups.filter(f => {
    if (f.status !== 'pending') return false;
    const date = new Date(f.followup_date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return date >= today && date <= nextWeek;
  });

  // Get overdue followups
  const overdueFollowups = followups.filter(f => {
    if (f.status !== 'pending') return false;
    const date = new Date(f.followup_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  });

  return {
    followups,
    upcomingFollowups,
    overdueFollowups,
    isLoading,
    refetch,
    createFollowup,
    updateFollowup,
    completeFollowup,
    deleteFollowup,
  };
}
