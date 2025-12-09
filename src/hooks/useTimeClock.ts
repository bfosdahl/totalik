import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TimeClockQrCode {
  id: string;
  company_id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface TimeClockEntry {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  qr_code_id: string | null;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
  notes: string | null;
  status: "active" | "completed" | "cancelled";
  break_start: string | null;
  break_end: string | null;
  total_break_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export function useTimeClock() {
  const { user, profile, isCompanyAdmin } = useAuth();
  const [qrCodes, setQrCodes] = useState<TimeClockQrCode[]>([]);
  const [entries, setEntries] = useState<TimeClockEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeClockEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQrCodes = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("time_clock_qr_codes")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQrCodes((data as TimeClockQrCode[]) || []);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  const fetchEntries = async () => {
    if (!user || !profile?.company_id) return;

    try {
      let query = supabase
        .from("time_clock_entries")
        .select("*")
        .order("clock_in", { ascending: false })
        .limit(50);

      if (!isCompanyAdmin) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.eq("company_id", profile.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as TimeClockEntry[]) || []);

      // Find active entry for current user
      const active = (data as TimeClockEntry[])?.find(
        (e) => e.user_id === user.id && e.status === "active"
      );
      setActiveEntry(active || null);
    } catch (error) {
      console.error("Error fetching clock entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCodes();
    fetchEntries();
  }, [user, profile?.company_id, isCompanyAdmin]);

  const generateQrCode = async (name: string = "Hovedkontor"): Promise<TimeClockQrCode | null> => {
    if (!profile?.company_id || !user) {
      toast.error("Du må være logget inn");
      return null;
    }

    try {
      // Generate a unique code
      const code = `TC-${profile.company_id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from("time_clock_qr_codes")
        .insert({
          company_id: profile.company_id,
          code,
          name,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("QR-kode opprettet");
      await fetchQrCodes();
      return data as TimeClockQrCode;
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Kunne ikke opprette QR-kode");
      return null;
    }
  };

  const clockIn = async (qrCodeId?: string): Promise<boolean> => {
    if (!user || !profile?.company_id) {
      toast.error("Du må være logget inn");
      return false;
    }

    if (activeEntry) {
      toast.error("Du er allerede stemplet inn");
      return false;
    }

    try {
      const { error } = await supabase.from("time_clock_entries").insert({
        company_id: profile.company_id,
        user_id: user.id,
        user_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        qr_code_id: qrCodeId || null,
        clock_in: new Date().toISOString(),
        status: "active",
      });

      if (error) throw error;
      toast.success("✅ Stemplet inn!");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Kunne ikke stemple inn");
      return false;
    }
  };

  const clockOut = async (notes?: string): Promise<boolean> => {
    if (!activeEntry) {
      toast.error("Du er ikke stemplet inn");
      return false;
    }

    try {
      const clockOut = new Date();
      const clockIn = new Date(activeEntry.clock_in);
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from("time_clock_entries")
        .update({
          clock_out: clockOut.toISOString(),
          hours_worked: Math.round(hoursWorked * 100) / 100,
          notes: notes || null,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEntry.id);

      if (error) throw error;
      toast.success(`✅ Stemplet ut! (${hoursWorked.toFixed(1)} timer)`);
      await fetchEntries();
      return true;
    } catch (error: unknown) {
      console.error("Error clocking out:", error);
      toast.error("Kunne ikke stemple ut");
      return false;
    }
  };

  const deleteQrCode = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("time_clock_qr_codes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("QR-kode deaktivert");
      await fetchQrCodes();
      return true;
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Kunne ikke deaktivere QR-kode");
      return false;
    }
  };

  // Find QR code by code string
  const findQrCodeByCode = async (code: string): Promise<TimeClockQrCode | null> => {
    try {
      const { data, error } = await supabase
        .from("time_clock_qr_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error) return null;
      return data as TimeClockQrCode;
    } catch {
      return null;
    }
  };

  const startBreak = async (): Promise<boolean> => {
    if (!activeEntry) {
      toast.error("Du må være stemplet inn for å ta pause");
      return false;
    }

    if (activeEntry.break_start && !activeEntry.break_end) {
      toast.error("Du er allerede på pause");
      return false;
    }

    try {
      const { error } = await supabase
        .from("time_clock_entries")
        .update({
          break_start: new Date().toISOString(),
          break_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEntry.id);

      if (error) throw error;
      toast.success("☕ Pause startet");
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error starting break:", error);
      toast.error("Kunne ikke starte pause");
      return false;
    }
  };

  const endBreak = async (): Promise<boolean> => {
    if (!activeEntry || !activeEntry.break_start) {
      toast.error("Du er ikke på pause");
      return false;
    }

    try {
      const breakEnd = new Date();
      const breakStart = new Date(activeEntry.break_start);
      const breakMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
      const totalBreak = (activeEntry.total_break_minutes || 0) + breakMinutes;

      const { error } = await supabase
        .from("time_clock_entries")
        .update({
          break_end: breakEnd.toISOString(),
          total_break_minutes: totalBreak,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEntry.id);

      if (error) throw error;
      toast.success(`✅ Pause avsluttet (${breakMinutes} min)`);
      await fetchEntries();
      return true;
    } catch (error) {
      console.error("Error ending break:", error);
      toast.error("Kunne ikke avslutte pause");
      return false;
    }
  };

  const isOnBreak = activeEntry?.break_start && !activeEntry?.break_end;

  return {
    qrCodes,
    entries,
    activeEntry,
    isLoading,
    isOnBreak: !!isOnBreak,
    generateQrCode,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    deleteQrCode,
    findQrCodeByCode,
    refetch: fetchEntries,
  };
}
