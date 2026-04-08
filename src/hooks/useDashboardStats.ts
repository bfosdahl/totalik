import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  compliancePercent: number;
  openDeviations: number;
  completedActions: number;
  dueSoon: number;
  isLoading: boolean;
  completedSteps: number;
  totalSteps: number;
}

export function useDashboardStats(): DashboardStats {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    compliancePercent: 0,
    openDeviations: 0,
    completedActions: 0,
    dueSoon: 0,
    isLoading: true,
    completedSteps: 0,
    totalSteps: 6,
  });

  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!profile?.company_id) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }
      try {
        const companyId = profile.company_id;
        const totalSteps = 6;
        
        // First check if setup wizard is completed - this is the primary indicator
        // Standard data inserted by applyDefaultHmsSetup should NOT count as completed
        // unless the user has actively completed the setup wizard
        const [
          wizardProgressResult,
          goalsResult,
          orgResult,
          riskResult,
          actionResult,
          routinesResult,
          hmsDeclarationResult,
        ] = await Promise.all([
          // Check wizard completion status
          supabase
            .from("setup_wizard_progress")
            .select("is_completed, completed_steps")
            .eq("company_id", companyId)
            .maybeSingle(),
          // 1. Goals
          supabase
            .from("company_goals")
            .select("id, is_predefined", { count: "exact" })
            .eq("company_id", companyId),
          // 2. Organization
          supabase
            .from("company_organization")
            .select("custom_content, is_custom")
            .eq("company_id", companyId)
            .maybeSingle(),
          // 3. Risk assessment
          supabase
            .from("company_risk_assessments")
            .select("risks")
            .eq("company_id", companyId)
            .maybeSingle(),
          // 4. Action plan
          supabase
            .from("company_action_plans")
            .select("actions")
            .eq("company_id", companyId)
            .maybeSingle(),
          // 5. Routines
          supabase
            .from("company_routines")
            .select("routines")
            .eq("company_id", companyId)
            .maybeSingle(),
          // 6. HMS Self declaration (handbook requirement)
          supabase
            .from("hms_self_declarations")
            .select("id")
            .eq("company_id", companyId)
            .maybeSingle(),
        ]);

        // If the wizard is marked as completed, count based on completed_steps
        const wizardCompleted = wizardProgressResult.data?.is_completed ?? false;
        const completedStepsList: string[] = wizardProgressResult.data?.completed_steps ?? [];
        
        // Count completed steps based on actual data AND wizard completion
        let completedSteps = 0;
        
        // Helper function to check if a step was completed via wizard or has non-predefined data
        const isStepCompleted = (stepId: string, hasData: boolean, hasNonPredefinedData: boolean): boolean => {
          // If wizard is completed, trust the completed_steps list
          if (wizardCompleted) {
            return completedStepsList.includes(stepId) || hasData;
          }
          // Otherwise, only count steps with non-predefined data (user actually set it up)
          // OR if the step is in completed_steps (user went through wizard manually)
          return completedStepsList.includes(stepId) || hasNonPredefinedData;
        };
        
        // 1. Goals - check if there are non-predefined goals OR step completed in wizard
        const hasGoals = (goalsResult.data?.length ?? 0) > 0;
        const hasNonPredefinedGoals = goalsResult.data?.some(g => !g.is_predefined) ?? false;
        if (isStepCompleted('goals', hasGoals, hasNonPredefinedGoals)) {
          completedSteps++;
        }
        
        // 2. Organization - check if user customized it OR step completed in wizard
        let hasOrgData = false;
        let hasCustomOrg = false;
        if (orgResult.data?.custom_content) {
          hasOrgData = true;
          // is_custom indicates user has modified the content
          hasCustomOrg = orgResult.data.is_custom ?? false;
          // Also check content for non-template data
          try {
            const parsed = JSON.parse(orgResult.data.custom_content);
            if ((parsed.roles?.length > 0) || (parsed.description?.trim().length > 0)) {
              hasOrgData = true;
            }
          } catch {
            if (orgResult.data.custom_content.trim().length > 0) {
              hasOrgData = true;
            }
          }
        }
        if (isStepCompleted('organization', hasOrgData, hasCustomOrg)) {
          completedSteps++;
        }
        
        // 3. Risk assessment - check for non-predefined risks OR step completed in wizard
        let hasRisks = false;
        let hasNonPredefinedRisks = false;
        if (riskResult.data?.risks) {
          const risks = riskResult.data.risks as Array<{ is_predefined?: boolean }>;
          if (Array.isArray(risks) && risks.length > 0) {
            hasRisks = true;
            hasNonPredefinedRisks = risks.some(r => !r.is_predefined);
          }
        }
        if (isStepCompleted('risk', hasRisks, hasNonPredefinedRisks)) {
          completedSteps++;
        }
        
        // 4. Action plan - check for non-predefined actions OR step completed in wizard
        let hasActions = false;
        let hasNonPredefinedActions = false;
        if (actionResult.data?.actions) {
          const actions = actionResult.data.actions as Array<{ is_predefined?: boolean; status?: string }>;
          if (Array.isArray(actions) && actions.length > 0) {
            hasActions = true;
            // Actions typically don't have is_predefined flag, but check for user-modified status
            hasNonPredefinedActions = actions.some(a => !a.is_predefined && a.is_predefined !== undefined) ||
              // If actions don't have is_predefined, check if they were modified (have status changed)
              actions.some(a => a.status && a.status !== 'ikke_startet');
          }
        }
        if (isStepCompleted('actions', hasActions, hasNonPredefinedActions)) {
          completedSteps++;
        }
        
        // 5. Routines - check for non-predefined routines OR step completed in wizard
        let hasRoutines = false;
        let hasNonPredefinedRoutines = false;
        if (routinesResult.data?.routines) {
          const routines = routinesResult.data.routines as Array<{ is_predefined?: boolean }>;
          if (Array.isArray(routines) && routines.length > 0) {
            hasRoutines = true;
            hasNonPredefinedRoutines = routines.some(r => !r.is_predefined);
          }
        }
        if (isStepCompleted('routines', hasRoutines, hasNonPredefinedRoutines)) {
          completedSteps++;
        }
        
        // 6. HMS declaration signed (handbook step requirement) - this is always user-action
        if (hmsDeclarationResult.data?.id) {
          completedSteps++;
        }

        const compliancePercent = Math.round((completedSteps / totalSteps) * 100);

        // Fetch open deviations count
        const { count: openDeviationsCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .in("status", ["open", "in-progress"]);

        // Fetch completed actions from action plans
        let completedActionsCount = 0;
        if (actionResult.data?.actions && Array.isArray(actionResult.data.actions)) {
          completedActionsCount = (actionResult.data.actions as Array<{ status?: string }>)
            .filter((action) => 
              action.status === "Fullført" || 
              action.status === "fullført" || 
              action.status === "completed"
            )
            .length;
        }

        // Fetch deviations due in next 7 days
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const { count: dueSoonCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .in("status", ["open", "in-progress"])
          .gte("due_date", today.toISOString().split("T")[0])
          .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0]);

        setStats({
          compliancePercent,
          openDeviations: openDeviationsCount || 0,
          completedActions: completedActionsCount,
          dueSoon: dueSoonCount || 0,
          isLoading: false,
          completedSteps,
          totalSteps,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, [profile?.company_id]);

  return stats;
}
