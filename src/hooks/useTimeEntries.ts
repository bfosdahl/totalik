import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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
  department_id?: string | null;
  source?: "manual" | "qr_clock"; // Track where entry came from
  clock_in?: string | null;
  clock_out?: string | null;
  total_break_minutes?: number | null;
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
      // CRITICAL: Always filter by company_id for strict tenant isolation
      let timeQuery = supabase
        .from("time_entries")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("entry_date", { ascending: false });

      // Regular users only see their own entries
      if (!isCompanyAdmin) {
        timeQuery = timeQuery.eq("user_id", user.id);
      }

      const { data: timeData, error: timeError } = await timeQuery;
      if (timeError) throw timeError;

      // Fetch QR clock entries (completed ones with hours)
      // CRITICAL: Always filter by company_id first for tenant isolation
      let clockQuery = supabase
        .from("time_clock_entries")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("status", "completed")
        .not("hours_worked", "is", null)
        .order("clock_in", { ascending: false });

      // Regular users only see their own entries
      if (!isCompanyAdmin) {
        clockQuery = clockQuery.eq("user_id", user.id);
      }

      const { data: clockData, error: clockError } = await clockQuery;
      if (clockError) throw clockError;

      // Convert clock entries to TimeEntry format
      const clockEntries: TimeEntry[] = (clockData || []).map((entry: {
        id: string;
        company_id: string;
        user_id: string;
        user_name: string;
        clock_in: string;
        clock_out: string | null;
        hours_worked: number | null;
        notes: string | null;
        status: string;
        total_break_minutes: number | null;
        created_at: string;
        updated_at: string;
        approval_status: string | null;
        approved_by: string | null;
        approved_by_name: string | null;
        approved_at: string | null;
      }) => {
        // Map approval_status to TimeEntry status format
        let status: "draft" | "submitted" | "approved" | "rejected" = "submitted";
        if (entry.approval_status === "approved") status = "approved";
        else if (entry.approval_status === "rejected") status = "rejected";

        return {
          id: `clock_${entry.id}`,
          company_id: entry.company_id,
          user_id: entry.user_id,
          user_name: entry.user_name,
          entry_date: format(new Date(entry.clock_in), "yyyy-MM-dd"),
          hours: entry.hours_worked || 0,
          project_name: null,
          project_id: null,
          description: entry.notes || `QR-stempling: ${format(new Date(entry.clock_in), "HH:mm")} - ${entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : ""}`,
          status,
          approved_by: entry.approved_by,
          approved_by_name: entry.approved_by_name,
          approved_at: entry.approved_at,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          source: "qr_clock" as const,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          total_break_minutes: entry.total_break_minutes,
        };
      });

      // Mark manual entries - cast status to correct type
      const manualEntries: TimeEntry[] = (timeData || []).map((entry: any) => ({
        ...entry,
        status: entry.status as "draft" | "submitted" | "approved" | "rejected",
        source: "manual" as const,
      }));

      // Combine and sort by date
      const allEntries = [...manualEntries, ...clockEntries].sort(
        (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      );

      setEntries(allEntries);
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
      // Check if it's a clock entry (starts with "clock_")
      if (id.startsWith("clock_")) {
        const realId = id.replace("clock_", "");
        const { error } = await supabase
          .from("time_clock_entries")
          .update({
            approval_status: "approved",
            approved_by: user.id,
            approved_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", realId);

        if (error) throw error;
      } else {
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
      }

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
      // Check if it's a clock entry (starts with "clock_")
      if (id.startsWith("clock_")) {
        const realId = id.replace("clock_", "");
        const { error } = await supabase
          .from("time_clock_entries")
          .update({
            approval_status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", realId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("time_entries")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
      }

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
