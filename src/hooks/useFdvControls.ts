import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FdvControl, FdvControlLog } from "@/types/fdv";
import { toast } from "sonner";
import { addMonths, isBefore, startOfDay } from "date-fns";

export function useFdvControls(buildingId?: string) {
  const { profile } = useAuth();
  const [controls, setControls] = useState<FdvControl[]>([]);
  const [logs, setLogs] = useState<FdvControlLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const companyId = profile?.company_id;

  const fetchControls = useCallback(async () => {
    if (!companyId) {
      setControls([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from("fdv_controls")
        .select("*")
        .eq("company_id", companyId)
        .order("next_due_date", { nullsFirst: false });

      if (buildingId) {
        query = query.eq("building_id", buildingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setControls((data as FdvControl[]) || []);
    } catch (error) {
      console.error("Error fetching FDV controls:", error);
      toast.error("Kunne ikke hente kontroller");
    } finally {
      setIsLoading(false);
    }
  }, [companyId, buildingId]);

  const fetchLogs = useCallback(async (controlId: string) => {
    try {
      const { data, error } = await supabase
        .from("fdv_control_logs")
        .select("*")
        .eq("control_id", controlId)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setLogs((data as FdvControlLog[]) || []);
      return data as FdvControlLog[];
    } catch (error) {
      console.error("Error fetching control logs:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const createControl = async (control: Omit<FdvControl, 'id' | 'created_at' | 'updated_at'>) => {
    if (!companyId) return null;

    try {
      const { data, error } = await supabase
        .from("fdv_controls")
        .insert({ ...control, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Kontroll opprettet");
      await fetchControls();
      return data as FdvControl;
    } catch (error) {
      console.error("Error creating control:", error);
      toast.error("Kunne ikke opprette kontroll");
      return null;
    }
  };

  const updateControl = async (id: string, updates: Partial<FdvControl>) => {
    try {
      const { error } = await supabase
        .from("fdv_controls")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Kontroll oppdatert");
      await fetchControls();
      return true;
    } catch (error) {
      console.error("Error updating control:", error);
      toast.error("Kunne ikke oppdatere kontroll");
      return false;
    }
  };

  const completeControl = async (
    control: FdvControl, 
    logData: { status: 'ok' | 'avvik' | 'delvis_ok'; findings?: string; notes?: string }
  ) => {
    if (!companyId || !profile) return false;

    const completedAt = new Date().toISOString();
    const nextDueDate = addMonths(new Date(), control.interval_months).toISOString().split('T')[0];

    try {
      // Create log entry
      const { error: logError } = await supabase
        .from("fdv_control_logs")
        .insert({
          control_id: control.id,
          building_id: control.building_id,
          company_id: companyId,
          completed_at: completedAt,
          completed_by_id: profile.id,
          completed_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
          status: logData.status,
          findings: logData.findings || null,
          next_due_date: nextDueDate,
          notes: logData.notes || null,
        });

      if (logError) throw logError;

      // Update control
      const { error: updateError } = await supabase
        .from("fdv_controls")
        .update({
          status: logData.status === 'avvik' ? 'avvik' : 'utfort',
          last_completed_date: completedAt.split('T')[0],
          last_completed_by_id: profile.id,
          last_completed_by_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent',
          next_due_date: nextDueDate,
        })
        .eq("id", control.id);

      if (updateError) throw updateError;

      toast.success("Kontroll registrert");
      await fetchControls();
      return true;
    } catch (error) {
      console.error("Error completing control:", error);
      toast.error("Kunne ikke registrere kontroll");
      return false;
    }
  };

  const deleteControl = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fdv_controls")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Kontroll slettet");
      await fetchControls();
      return true;
    } catch (error) {
      console.error("Error deleting control:", error);
      toast.error("Kunne ikke slette kontroll");
      return false;
    }
  };

  // Calculate control stats
  const today = startOfDay(new Date());
  const overdueControls = controls.filter(c => 
    c.next_due_date && isBefore(new Date(c.next_due_date), today) && c.status !== 'utfort'
  );
  const upcomingControls = controls.filter(c => 
    c.next_due_date && !isBefore(new Date(c.next_due_date), today)
  );

  return {
    controls,
    logs,
    isLoading,
    overdueControls,
    upcomingControls,
    createControl,
    updateControl,
    completeControl,
    deleteControl,
    fetchLogs,
    refetch: fetchControls,
  };
}
