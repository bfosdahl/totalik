import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export type HourType = "normal" | "overtime_50" | "overtime_100";

export interface TimeEntryAllowanceInput {
  allowance_type_id?: string | null;
  type_name: string;
  unit: string;
  quantity: number;
  rate_snapshot: number;
  amount: number;
  notes?: string | null;
}

export interface TimeEntry {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  start_time?: string | null;
  end_time?: string | null;
  project_name: string | null;
  project_id: string | null;
  ks_project_id?: string | null;
  customer_name?: string | null;
  hour_type?: HourType;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "pending_confirmation";
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  department_id?: string | null;
  source?: "manual" | "qr_clock" | "work_schedule";
  clock_in?: string | null;
  clock_out?: string | null;
  total_break_minutes?: number | null;
  work_schedule_id?: string | null;
  admin_edit_reason?: string | null;
  admin_edited_by?: string | null;
  admin_edited_at?: string | null;
  // For work_schedule entries - extra display info
  schedule_location?: string | null;
  schedule_role?: string | null;
}

export interface OvertimeSegmentPersist {
  start: string;
  end: string;
  rate: "overtime_50" | "overtime_100";
  hours: number;
}

export interface CreateTimeEntry {
  entry_date: string;
  hours: number;
  start_time?: string | null;
  end_time?: string | null;
  project_name?: string;
  project_id?: string;
  ks_project_id?: string | null;
  customer_name?: string | null;
  hour_type?: HourType;
  description?: string;
  status?: "draft" | "submitted";
  allowances?: TimeEntryAllowanceInput[];
  overtime_segments?: OvertimeSegmentPersist[];
  /** Admin only: register hours on behalf of another employee (profile.user_id) */
  on_behalf_user_id?: string | null;
  /** Admin only: display name for the employee (falls back to lookup) */
  on_behalf_user_name?: string | null;
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
        source: entry.source || "manual" as const,
      }));

      // Fetch planned work schedules for current user that are not yet confirmed
      // Only show schedules that haven't been converted to time entries yet
      const existingScheduleIds = manualEntries
        .filter(e => e.work_schedule_id)
        .map(e => e.work_schedule_id);

      let schedulesQuery = supabase
        .from("work_schedules")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("schedule_type", "planned")
        .order("schedule_date", { ascending: false });

      // Regular users only see their own schedules
      if (!isCompanyAdmin) {
        schedulesQuery = schedulesQuery.eq("employee_id", user.id);
      }

      const { data: schedulesData, error: schedulesError } = await schedulesQuery;
      if (schedulesError) throw schedulesError;

      // Filter out schedules that are already linked to time entries
      const unconfirmedSchedules = (schedulesData || []).filter(
        (s: any) => !existingScheduleIds.includes(s.id)
      );

      // Convert planned schedules to TimeEntry format for display
      const scheduleEntries: TimeEntry[] = unconfirmedSchedules.map((schedule: any) => {
        const [startHour, startMin] = schedule.start_time.split(":").map(Number);
        const [endHour, endMin] = schedule.end_time.split(":").map(Number);
        const hours = endHour - startHour + (endMin - startMin) / 60;

        return {
          id: `schedule_${schedule.id}`,
          company_id: schedule.company_id,
          user_id: schedule.employee_id,
          user_name: schedule.employee_name,
          entry_date: schedule.schedule_date,
          hours: Math.max(0, hours),
          project_name: null,
          project_id: null,
          description: `Planlagt vakt: ${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}${schedule.location ? ` (${schedule.location})` : ""}`,
          status: "pending_confirmation" as const,
          approved_by: null,
          approved_by_name: null,
          approved_at: null,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
          source: "work_schedule" as const,
          work_schedule_id: schedule.id,
          schedule_location: schedule.location,
          schedule_role: schedule.shift_role,
        };
      });

      // Combine and sort by date
      const allEntries = [...manualEntries, ...clockEntries, ...scheduleEntries].sort(
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
      const { data: inserted, error } = await supabase.from("time_entries").insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        entry_date: entry.entry_date,
        hours: entry.hours,
        start_time: entry.start_time || null,
        end_time: entry.end_time || null,
        project_name: entry.project_name || null,
        project_id: entry.project_id || null,
        ks_project_id: entry.ks_project_id || null,
        customer_name: entry.customer_name || null,
        hour_type: entry.hour_type || "normal",
        description: entry.description || null,
        status: entry.status || "submitted",
        overtime_segments: entry.overtime_segments && entry.overtime_segments.length > 0 ? entry.overtime_segments : null,
      } as any).select("id").single();

      if (error) throw error;

      // Persist allowances
      if (inserted && entry.allowances && entry.allowances.length > 0) {
        const rows = entry.allowances
          .filter((a) => a.type_name && a.quantity > 0)
          .map((a) => ({
            time_entry_id: inserted.id,
            allowance_type_id: a.allowance_type_id || null,
            type_name: a.type_name,
            unit: a.unit,
            quantity: a.quantity,
            rate_snapshot: a.rate_snapshot,
            amount: a.amount,
            notes: a.notes || null,
          }));
        if (rows.length > 0) {
          const { error: aErr } = await supabase.from("time_entry_allowances").insert(rows);
          if (aErr) console.error("Allowance insert error", aErr);
        }
      }

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
      const existing = entries.find((e) => e.id === id);
      if (existing?.status === "approved" && !isCompanyAdmin) {
        toast.error("Timer er allerede godkjent og kan ikke endres. Kontakt admin for å oppheve godkjenningen.");
        return false;
      }

      // QR-stempling: oppdater hours_worked / notes på time_clock_entries
      if (id.startsWith("clock_")) {
        const realId = id.replace("clock_", "");
        const clockUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.hours !== undefined) clockUpdates.hours_worked = updates.hours;
        if (updates.description !== undefined) clockUpdates.notes = updates.description;

        const { error } = await supabase
          .from("time_clock_entries")
          .update(clockUpdates as any)
          .eq("id", realId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("time_entries")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", id);

        if (error) throw error;
      }
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
      const existing = entries.find((e) => e.id === id);
      if (existing?.status === "approved" && !isCompanyAdmin) {
        toast.error("Timer er allerede godkjent og kan ikke slettes. Kontakt admin for å oppheve godkjenningen.");
        return false;
      }
      if (id.startsWith("clock_")) {
        const realId = id.replace("clock_", "");
        const { error } = await supabase.from("time_clock_entries").delete().eq("id", realId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("time_entries").delete().eq("id", id);
        if (error) throw error;
      }
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

  // Confirm a planned work schedule as worked time
  const confirmScheduleEntry = async (id: string, hours?: number): Promise<boolean> => {
    if (!user || !profile?.company_id) {
      toast.error("Du må være logget inn");
      return false;
    }

    // Extract the real schedule ID from the prefixed ID
    const scheduleId = id.replace("schedule_", "");
    
    // Find the schedule entry to get details
    const scheduleEntry = entries.find(e => e.id === id);
    if (!scheduleEntry) {
      toast.error("Fant ikke vakten");
      return false;
    }

    try {
      // Create a time entry linked to the work schedule
      const { error } = await supabase.from("time_entries").insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_name: scheduleEntry.user_name,
        entry_date: scheduleEntry.entry_date,
        hours: hours || scheduleEntry.hours,
        description: scheduleEntry.description,
        status: "submitted",
        work_schedule_id: scheduleId,
        source: "work_schedule",
      });

      if (error) throw error;
      toast.success("Timer bekreftet fra vaktplan");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error confirming schedule entry:", error);
      toast.error("Kunne ikke bekrefte timer");
      return false;
    }
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
    confirmScheduleEntry,
    refetch: fetchEntries,
  };
}
