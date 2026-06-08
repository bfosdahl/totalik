import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RiggObject {
  id: string;
  type: string; // brakkerigg, tarnkran, materiallager, avfall, parkering, adkomstvei, romningsvei, gjerde, strom, vann
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
  /** §8-bokstaver i Byggherreforskriften som dette objektet er knyttet til */
  linkedRiskParagraphs?: string[];
  /** Fritekst-merknad som synkroniseres inn i tiltakene for SHA-risikoområdet */
  riskNote?: string;
}

export interface RiggCanvasData {
  objects: RiggObject[];
  width: number;
  height: number;
  scaleMetersPerPixel: number;
  backgroundLabel?: string;
  backgroundImagePath?: string | null;
  backgroundImageOpacity?: number;
}

export interface RiggPlan {
  id: string;
  company_id: string;
  project_id: string;
  name: string;
  description: string | null;
  canvas_data: RiggCanvasData;
  version: number;
  status: string;
  is_current_version: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CANVAS: RiggCanvasData = {
  objects: [],
  width: 1200,
  height: 800,
  scaleMetersPerPixel: 0.05,
  backgroundLabel: "Byggeplassområde",
};

export function useKsRiggPlan(projectId: string) {
  const { profile, user } = useAuth();
  const [plans, setPlans] = useState<RiggPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ks_module2_rigg_plans")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPlans(
        (data || []).map((p: any) => ({
          ...p,
          canvas_data: (p.canvas_data as RiggCanvasData) || DEFAULT_CANVAS,
        }))
      );
    } catch (e) {
      console.error("Error fetching rigg plans:", e);
      toast.error("Kunne ikke hente riggplaner");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (name: string) => {
    if (!profile?.company_id || !user?.id) return null;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("ks_module2_rigg_plans")
        .insert([
          {
            company_id: profile.company_id,
            project_id: projectId,
            name: name || "Riggplan",
            canvas_data: DEFAULT_CANVAS as any,
            created_by: user.id,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      toast.success("Riggplan opprettet");
      await fetchPlans();
      return data as any as RiggPlan;
    } catch (e: any) {
      console.error(e);
      toast.error("Kunne ikke opprette riggplan");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlan = async (
    id: string,
    updates: Partial<Pick<RiggPlan, "name" | "description" | "canvas_data" | "status">>
  ) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ks_module2_rigg_plans")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      await fetchPlans();
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke lagre riggplan");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_module2_rigg_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Riggplan slettet");
      await fetchPlans();
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke slette riggplan");
    }
  };

  return { plans, isLoading, isSaving, createPlan, updatePlan, deletePlan, refetch: fetchPlans };
}
