import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";

interface DashboardStats {
  compliancePercent: number;
  openDeviations: number;
  completedActions: number;
  dueSoon: number;
  isLoading: boolean;
  completedSteps: number;
  totalSteps: number;
}

// Helper: apply department filter (null = main company view → department_id IS NULL)
const withDept = (query: any, departmentId: string | null) =>
  departmentId ? query.eq("department_id", departmentId) : query.is("department_id", null);

export function useDashboardStats(): DashboardStats {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
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

    const currentFetchId = ++fetchIdRef.current;

    const fetchStats = async () => {
      try {
        const companyId = profile.company_id;
        const deptId = filterDepartmentId;
        const totalSteps = 6;
        
        const [
          wizardProgressResult,
          goalsResult,
          orgResult,
          riskResult,
          actionResult,
          routinesResult,
          hmsDeclarationResult,
        ] = await Promise.all([
          supabase
            .from("setup_wizard_progress")
            .select("is_completed, completed_steps")
            .eq("company_id", companyId)
            .maybeSingle(),
          withDept(
            supabase
              .from("company_goals")
              .select("id, is_predefined", { count: "exact" })
              .eq("company_id", companyId),
            deptId
          ),
          withDept(
            supabase
              .from("company_organization")
              .select("custom_content, is_custom")
              .eq("company_id", companyId),
            deptId
          ).maybeSingle(),
          withDept(
            supabase
              .from("company_risk_assessments")
              .select("risks")
              .eq("company_id", companyId),
            deptId
          ).maybeSingle(),
          withDept(
            supabase
              .from("company_action_plans")
              .select("actions")
              .eq("company_id", companyId),
            deptId
          ).maybeSingle(),
          withDept(
            supabase
              .from("company_routines")
              .select("routines")
              .eq("company_id", companyId),
            deptId
          ).maybeSingle(),
          supabase
            .from("hms_self_declarations")
            .select("id")
            .eq("company_id", companyId)
            .maybeSingle(),
        ]);

        // Race condition guard
        if (currentFetchId !== fetchIdRef.current) return;

        const wizardCompleted = wizardProgressResult.data?.is_completed ?? false;
        const completedStepsList: string[] = wizardProgressResult.data?.completed_steps ?? [];
        
        let completedSteps = 0;
        
        const isStepCompleted = (stepId: string, hasData: boolean, hasNonPredefinedData: boolean): boolean => {
          if (wizardCompleted) {
            return completedStepsList.includes(stepId) || hasData;
          }
          return completedStepsList.includes(stepId) || hasNonPredefinedData;
        };
        
        // 1. Goals
        const hasGoals = (goalsResult.data?.length ?? 0) > 0;
        const hasNonPredefinedGoals = goalsResult.data?.some(g => !g.is_predefined) ?? false;
        if (isStepCompleted('goals', hasGoals, hasNonPredefinedGoals)) completedSteps++;
        
        // 2. Organization
        let hasOrgData = false;
        let hasCustomOrg = false;
        if (orgResult.data?.custom_content) {
          hasOrgData = true;
          hasCustomOrg = orgResult.data.is_custom ?? false;
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
        if (isStepCompleted('organization', hasOrgData, hasCustomOrg)) completedSteps++;
        
        // 3. Risk assessment
        let hasRisks = false;
        let hasNonPredefinedRisks = false;
        if (riskResult.data?.risks) {
          const risks = riskResult.data.risks as Array<{ is_predefined?: boolean }>;
          if (Array.isArray(risks) && risks.length > 0) {
            hasRisks = true;
            hasNonPredefinedRisks = risks.some(r => !r.is_predefined);
          }
        }
        if (isStepCompleted('risk', hasRisks, hasNonPredefinedRisks)) completedSteps++;
        
        // 4. Action plan
        let hasActions = false;
        let hasNonPredefinedActions = false;
        if (actionResult.data?.actions) {
          const actions = actionResult.data.actions as Array<{ is_predefined?: boolean; status?: string }>;
          if (Array.isArray(actions) && actions.length > 0) {
            hasActions = true;
            hasNonPredefinedActions = actions.some(a => !a.is_predefined && a.is_predefined !== undefined) ||
              actions.some(a => a.status && a.status !== 'ikke_startet');
          }
        }
        if (isStepCompleted('actions', hasActions, hasNonPredefinedActions)) completedSteps++;
        
        // 5. Routines
        let hasRoutines = false;
        let hasNonPredefinedRoutines = false;
        if (routinesResult.data?.routines) {
          const routines = routinesResult.data.routines as Array<{ is_predefined?: boolean }>;
          if (Array.isArray(routines) && routines.length > 0) {
            hasRoutines = true;
            hasNonPredefinedRoutines = routines.some(r => !r.is_predefined);
          }
        }
        if (isStepCompleted('routines', hasRoutines, hasNonPredefinedRoutines)) completedSteps++;
        
        // 6. HMS declaration
        if (hmsDeclarationResult.data?.id) completedSteps++;

        const compliancePercent = Math.round((completedSteps / totalSteps) * 100);

        const { count: openDeviationsCount } = await withDept(
          supabase
            .from("deviations")
            .select("*", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("is_deleted", false)
            .in("status", ["open", "in-progress"]),
          deptId
        );

        if (currentFetchId !== fetchIdRef.current) return;

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

        // Use local date to avoid UTC timezone mismatch for Norwegian users
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);
        const futureStr = `${sevenDaysFromNow.getFullYear()}-${String(sevenDaysFromNow.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysFromNow.getDate()).padStart(2, '0')}`;

        const { count: dueSoonCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_deleted", false)
          .in("status", ["open", "in-progress"])
          .gte("due_date", todayStr)
          .lte("due_date", futureStr);

        if (currentFetchId !== fetchIdRef.current) return;

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
        if (currentFetchId === fetchIdRef.current) {
          setStats((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchStats();
  }, [profile?.company_id]);

  return stats;
}
