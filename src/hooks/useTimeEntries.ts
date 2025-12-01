import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TimeEntry {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntry {
  entry_date: string;
  hours: number;
  project_name?: string;
  project_id?: string;
  description?: string;
  status?: "draft" | "submitted";
}

export function useTimeEntries() {
  const { user, profile, isCompanyAdmin } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user || !profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("time_entries")
        .select("*")
        .order("entry_date", { ascending: false });

      // If not admin, only fetch own entries
      if (!isCompanyAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as TimeEntry[]) || []);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast.error("Kunne ikke hente timeregistreringer");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user, profile?.company_id, isCompanyAdmin]);

  const createEntry = async (entry: CreateTimeEntry): Promise<boolean> => {
    if (!user || !profile?.company_id) {
      toast.error("Du må være logget inn");
      return false;
    }

    try {
      const { error } = await supabase.from("time_entries").insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        entry_date: entry.entry_date,
        hours: entry.hours,
        project_name: entry.project_name || null,
        project_id: entry.project_id || null,
        description: entry.description || null,
        status: entry.status || "submitted",
      });

      if (error) throw error;
      toast.success("Timer registrert");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error creating time entry:", error);
      toast.error("Kunne ikke registrere timer");
      return false;
    }
  };

  const updateEntry = async (id: string, updates: Partial<CreateTimeEntry>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Timeregistrering oppdatert");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error updating time entry:", error);
      toast.error("Kunne ikke oppdatere timeregistrering");
      return false;
    }
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);

      if (error) throw error;
      toast.success("Timeregistrering slettet");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast.error("Kunne ikke slette timeregistrering");
      return false;
    }
  };

  const approveEntry = async (id: string): Promise<boolean> => {
    if (!user || !profile) {
      toast.error("Du må være logget inn");
      return false;
    }

    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Timer godkjent");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error approving time entry:", error);
      toast.error("Kunne ikke godkjenne timer");
      return false;
    }
  };

  const rejectEntry = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Timer avvist");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error rejecting time entry:", error);
      toast.error("Kunne ikke avvise timer");
      return false;
    }
  };

  // Get entries for a specific week
  const getWeekEntries = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return entries.filter((entry) => {
      const entryDate = new Date(entry.entry_date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  };

  // Get total hours for current user
  const getUserTotalHours = (startDate?: Date, endDate?: Date) => {
    let filtered = entries.filter((e) => e.user_id === user?.id);
    
    if (startDate) {
      filtered = filtered.filter((e) => new Date(e.entry_date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((e) => new Date(e.entry_date) <= endDate);
    }
    
    return filtered.reduce((sum, e) => sum + Number(e.hours), 0);
  };

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    approveEntry,
    rejectEntry,
    getWeekEntries,
    getUserTotalHours,
    refetch: fetchEntries,
  };
}
