import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DepartmentDashboardStats {
  compliancePercent: number;
  openDeviations: number;
  completedActions: number;
  dueSoon: number;
  isLoading: boolean;
  goalsCount: number;
  routinesCount: number;
  hasOrganization: boolean;
}

export function useDepartmentDashboardStats(departmentId: string | undefined): DepartmentDashboardStats {
  const [stats, setStats] = useState<DepartmentDashboardStats>({
    compliancePercent: 0,
    openDeviations: 0,
    completedActions: 0,
    dueSoon: 0,
    isLoading: true,
    goalsCount: 0,
    routinesCount: 0,
    hasOrganization: false,
  });

  useEffect(() => {
    if (!departmentId) return;

    const fetchStats = async () => {
      try {
        // First get the company_id for this department
        const { data: deptData, error: deptError } = await supabase
          .from("company_departments")
          .select("company_id")
          .eq("id", departmentId)
          .single();

        if (deptError || !deptData) {
          setStats(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const companyId = deptData.company_id;

        // Fetch department-specific data from company_modules settings
        const { data: moduleData } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", companyId)
          .eq("module_type", "IK_HMS")
          .single();

        let goalsCount = 0;
        let routinesCount = 0;
        let hasOrganization = false;
        let completedActionsCount = 0;

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const departmentData = settings.departmentData?.[departmentId];

          if (departmentData) {
            // Count department-specific goals
            if (departmentData.goals && Array.isArray(departmentData.goals)) {
              goalsCount = departmentData.goals.filter((g: any) => g.goal_text?.trim()).length;
            }

            // Check for organization
            if (departmentData.organization) {
              const org = departmentData.organization;
              hasOrganization = !!(org.roles?.length > 0 || org.description?.trim());
            }

            // Count department-specific routines
            if (departmentData.routines && Array.isArray(departmentData.routines)) {
              routinesCount = departmentData.routines.filter((r: any) => r.routine_name?.trim()).length;
            }

            // Count completed actions from department action plan
            if (departmentData.actions && Array.isArray(departmentData.actions)) {
              completedActionsCount = departmentData.actions.filter(
                (action: any) => action.status === "Fullført" || action.status === "fullført"
              ).length;
            }
          }
        }

        // Calculate compliance for the department (based on its own setup progress)
        const totalSteps = 4; // Goals, Organization, Routines, Risks
        let completedSteps = 0;
        if (goalsCount > 0) completedSteps++;
        if (hasOrganization) completedSteps++;
        if (routinesCount > 0) completedSteps++;
        // Risk could be another step when implemented

        const compliancePercent = Math.round((completedSteps / totalSteps) * 100);

        // Fetch department-specific deviations
        const { count: openDeviationsCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("department_id", departmentId)
          .in("status", ["open", "in-progress"]);

        // Fetch deviations due in next 7 days for this department
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const { count: dueSoonCount } = await supabase
          .from("deviations")
          .select("*", { count: "exact", head: true })
          .eq("department_id", departmentId)
          .in("status", ["open", "in-progress"])
          .gte("due_date", today.toISOString().split("T")[0])
          .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0]);

        setStats({
          compliancePercent,
          openDeviations: openDeviationsCount || 0,
          completedActions: completedActionsCount,
          dueSoon: dueSoonCount || 0,
          isLoading: false,
          goalsCount,
          routinesCount,
          hasOrganization,
        });
      } catch (error) {
        console.error("Error fetching department dashboard stats:", error);
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, [departmentId]);

  return stats;
}
