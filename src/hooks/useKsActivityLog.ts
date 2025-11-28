import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsActivityLog {
  id: string;
  project_id: string;
  company_id: string;
  activity_type: string;
  activity_description: string;
  reference_id: string | null;
  reference_type: string | null;
  performed_by_user_id: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export const useKsActivityLog = (projectId: string | null) => {
  const [activities, setActivities] = useState<KsActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  const fetchActivities = async () => {
    if (!projectId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ks_project_activity_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      toast.error("Kunne ikke hente tiltakslogg");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  const logActivity = async (
    activityType: string,
    description: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { error } = await supabase
        .from("ks_project_activity_log")
        .insert({
          project_id: projectId,
          company_id: profile.company_id,
          activity_type: activityType,
          activity_description: description,
          reference_id: referenceId || null,
          reference_type: referenceType || null,
          performed_by_user_id: profile.user_id,
          performed_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        });

      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return {
    activities,
    isLoading,
    logActivity,
    refetch: fetchActivities,
  };
};