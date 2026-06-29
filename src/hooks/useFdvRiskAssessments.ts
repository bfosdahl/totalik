import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FdvRiskAssessment, FdvRiskAction, FdvRiskCategory } from "@/types/fdv";
import { toast } from "sonner";

export function useFdvRiskAssessments(buildingId?: string) {
  const { profile } = useAuth();
  const [risks, setRisks] = useState<FdvRiskAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const companyId = profile?.company_id;

  const fetchRisks = useCallback(async () => {
    if (!companyId) {
      setRisks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from("fdv_risk_assessments")
        .select("*")
        .eq("company_id", companyId)
        .order("risk_score", { ascending: false });

      if (buildingId) {
        query = query.eq("building_id", buildingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse actions from JSONB and cast properly
      const parsed = (data || []).map(r => ({
        ...r,
        category: r.category as FdvRiskCategory,
        status: r.status as 'aktiv' | 'under_behandling' | 'lukket',
        actions: (Array.isArray(r.actions) ? r.actions : []) as unknown as FdvRiskAction[],
      }));
      
      setRisks(parsed);
    } catch (error) {
      console.error("Error fetching FDV risk assessments:", error);
      toast.error("Kunne ikke hente risikovurderinger");
    } finally {
      setIsLoading(false);
    }
  }, [companyId, buildingId]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  const createRisk = async (risk: Omit<FdvRiskAssessment, 'id' | 'created_at' | 'updated_at' | 'risk_score'>) => {
    if (!companyId) return null;

    try {
      const insertData = { 
        building_id: risk.building_id,
        company_id: companyId,
        category: risk.category,
        hazard_description: risk.hazard_description,
        existing_measures: risk.existing_measures,
        probability: risk.probability,
        consequence: risk.consequence,
        status: risk.status,
        actions: JSON.parse(JSON.stringify(risk.actions || [])),
        responsible_id: risk.responsible_id,
        responsible_name: risk.responsible_name,
        revision_date: risk.revision_date,
        assessed_by_id: risk.assessed_by_id,
        assessed_by_name: risk.assessed_by_name,
        assessed_at: risk.assessed_at,
        notes: risk.notes,
      };
      
      const { data, error } = await supabase
        .from("fdv_risk_assessments")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Risikovurdering opprettet");
      await fetchRisks();
      return data;
    } catch (error) {
      console.error("Error creating risk assessment:", error);
      toast.error("Kunne ikke opprette risikovurdering");
      return null;
    }
  };

  const updateRisk = async (id: string, updates: Partial<FdvRiskAssessment>) => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.actions) {
        dbUpdates.actions = updates.actions as unknown as Record<string, unknown>[];
      }
      
      const { error } = await supabase
        .from("fdv_risk_assessments")
        .update(dbUpdates as any)
        .eq("id", id);

      if (error) throw error;

      toast.success("Risikovurdering oppdatert");
      await fetchRisks();
      return true;
    } catch (error) {
      console.error("Error updating risk assessment:", error);
      toast.error("Kunne ikke oppdatere risikovurdering");
      return false;
    }
  };

  const addAction = async (riskId: string, action: Omit<FdvRiskAction, 'id'>) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return false;

    const newAction: FdvRiskAction = {
      ...action,
      id: crypto.randomUUID(),
    };

    const updatedActions = [...(risk.actions || []), newAction];
    return updateRisk(riskId, { actions: updatedActions });
  };

  const updateAction = async (riskId: string, actionId: string, updates: Partial<FdvRiskAction>) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return false;

    const updatedActions = risk.actions.map(a => 
      a.id === actionId ? { ...a, ...updates } : a
    );

    return updateRisk(riskId, { actions: updatedActions });
  };

  const deleteRisk = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fdv_risk_assessments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Risikovurdering slettet");
      await fetchRisks();
      return true;
    } catch (error) {
      console.error("Error deleting risk assessment:", error);
      toast.error("Kunne ikke slette risikovurdering");
      return false;
    }
  };

  // Calculate stats
  const highRisks = risks.filter(r => r.risk_score >= 15 && r.status === 'aktiv');
  const mediumRisks = risks.filter(r => r.risk_score >= 8 && r.risk_score < 15 && r.status === 'aktiv');
  const lowRisks = risks.filter(r => r.risk_score < 8 && r.status === 'aktiv');

  return {
    risks,
    isLoading,
    highRisks,
    mediumRisks,
    lowRisks,
    createRisk,
    updateRisk,
    addAction,
    updateAction,
    deleteRisk,
    refetch: fetchRisks,
  };
}
