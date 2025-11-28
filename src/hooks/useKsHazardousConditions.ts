import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsHazardousCondition {
  id: string;
  project_id: string;
  company_id: string;
  condition_number: string;
  discovered_date: string;
  location: string;
  description: string;
  severity: string;
  measures_taken: string | null;
  responsible: string | null;
  deadline: string | null;
  status: string;
  closed_date: string | null;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useKsHazardousConditions = (projectId: string | null) => {
  const [conditions, setConditions] = useState<KsHazardousCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  const fetchConditions = async () => {
    if (!projectId) {
      setConditions([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ks_hazardous_conditions")
        .select("*")
        .eq("project_id", projectId)
        .order("discovered_date", { ascending: false });

      if (error) throw error;
      setConditions(data || []);
    } catch (error) {
      console.error("Error fetching hazardous conditions:", error);
      toast.error("Kunne ikke hente farlige forhold");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [projectId]);

  const generateConditionNumber = async () => {
    if (!projectId) return "FF-0001";

    try {
      const { data, error } = await supabase
        .from("ks_hazardous_conditions")
        .select("condition_number")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) return "FF-0001";

      const lastNumber = data[0].condition_number;
      const match = lastNumber.match(/FF-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `FF-${String(nextNum).padStart(4, "0")}`;
      }
      return "FF-0001";
    } catch (error) {
      console.error("Error generating condition number:", error);
      return "FF-0001";
    }
  };

  const createCondition = async (input: Omit<KsHazardousCondition, "id" | "created_at" | "updated_at" | "company_id" | "condition_number">) => {
    if (!profile?.company_id) {
      toast.error("Kunne ikke finne bedrift");
      return null;
    }

    try {
      const conditionNumber = await generateConditionNumber();

      const { data, error } = await supabase
        .from("ks_hazardous_conditions")
        .insert({
          ...input,
          company_id: profile.company_id,
          condition_number: conditionNumber,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Farlig forhold registrert");
      await fetchConditions();
      return data;
    } catch (error) {
      console.error("Error creating hazardous condition:", error);
      toast.error("Kunne ikke registrere farlig forhold");
      return null;
    }
  };

  const updateCondition = async (id: string, updates: Partial<KsHazardousCondition>) => {
    try {
      const { error } = await supabase
        .from("ks_hazardous_conditions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Farlig forhold oppdatert");
      await fetchConditions();
      return true;
    } catch (error) {
      console.error("Error updating hazardous condition:", error);
      toast.error("Kunne ikke oppdatere farlig forhold");
      return false;
    }
  };

  const deleteCondition = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_hazardous_conditions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Farlig forhold slettet");
      await fetchConditions();
      return true;
    } catch (error) {
      console.error("Error deleting hazardous condition:", error);
      toast.error("Kunne ikke slette farlig forhold");
      return false;
    }
  };

  return {
    conditions,
    isLoading,
    createCondition,
    updateCondition,
    deleteCondition,
    refetch: fetchConditions,
  };
};