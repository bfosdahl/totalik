import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectOption {
  id: string;
  project_name: string;
  project_number: string | null;
  address: string | null;
  geofence_enabled?: boolean;
  geofence_lat?: number | null;
  geofence_lng?: number | null;
  geofence_radius_m?: number | null;
}

/** Enkel prosjektliste for nedtrekksmenyer (kjørebok, timeregistrering) */
export function useProjectOptions() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["project-options", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [] as ProjectOption[];
      const { data, error } = await supabase
        .from("ks_module2_projects" as any)
        .select("id, project_name, project_number, address, geofence_enabled, geofence_lat, geofence_lng, geofence_radius_m")
        .eq("company_id", profile.company_id)
        .order("project_name", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProjectOption[];
    },
    enabled: !!profile?.company_id,
  });
}
