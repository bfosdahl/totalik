import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CompanyKsGoal {
  id: string;
  company_id: string;
  goal_text: string;
  description: string | null;
  target_date: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCompanyKsGoals() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  
  const [goals, setGoals] = useState<CompanyKsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_goals")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching KS goals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (goalText: string, description?: string) => {
    if (!companyId) return null;
    
    setIsSaving(true);
    try {
      const maxOrder = goals.length > 0 
        ? Math.max(...goals.map(g => g.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("company_ks_goals")
        .insert({
          company_id: companyId,
          goal_text: goalText,
          description: description || null,
          sort_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      
      setGoals(prev => [...prev, data]);
      toast({ title: "Kvalitetsmål opprettet" });
      return data;
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({ title: "Kunne ikke opprette mål", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateGoal = async (id: string, updates: Partial<CompanyKsGoal>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
      toast({ title: "Mål oppdatert" });
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({ title: "Kunne ikke oppdatere mål", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "Mål slettet" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ title: "Kunne ikke slette mål", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const reorderGoals = async (reorderedGoals: CompanyKsGoal[]) => {
    setGoals(reorderedGoals);
    
    try {
      const updates = reorderedGoals.map((goal, index) => ({
        id: goal.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("company_ks_goals")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    } catch (error) {
      console.error("Error reordering goals:", error);
      fetchGoals();
    }
  };

  return {
    goals,
    isLoading,
    isSaving,
    createGoal,
    updateGoal,
    deleteGoal,
    reorderGoals,
    refetch: fetchGoals,
  };
}
