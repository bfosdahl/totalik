import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CompanyGoal {
  id: string;
  goal_text: string;
  is_predefined: boolean;
  sort_order: number;
}

export interface WizardProgress {
  current_step: number;
  completed_steps: string[];
  is_completed: boolean;
}

export function useSetupWizard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [goals, setGoals] = useState<CompanyGoal[]>([]);
  const [progress, setProgress] = useState<WizardProgress>({
    current_step: 0,
    completed_steps: [],
    is_completed: false,
  });

  const companyId = profile?.company_id;

  // Load wizard progress and goals
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load progress
        const { data: progressData } = await supabase
          .from("setup_wizard_progress")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

        if (progressData) {
          setProgress({
            current_step: progressData.current_step,
            completed_steps: progressData.completed_steps || [],
            is_completed: progressData.is_completed,
          });
        }

        // Load goals
        const { data: goalsData } = await supabase
          .from("company_goals")
          .select("*")
          .eq("company_id", companyId)
          .order("sort_order");

        if (goalsData) {
          setGoals(goalsData);
        }
      } catch (error) {
        console.error("Error loading wizard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  // Save progress
  const saveProgress = useCallback(async (newProgress: Partial<WizardProgress>) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const updatedProgress = { ...progress, ...newProgress };
      
      const { error } = await supabase
        .from("setup_wizard_progress")
        .upsert({
          company_id: companyId,
          current_step: updatedProgress.current_step,
          completed_steps: updatedProgress.completed_steps,
          is_completed: updatedProgress.is_completed,
        }, { onConflict: "company_id" });

      if (error) throw error;
      setProgress(updatedProgress);
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre fremgang. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyId, progress, toast]);

  // Save goals
  const saveGoals = useCallback(async (newGoals: Array<{ goal_text: string; is_predefined: boolean }>) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      // Delete existing goals
      await supabase
        .from("company_goals")
        .delete()
        .eq("company_id", companyId);

      // Insert new goals
      if (newGoals.length > 0) {
        const goalsToInsert = newGoals.map((goal, index) => ({
          company_id: companyId,
          goal_text: goal.goal_text,
          is_predefined: goal.is_predefined,
          sort_order: index,
        }));

        const { data, error } = await supabase
          .from("company_goals")
          .insert(goalsToInsert)
          .select();

        if (error) throw error;
        setGoals(data || []);
      } else {
        setGoals([]);
      }

      toast({
        title: "Lagret",
        description: "Målene er lagret.",
      });
    } catch (error) {
      console.error("Error saving goals:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre mål. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyId, toast]);

  // Mark step as completed
  const completeStep = useCallback(async (stepId: string) => {
    const newCompletedSteps = progress.completed_steps.includes(stepId)
      ? progress.completed_steps
      : [...progress.completed_steps, stepId];
    
    await saveProgress({ completed_steps: newCompletedSteps });
  }, [progress.completed_steps, saveProgress]);

  return {
    isLoading,
    isSaving,
    goals,
    progress,
    companyId,
    saveProgress,
    saveGoals,
    completeStep,
  };
}
