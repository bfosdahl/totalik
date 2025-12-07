import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectStats {
  id: string;
  project_name: string;
  project_number: string;
  status: string;
  checklist_count: number;
  completed_checklists: number;
  open_deviations: number;
  closed_deviations: number;
  vernerunder_count: number;
  completed_vernerunder: number;
  subcontractor_count: number;
  created_at: string;
}

export interface AggregatedStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalChecklists: number;
  completedChecklists: number;
  checklistCompletionRate: number;
  totalDeviations: number;
  openDeviations: number;
  closedDeviations: number;
  deviationClosureRate: number;
  totalVernerunder: number;
  completedVernerunder: number;
  vernerundeCompletionRate: number;
  totalSubcontractors: number;
  projectStats: ProjectStats[];
  deviationsByCategory: { category: string; count: number }[];
  checklistsByMonth: { month: string; completed: number; total: number }[];
  deviationTrend: { month: string; opened: number; closed: number }[];
}

export function useKsModule2Statistics() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ["ks-module2-statistics", companyId],
    queryFn: async (): Promise<AggregatedStats> => {
      if (!companyId) throw new Error("No company ID");

      // Fetch all projects for the company
      const { data: projects, error: projectsError } = await supabase
        .from("ks_module2_projects")
        .select("id, project_name, project_number, status, created_at")
        .eq("company_id", companyId);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];

      // Fetch checklists
      const { data: checklists } = await supabase
        .from("ks_module2_checklists")
        .select("id, project_id, status, created_at")
        .in("project_id", projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch deviations
      const { data: deviations } = await supabase
        .from("ks_module2_avvik")
        .select("id, project_id, status, category, created_at, closed_at")
        .in("project_id", projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch vernerunder
      const { data: vernerunder } = await supabase
        .from("ks_module2_vernerunder")
        .select("id, project_id, status, created_at")
        .in("project_id", projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch subcontractors
      const { data: subcontractors } = await supabase
        .from("ks_module2_subcontractors")
        .select("id, project_id")
        .in("project_id", projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);

      // Calculate per-project stats
      const projectStats: ProjectStats[] = (projects || []).map(project => {
        const projectChecklists = checklists?.filter(c => c.project_id === project.id) || [];
        const projectDeviations = deviations?.filter(d => d.project_id === project.id) || [];
        const projectVernerunder = vernerunder?.filter(v => v.project_id === project.id) || [];
        const projectSubcontractors = subcontractors?.filter(s => s.project_id === project.id) || [];

        return {
          id: project.id,
          project_name: project.project_name,
          project_number: project.project_number,
          status: project.status,
          checklist_count: projectChecklists.length,
          completed_checklists: projectChecklists.filter(c => c.status === 'completed').length,
          open_deviations: projectDeviations.filter(d => d.status !== 'closed').length,
          closed_deviations: projectDeviations.filter(d => d.status === 'closed').length,
          vernerunder_count: projectVernerunder.length,
          completed_vernerunder: projectVernerunder.filter(v => v.status === 'completed').length,
          subcontractor_count: projectSubcontractors.length,
          created_at: project.created_at,
        };
      });

      // Aggregate stats
      const totalChecklists = checklists?.length || 0;
      const completedChecklists = checklists?.filter(c => c.status === 'completed').length || 0;
      const totalDeviations = deviations?.length || 0;
      const openDeviations = deviations?.filter(d => d.status !== 'closed').length || 0;
      const closedDeviations = deviations?.filter(d => d.status === 'closed').length || 0;
      const totalVernerunder = vernerunder?.length || 0;
      const completedVernerunder = vernerunder?.filter(v => v.status === 'completed').length || 0;

      // Deviations by category
      const categoryMap = new Map<string, number>();
      deviations?.forEach(d => {
        const category = d.category || 'Ukategorisert';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      const deviationsByCategory = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate monthly trends (last 6 months)
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
      }

      const checklistsByMonth = months.map(month => {
        const monthChecklists = checklists?.filter(c => c.created_at?.startsWith(month)) || [];
        return {
          month,
          completed: monthChecklists.filter(c => c.status === 'completed').length,
          total: monthChecklists.length,
        };
      });

      const deviationTrend = months.map(month => {
        const monthDeviations = deviations?.filter(d => d.created_at?.startsWith(month)) || [];
        const closedInMonth = deviations?.filter(d => d.closed_at?.startsWith(month)) || [];
        return {
          month,
          opened: monthDeviations.length,
          closed: closedInMonth.length,
        };
      });

      return {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter(p => p.status === 'active').length || 0,
        completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        totalChecklists,
        completedChecklists,
        checklistCompletionRate: totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0,
        totalDeviations,
        openDeviations,
        closedDeviations,
        deviationClosureRate: totalDeviations > 0 ? Math.round((closedDeviations / totalDeviations) * 100) : 0,
        totalVernerunder,
        completedVernerunder,
        vernerundeCompletionRate: totalVernerunder > 0 ? Math.round((completedVernerunder / totalVernerunder) * 100) : 0,
        totalSubcontractors: subcontractors?.length || 0,
        projectStats,
        deviationsByCategory,
        checklistsByMonth,
        deviationTrend,
      };
    },
    enabled: !!companyId,
  });
}
