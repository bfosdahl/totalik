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

export interface OrganizationData {
  template_id: string | null;
  custom_content: string;
  is_custom: boolean;
}

export interface RiskItem {
  id: string;
  description: string;
  consequence: number;
  probability: number;
  existing_measures: string;
  planned_measures: string;
}

export interface RiskAssessmentData {
  risks: RiskItem[];
}

export interface RoutineItem {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

export interface RoutinesData {
  routines: RoutineItem[];
}

export interface ActionItem {
  id: string;
  risk_id: string | null;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: "ikke_startet" | "pågår" | "fullført";
  priority: "lav" | "medium" | "høy" | "kritisk";
  comments: string;
}

export interface ActionPlanData {
  actions: ActionItem[];
}

export interface CompanyInfo {
  id: string;
  name: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo_url?: string | null;
}

export interface WizardProgress {
  current_step: number;
  completed_steps: string[];
  is_completed: boolean;
}

export function useSetupWizard() {
  const { profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [dataLoading, setDataLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [goals, setGoals] = useState<CompanyGoal[]>([]);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentData | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanData | null>(null);
  const [routines, setRoutines] = useState<RoutinesData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [progress, setProgress] = useState<WizardProgress>({
    current_step: 0,
    completed_steps: [],
    is_completed: false,
  });

  const companyId = profile?.company_id;
  
  // isLoading is true while auth is loading OR while data is loading
  const isLoading = authLoading || dataLoading;

  // Load wizard progress, goals, organization, and risk assessment
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If no company ID, nothing to load
    if (!companyId) {
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      console.log("[useSetupWizard] Starting data load for company:", companyId);
      console.log("[useSetupWizard] Auth loading state:", authLoading);
      try {
        // Load progress
        const { data: progressData, error: progressError } = await supabase
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
        const { data: goalsData, error: goalsError } = await supabase
          .from("company_goals")
          .select("*")
          .eq("company_id", companyId)
          .order("sort_order");

        if (goalsData) {
          setGoals(goalsData);
        }

        // Load organization
        const { data: orgData, error: orgError } = await supabase
          .from("company_organization")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

        if (orgData) {
          setOrganization({
            template_id: orgData.template_id,
            custom_content: orgData.custom_content,
            is_custom: orgData.is_custom || false,
          });
        }

        // Load risk assessment
        const { data: riskData, error: riskError } = await supabase
          .from("company_risk_assessments")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

        if (riskData && riskData.risks) {
          setRiskAssessment({
            risks: riskData.risks as unknown as RiskItem[],
          });
        }

        // Load action plans
        const { data: actionPlanData } = await supabase
          .from("company_action_plans")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

        if (actionPlanData && actionPlanData.actions) {
          setActionPlan({
            actions: actionPlanData.actions as unknown as ActionItem[],
          });
        }

        // Load routines
        const { data: routinesData } = await supabase
          .from("company_routines")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

        if (routinesData && routinesData.routines) {
          // Transform routines to ensure consistent field names
          const rawRoutines = routinesData.routines as unknown as Record<string, unknown>[];
          const transformedRoutines = rawRoutines.map((routine, index) => ({
            id: (routine.id as string) || `routine-${index + 1}`,
            routine_number: (routine.routine_number as string) || `R${(index + 1).toString().padStart(3, '0')}`,
            routine_name: (routine.routine_name as string) || (routine.name as string) || 'Ukjent rutine',
            category: (routine.category as string) || 'Generelt',
            purpose: (routine.purpose as string) || (routine.description as string) || '',
            responsibility: (routine.responsibility as string) || (routine.responsible as string) || '',
            procedure: (routine.procedure as string) || '',
            examples: (routine.examples as string) || '',
            remember: (routine.remember as string) || '',
            is_predefined: (routine.is_predefined as boolean) ?? false,
          }));
          setRoutines({
            routines: transformedRoutines,
          });
        }

        // Load company info
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, org_number, address, postal_code, city, phone, email, logo_url")
          .eq("id", companyId)
          .maybeSingle();

        if (companyData) {
          setCompanyInfo({
            id: companyData.id,
            name: companyData.name,
            org_number: companyData.org_number || undefined,
            address: companyData.address || undefined,
            postal_code: companyData.postal_code || undefined,
            city: companyData.city || undefined,
            phone: companyData.phone || undefined,
            email: companyData.email || undefined,
            logo_url: companyData.logo_url,
          });
        }
        console.log("[useSetupWizard] Data loaded successfully:", {
          companyId,
          goalsCount: goalsData?.length ?? 0,
          hasOrg: !!orgData,
          risksCount: (riskData?.risks as any[])?.length ?? 0,
          actionsCount: (actionPlanData?.actions as any[])?.length ?? 0,
          routinesCount: (routinesData?.routines as any[])?.length ?? 0
        });
      } catch (error) {
        console.error("[useSetupWizard] Error loading wizard data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [companyId, authLoading]);

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

  // Save organization
  const saveOrganization = useCallback(async (data: OrganizationData) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_organization")
        .upsert({
          company_id: companyId,
          template_id: data.template_id,
          custom_content: data.custom_content,
          is_custom: data.is_custom,
        }, { onConflict: "company_id" });

      if (error) throw error;
      setOrganization(data);

      toast({
        title: "Lagret",
        description: "Organiseringen er lagret.",
      });
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre organisering. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyId, toast]);

  // Save risk assessment
  const saveRiskAssessment = useCallback(async (data: RiskAssessmentData) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_risk_assessments")
        .upsert({
          company_id: companyId,
          risks: JSON.parse(JSON.stringify(data.risks)),
        }, { onConflict: "company_id" });

      if (error) throw error;
      setRiskAssessment(data);

      toast({
        title: "Lagret",
        description: "Risikovurderingen er lagret.",
      });
    } catch (error) {
      console.error("Error saving risk assessment:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre risikovurdering. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyId, toast]);

  // Save action plan
  const saveActionPlan = useCallback(async (data: ActionPlanData) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_action_plans")
        .upsert({
          company_id: companyId,
          actions: JSON.parse(JSON.stringify(data.actions)),
        }, { onConflict: "company_id" });

      if (error) throw error;
      setActionPlan(data);

      toast({
        title: "Lagret",
        description: "Handlingsplanen er lagret.",
      });
    } catch (error) {
      console.error("Error saving action plan:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre handlingsplan. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyId, toast]);

  // Save routines
  const saveRoutines = useCallback(async (data: RoutinesData) => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_routines")
        .upsert({
          company_id: companyId,
          routines: JSON.parse(JSON.stringify(data.routines)),
        }, { onConflict: "company_id" });

      if (error) throw error;
      setRoutines(data);

      toast({
        title: "Lagret",
        description: "Rutinene er lagret.",
      });
    } catch (error) {
      console.error("Error saving routines:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre rutiner. Prøv igjen.",
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
    organization,
    riskAssessment,
    actionPlan,
    routines,
    companyInfo,
    progress,
    companyId,
    saveProgress,
    saveGoals,
    saveOrganization,
    saveRiskAssessment,
    saveActionPlan,
    saveRoutines,
    completeStep,
  };
}
