import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsSafetyRound {
  id: string;
  project_id: string;
  company_id: string;
  round_date: string;
  participants: string | null;
  findings: string | null;
  actions_required: string | null;
  responsible: string | null;
  deadline: string | null;
  status: string;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useKsSafetyRounds = (projectId: string | null) => {
  const [safetyRounds, setSafetyRounds] = useState<KsSafetyRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSafetyRounds = async () => {
    if (!projectId) {
      setSafetyRounds([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ks_safety_rounds")
        .select("*")
        .eq("project_id", projectId)
        .order("round_date", { ascending: false });

      if (error) throw error;
      setSafetyRounds(data || []);
    } catch (error) {
      console.error("Error fetching safety rounds:", error);
      toast.error("Kunne ikke hente vernerunder");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyRounds();
  }, [projectId]);

  const createSafetyRound = async (input: Omit<KsSafetyRound, "id" | "created_at" | "updated_at" | "company_id">) => {
    if (!profile?.company_id) {
      toast.error("Kunne ikke finne bedrift");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("ks_safety_rounds")
        .insert({
          ...input,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Vernerunde registrert");
      await fetchSafetyRounds();
      return data;
    } catch (error) {
      console.error("Error creating safety round:", error);
      toast.error("Kunne ikke registrere vernerunde");
      return null;
    }
  };

  const updateSafetyRound = async (id: string, updates: Partial<KsSafetyRound>) => {
    try {
      const { error } = await supabase
        .from("ks_safety_rounds")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Vernerunde oppdatert");
      await fetchSafetyRounds();
      return true;
    } catch (error) {
      console.error("Error updating safety round:", error);
      toast.error("Kunne ikke oppdatere vernerunde");
      return false;
    }
  };

  const deleteSafetyRound = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_safety_rounds")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Vernerunde slettet");
      await fetchSafetyRounds();
      return true;
    } catch (error) {
      console.error("Error deleting safety round:", error);
      toast.error("Kunne ikke slette vernerunde");
      return false;
    }
  };

  return {
    safetyRounds,
    isLoading,
    createSafetyRound,
    updateSafetyRound,
    deleteSafetyRound,
    refetch: fetchSafetyRounds,
  };
};