import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GuestProjectAccess {
  id: string;
  project_id: string;
  access_level: 'none' | 'guest' | 'full_ue';
  status: 'invited' | 'active' | 'expired' | 'revoked';
  role_in_project: string;
  company_name: string | null;
  expires_at: string | null;
  project?: {
    id: string;
    project_name: string;
    project_number: string;
  };
}

export function useGuestAccess(userId: string | null) {
  const { data: guestAccess, isLoading } = useQuery({
    queryKey: ["guest-access", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Check if user has any project access entries
      const { data, error } = await supabase
        .from("ks_module2_project_access")
        .select(`
          id,
          project_id,
          access_level,
          status,
          role_in_project,
          company_name,
          expires_at
        `)
        .eq("user_id", userId)
        .in("status", ["invited", "active"])
        .neq("access_level", "none");

      if (error) {
        console.error("Error fetching guest access:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      // Fetch project details for each access
      const projectIds = data.map(a => a.project_id);
      const { data: projects } = await supabase
        .from("ks_module2_projects")
        .select("id, project_name, project_number")
        .in("id", projectIds);

      // Combine access with project info
      const accessWithProjects = data.map(access => ({
        ...access,
        project: projects?.find(p => p.id === access.project_id)
      })) as GuestProjectAccess[];

      return accessWithProjects;
    },
    enabled: !!userId,
  });

  const isGuestUser = !!guestAccess && guestAccess.length > 0;
  const activeProjects = guestAccess?.filter(a => 
    a.status === 'active' || a.status === 'invited'
  ) || [];

  return {
    isGuestUser,
    guestAccess: activeProjects,
    isLoading,
    firstProjectId: activeProjects[0]?.project_id || null,
  };
}
