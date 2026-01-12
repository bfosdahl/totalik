import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!profile?.company_id) return;

    const fetchStats = async () => {
      try {
        const companyId = profile.company_id;
        const totalSteps = 6;
        
        // Check actual data presence for each step (not just wizard progress)
        // This ensures AI-setup data is also counted
        const [
          goalsResult,
          orgResult,
          riskResult,
          actionResult,
          routinesResult,
          hmsDeclarationResult,
        ] = await Promise.all([
          // 1. Goals
          supabase
            .from("company_goals")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId),
          // 2. Organization
          supabase
            .from("company_organization")
            .select("custom_content")
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

        // Count completed steps based on actual data
        let completedSteps = 0;
        
        // 1. Goals - check if there are any goals
        if ((goalsResult.count ?? 0) > 0) {
          completedSteps++;
        }
        
        // 2. Organization - check if there's content
        if (orgResult.data?.custom_content) {
          try {
            const parsed = JSON.parse(orgResult.data.custom_content);
            if ((parsed.roles?.length > 0) || (parsed.description?.trim().length > 0)) {
              completedSteps++;
            }
          } catch {
            // Legacy format - if there's any content, count it
            if (orgResult.data.custom_content.trim().length > 0) {
              completedSteps++;
            }
          }
        }
        
        // 3. Risk assessment - check if there are any risks
        if (riskResult.data?.risks) {
          const risks = riskResult.data.risks as unknown[];
          if (Array.isArray(risks) && risks.length > 0) {
            completedSteps++;
          }
        }
        
        // 4. Action plan - check if there are any actions
        if (actionResult.data?.actions) {
          const actions = actionResult.data.actions as unknown[];
          if (Array.isArray(actions) && actions.length > 0) {
            completedSteps++;
          }
        }
        
        // 5. Routines - check if there are any routines
        if (routinesResult.data?.routines) {
          const routines = routinesResult.data.routines as unknown[];
          if (Array.isArray(routines) && routines.length > 0) {
            completedSteps++;
          }
        }
        
        // 6. HMS declaration signed (handbook step requirement)
        if (hmsDeclarationResult.data?.id) {
          completedSteps++;
        }

        const compliancePercent = Math.round((completedSteps / totalSteps) * 100);

        // Fetch open deviations count
        const { count: openDeviationsCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
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
