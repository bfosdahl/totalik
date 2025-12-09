import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  compliancePercent: number;
  openDeviations: number;
  completedActions: number;
  dueSoon: number;
  isLoading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    compliancePercent: 0,
    openDeviations: 0,
    completedActions: 0,
    dueSoon: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!profile?.company_id) return;

    const fetchStats = async () => {
      try {
        // Calculate compliance based on actual data presence, not wizard progress
        let completedSteps = 0;
        const totalSteps = 6;

        // Check goals
        const { count: goalsCount } = await supabase
          .from("company_goals")
          .select("*", { count: "exact", head: true })
          .eq("company_id", profile.company_id);
        if (goalsCount && goalsCount > 0) completedSteps++;

        // Check organization
        const { data: orgData } = await supabase
          .from("company_organization")
          .select("custom_content")
          .eq("company_id", profile.company_id)
          .maybeSingle();
        if (orgData?.custom_content) completedSteps++;

        // Check risk assessment
        const { data: riskData } = await supabase
          .from("company_risk_assessments")
          .select("risks")
          .eq("company_id", profile.company_id)
          .maybeSingle();
        if (riskData?.risks && Array.isArray(riskData.risks) && riskData.risks.length > 0) completedSteps++;

        // Check action plan
        const { data: actionData } = await supabase
          .from("company_action_plans")
          .select("actions")
          .eq("company_id", profile.company_id)
          .maybeSingle();
        if (actionData?.actions && Array.isArray(actionData.actions) && actionData.actions.length > 0) completedSteps++;

        // Check routines
        const { data: routinesData } = await supabase
          .from("company_routines")
          .select("routines")
          .eq("company_id", profile.company_id)
          .maybeSingle();
        if (routinesData?.routines && Array.isArray(routinesData.routines) && routinesData.routines.length > 0) completedSteps++;

        // Handbook is considered complete if all other steps are complete
        if (completedSteps === 5) completedSteps++;

        const compliancePercent = Math.round((completedSteps / totalSteps) * 100);

        // Fetch open deviations count
        const { count: openDeviationsCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", profile.company_id)
          .in("status", ["open", "in-progress"]);

        // Fetch completed actions from action plans
        const { data: actionPlans } = await supabase
          .from("company_action_plans")
          .select("actions")
          .eq("company_id", profile.company_id)
          .single();

        let completedActionsCount = 0;
        if (actionPlans?.actions && Array.isArray(actionPlans.actions)) {
          completedActionsCount = (actionPlans.actions as Array<{ status?: string }>)
            .filter((action) => action.status === "Fullført")
            .length;
        }

        // Fetch deviations due in next 7 days
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const { count: dueSoonCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("company_id", profile.company_id)
          .in("status", ["open", "in-progress"])
          .gte("due_date", today.toISOString().split("T")[0])
          .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0]);

        setStats({
          compliancePercent,
          openDeviations: openDeviationsCount || 0,
          completedActions: completedActionsCount,
          dueSoon: dueSoonCount || 0,
          isLoading: false,
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
