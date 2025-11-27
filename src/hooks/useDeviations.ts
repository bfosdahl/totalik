import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Deviation {
  id: string;
  deviation_number: string;
  title: string;
  description: string | null;
  category: "HMS" | "MAT" | "BYGG";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignee_id: string | null;
  assignee_name: string | null;
  reporter_id: string | null;
  reporter_name: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface NewDeviationInput {
  title: string;
  description: string;
  category: "HMS" | "MAT" | "BYGG";
  priority: "low" | "medium" | "high" | "critical";
  assignee_id?: string | null;
  assignee_name: string;
  due_date: string;
}

export function useDeviations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const companyId = profile?.company_id;

  // Fetch deviations
  const fetchDeviations = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("deviations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeviations((data || []) as Deviation[]);
    } catch (error) {
      console.error("Error fetching deviations:", error);
      toast({
        title: "Feil ved henting",
        description: "Kunne ikke hente avvik. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    fetchDeviations();
  }, [fetchDeviations]);

  // Generate next deviation number
  const getNextDeviationNumber = useCallback(async (): Promise<string> => {
    if (!companyId) return "DEV-001";

    try {
      const { data } = await supabase
        .from("deviations")
        .select("deviation_number")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const lastNumber = data[0].deviation_number;
        const match = lastNumber.match(/DEV-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          return `DEV-${String(nextNum).padStart(3, "0")}`;
        }
      }
      return "DEV-001";
    } catch {
      return "DEV-001";
    }
  }, [companyId]);

  // Create deviation
  const createDeviation = useCallback(async (input: NewDeviationInput): Promise<boolean> => {
    if (!companyId || !profile) return false;

    setIsSaving(true);
    try {
      const deviationNumber = await getNextDeviationNumber();
      const reporterName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "Ukjent";

      const { error } = await supabase
        .from("deviations")
        .insert({
          company_id: companyId,
          deviation_number: deviationNumber,
          title: input.title,
          description: input.description || null,
          category: input.category,
          priority: input.priority,
          status: "open",
          assignee_id: input.assignee_id || null,
          assignee_name: input.assignee_name || null,
          reporter_id: profile.id,
          reporter_name: reporterName,
          due_date: input.due_date,
        });

      if (error) throw error;

      await fetchDeviations();
      toast({
        title: "Avvik registrert",
        description: `${deviationNumber}: ${input.title}`,
      });
      return true;
    } catch (error) {
      console.error("Error creating deviation:", error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke registrere avvik. Prøv igjen.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [companyId, profile, getNextDeviationNumber, fetchDeviations, toast]);

  // Update deviation
  const updateDeviation = useCallback(async (
    id: string, 
    updates: Partial<Pick<Deviation, "status" | "assignee_id" | "assignee_name" | "priority">>,
    options?: { sendNotification?: boolean; assigneeEmail?: string }
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("deviations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      const updatedDeviation = deviations.find(d => d.id === id);
      setDeviations(prev => prev.map(d => 
        d.id === id ? { ...d, ...updates } : d
      ));

      // Send email notification if assignee changed and email provided
      if (options?.sendNotification && options?.assigneeEmail && updates.assignee_name && updatedDeviation) {
        const assignerName = profile 
          ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "En bruker"
          : "En bruker";

        try {
          await supabase.functions.invoke("notify-deviation-assignment", {
            body: {
              deviation_id: id,
              deviation_number: updatedDeviation.deviation_number,
              deviation_title: updatedDeviation.title,
              assignee_email: options.assigneeEmail,
              assignee_name: updates.assignee_name,
              assigner_name: assignerName,
              due_date: updatedDeviation.due_date,
              priority: updatedDeviation.priority,
              category: updatedDeviation.category,
            },
          });
          console.log("Email notification sent");
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the update if email fails
        }
      }

      return true;
    } catch (error) {
      console.error("Error updating deviation:", error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere avvik. Prøv igjen.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [deviations, profile, toast]);

  // Delete deviation
  const deleteDeviation = useCallback(async (id: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("deviations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDeviations(prev => prev.filter(d => d.id !== id));
      toast({
        title: "Avvik slettet",
        description: "Avviket ble slettet.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting deviation:", error);
      toast({
        title: "Feil ved sletting",
        description: "Kunne ikke slette avvik. Prøv igjen.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  return {
    deviations,
    isLoading,
    isSaving,
    createDeviation,
    updateDeviation,
    deleteDeviation,
    refetch: fetchDeviations,
  };
}
