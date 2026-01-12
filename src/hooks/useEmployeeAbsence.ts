import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays, parseISO, addDays } from "date-fns";

export interface EmployeeAbsence {
  id: string;
  employee_id: string;
  company_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  notes: string | null;
  status: string;
  medical_certificate_path: string | null;
  registered_by: string | null;
  registered_at: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee_name?: string;
  registered_by_name?: string;
  approved_by_name?: string;
}

export interface CreateAbsence {
  employee_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  notes?: string;
}

export function useEmployeeAbsence() {
  const { user, profile, company } = useAuth();
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAbsences = async () => {
    if (!company?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("employee_absence")
        .select(`
          *,
          employee:profiles!employee_absence_employee_id_fkey(first_name, last_name),
          registered_by_profile:profiles!employee_absence_registered_by_fkey(first_name, last_name),
          approved_by_profile:profiles!employee_absence_approved_by_fkey(first_name, last_name)
        `)
        .eq("company_id", company.id)
        .order("start_date", { ascending: false });

      if (error) throw error;

      const getFullName = (profile: { first_name: string | null; last_name: string | null } | null): string => {
        if (!profile) return "Ukjent";
        return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Ukjent";
      };

      const formattedAbsences: EmployeeAbsence[] = (data || []).map((absence: any) => ({
        ...absence,
        employee_name: getFullName(absence.employee),
        registered_by_name: absence.registered_by_profile ? getFullName(absence.registered_by_profile) : null,
        approved_by_name: absence.approved_by_profile ? getFullName(absence.approved_by_profile) : null,
      }));

      setAbsences(formattedAbsences);
    } catch (error) {
      console.error("Error fetching absences:", error);
      toast.error("Kunne ikke hente fraværsdata");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [company?.id]);

  const createAbsence = async (absence: CreateAbsence): Promise<boolean> => {
    if (!company?.id || !profile?.id) {
      toast.error("Mangler bruker- eller bedriftsinformasjon");
      return false;
    }

    try {
      const startDate = parseISO(absence.start_date);
      const endDate = parseISO(absence.end_date);
      const totalDays = differenceInDays(endDate, startDate) + 1;

      if (totalDays < 1) {
        toast.error("Sluttdato må være etter eller lik startdato");
        return false;
      }

      const { error } = await supabase.from("employee_absence").insert({
        employee_id: absence.employee_id,
        company_id: company.id,
        absence_type: absence.absence_type,
        start_date: absence.start_date,
        end_date: absence.end_date,
        total_days: totalDays,
        reason: absence.reason || null,
        notes: absence.notes || null,
        status: "pending",
        registered_by: profile.id,
        registered_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Fravær registrert");
      await fetchAbsences();
      return true;
    } catch (error) {
      console.error("Error creating absence:", error);
      toast.error("Kunne ikke registrere fravær");
      return false;
    }
  };

  const approveAbsence = async (absenceId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from("employee_absence")
        .update({
          status: "approved",
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", absenceId);

      if (error) throw error;

      toast.success("Fravær godkjent");
      await fetchAbsences();
      return true;
    } catch (error) {
      console.error("Error approving absence:", error);
      toast.error("Kunne ikke godkjenne fravær");
      return false;
    }
  };

  const rejectAbsence = async (absenceId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from("employee_absence")
        .update({
          status: "rejected",
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", absenceId);

      if (error) throw error;

      toast.success("Fravær avvist");
      await fetchAbsences();
      return true;
    } catch (error) {
      console.error("Error rejecting absence:", error);
      toast.error("Kunne ikke avvise fravær");
      return false;
    }
  };

  const deleteAbsence = async (absenceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("employee_absence")
        .delete()
        .eq("id", absenceId);

      if (error) throw error;

      toast.success("Fravær slettet");
      await fetchAbsences();
      return true;
    } catch (error) {
      console.error("Error deleting absence:", error);
      toast.error("Kunne ikke slette fravær");
      return false;
    }
  };

  // Get absences for specific employee
  const getEmployeeAbsences = (employeeId: string) => {
    return absences.filter((a) => a.employee_id === employeeId);
  };

  // Get my absences
  const getMyAbsences = () => {
    if (!profile?.id) return [];
    return absences.filter((a) => a.employee_id === profile.id);
  };

  // Calculate stats
  const getYearStats = (employeeId?: string) => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    
    const relevantAbsences = employeeId 
      ? absences.filter(a => a.employee_id === employeeId)
      : absences;

    const yearAbsences = relevantAbsences.filter(a => {
      const startDate = parseISO(a.start_date);
      return startDate >= yearStart && a.status === "approved";
    });

    const totalDays = yearAbsences.reduce((sum, a) => sum + a.total_days, 0);
    const egenmeldingsDays = yearAbsences
      .filter(a => a.absence_type === "egenmelding")
      .reduce((sum, a) => sum + a.total_days, 0);
    
    const activeAbsences = relevantAbsences.filter(a => {
      const today = new Date();
      const startDate = parseISO(a.start_date);
      const endDate = parseISO(a.end_date);
      return startDate <= today && endDate >= today && a.status === "approved";
    });

    return {
      totalDaysThisYear: totalDays,
      egenmeldingsDaysUsed: egenmeldingsDays,
      activeAbsences: activeAbsences.length,
    };
  };

  const getPendingCount = () => {
    return absences.filter(a => a.status === "pending").length;
  };

  return {
    absences,
    isLoading,
    createAbsence,
    approveAbsence,
    rejectAbsence,
    deleteAbsence,
    getEmployeeAbsences,
    getMyAbsences,
    getYearStats,
    getPendingCount,
    refetch: fetchAbsences,
  };
}
