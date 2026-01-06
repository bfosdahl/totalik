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
        // Calculate compliance based on WIZARD PROGRESS, not just data presence
        // This prevents pre-populated default data from showing as 100% complete
        const totalSteps = 6;
        const stepIds = ["goals", "organization", "risk", "actions", "routines", "handbook"];
        
        // Fetch wizard progress to see which steps are actually completed
        const { data: progressData } = await supabase
          .from("setup_wizard_progress")
          .select("completed_steps")
          .eq("company_id", profile.company_id)
          .maybeSingle();

        // Count completed steps based on wizard progress
        let completedSteps = 0;
        if (progressData?.completed_steps && Array.isArray(progressData.completed_steps)) {
          // Count how many of our step IDs are in the completed_steps array
          completedSteps = stepIds.filter(stepId => 
            progressData.completed_steps.includes(stepId)
          ).length;
        }

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
          .maybeSingle();

        let completedActionsCount = 0;
        if (actionPlans?.actions && Array.isArray(actionPlans.actions)) {
          completedActionsCount = (actionPlans.actions as Array<{ status?: string }>)
            .filter((action) => action.status === "Fullført" || action.status === "fullført")
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
