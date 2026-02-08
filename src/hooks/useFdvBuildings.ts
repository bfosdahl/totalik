import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FdvBuilding } from "@/types/fdv";
import { toast } from "sonner";

export function useFdvBuildings() {
  const { profile } = useAuth();
  const [buildings, setBuildings] = useState<FdvBuilding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const companyId = profile?.company_id;

  const fetchBuildings = useCallback(async () => {
    if (!companyId) {
      setBuildings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fdv_buildings")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      setBuildings((data as FdvBuilding[]) || []);
    } catch (error) {
      console.error("Error fetching FDV buildings:", error);
      toast.error("Kunne ikke hente bygg");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const createBuilding = async (building: Omit<FdvBuilding, 'id' | 'created_at' | 'updated_at'>) => {
    if (!companyId) return null;

    try {
      const { data, error } = await supabase
        .from("fdv_buildings")
        .insert({ ...building, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Bygg opprettet");
      await fetchBuildings();
      return data as FdvBuilding;
    } catch (error) {
      console.error("Error creating building:", error);
      toast.error("Kunne ikke opprette bygg");
      return null;
    }
  };

  const updateBuilding = async (id: string, updates: Partial<FdvBuilding>) => {
    try {
      const { error } = await supabase
        .from("fdv_buildings")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Bygg oppdatert");
      await fetchBuildings();
      return true;
    } catch (error) {
      console.error("Error updating building:", error);
      toast.error("Kunne ikke oppdatere bygg");
      return false;
    }
  };

  const deleteBuilding = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fdv_buildings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Bygg slettet");
      await fetchBuildings();
      return true;
    } catch (error) {
      console.error("Error deleting building:", error);
      toast.error("Kunne ikke slette bygg");
      return false;
    }
  };

  const activeBuildings = buildings.filter(b => b.status === 'aktiv');

  return {
    buildings,
    activeBuildings,
    isLoading,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    refetch: fetchBuildings,
  };
}
