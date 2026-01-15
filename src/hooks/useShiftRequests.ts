import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ShiftRequestType = "swap" | "availability" | "time_change" | "new_shift" | "absence";
export type ShiftRequestStatus = "pending" | "employee_approved" | "manager_approved" | "rejected" | "cancelled" | "completed";

export interface ShiftRequest {
  id: string;
  company_id: string;
  request_type: ShiftRequestType;
  schedule_id: string | null;
  requester_id: string;
  requester_name: string;
  target_employee_id: string | null;
  target_employee_name: string | null;
  is_open_request: boolean;
  proposed_date: string | null;
  proposed_start_time: string | null;
  proposed_end_time: string | null;
  proposed_location: string | null;
  proposed_role: string | null;
  absence_reason: string | null;
  status: ShiftRequestStatus;
  handled_by_id: string | null;
  handled_by_name: string | null;
  handled_at: string | null;
  request_notes: string | null;
  response_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftRequest {
  request_type: ShiftRequestType;
  schedule_id?: string;
  target_employee_id?: string;
  target_employee_name?: string;
  is_open_request?: boolean;
  proposed_date?: string;
  proposed_start_time?: string;
  proposed_end_time?: string;
  proposed_location?: string;
  proposed_role?: string;
  absence_reason?: string;
  request_notes?: string;
}

export function useShiftRequests() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = isCompanyAdmin || isSystemAdmin;

  const fetchRequests = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shift_requests")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data as ShiftRequest[]) || []);
    } catch (error) {
      console.error("Error fetching shift requests:", error);
      toast.error("Kunne ikke hente forespørsler");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.company_id]);

  const createRequest = async (requestData: CreateShiftRequest): Promise<boolean> => {
    if (!profile?.company_id) {
      toast.error("Mangler brukerinformasjon");
      return false;
    }

    try {
      const { error } = await supabase.from("shift_requests").insert({
        company_id: profile.company_id,
        requester_id: profile.id,
        requester_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        ...requestData,
      });

      if (error) throw error;

      const typeLabels: Record<ShiftRequestType, string> = {
        swap: "Bytteforespørsel sendt",
        availability: "Vakt lagt ut som ledig",
        time_change: "Endringsforespørsel sendt",
        new_shift: "Vaktforespørsel sendt",
        absence: "Fraværsforespørsel sendt",
      };

      toast.success(typeLabels[requestData.request_type]);
      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error creating shift request:", error);
      toast.error("Kunne ikke opprette forespørsel");
      return false;
    }
  };

  const respondToRequest = async (
    id: string, 
    response: "approve" | "reject",
    responseNotes?: string
  ): Promise<boolean> => {
    if (!profile) {
      toast.error("Må være logget inn");
      return false;
    }

    try {
      const request = requests.find(r => r.id === id);
      if (!request) {
        toast.error("Fant ikke forespørselen");
        return false;
      }

      let newStatus: ShiftRequestStatus;
      
      if (response === "reject") {
        newStatus = "rejected";
      } else {
        // If target employee is approving a swap
        if (request.target_employee_id === profile.id && request.status === "pending") {
          newStatus = "employee_approved";
        } else if (isAdmin) {
          newStatus = "manager_approved";
        } else {
          newStatus = "employee_approved";
        }
      }

      const { error } = await supabase
        .from("shift_requests")
        .update({
          status: newStatus,
          handled_by_id: profile.id,
          handled_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          handled_at: new Date().toISOString(),
          response_notes: responseNotes,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(response === "approve" ? "Forespørsel godkjent" : "Forespørsel avvist");
      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error responding to shift request:", error);
      toast.error("Kunne ikke behandle forespørsel");
      return false;
    }
  };

  const cancelRequest = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("shift_requests")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Forespørsel kansellert");
      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error cancelling shift request:", error);
      toast.error("Kunne ikke kansellere forespørsel");
      return false;
    }
  };

  const takeOpenShift = async (requestId: string): Promise<boolean> => {
    if (!profile) {
      toast.error("Må være logget inn");
      return false;
    }

    try {
      const { error } = await supabase
        .from("shift_requests")
        .update({
          target_employee_id: profile.id,
          target_employee_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          status: "employee_approved",
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Du har meldt interesse for vakten - venter på godkjenning");
      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error taking open shift:", error);
      toast.error("Kunne ikke ta vakten");
      return false;
    }
  };

  // Get requests relevant to current user
  const getMyRequests = () => {
    return requests.filter(r => r.requester_id === profile?.id);
  };

  // Get requests where current user needs to respond
  const getPendingForMe = () => {
    return requests.filter(r => 
      r.target_employee_id === profile?.id && 
      r.status === "pending"
    );
  };

  // Get open shifts anyone can take
  const getOpenShifts = () => {
    return requests.filter(r => 
      r.is_open_request && 
      r.status === "pending" &&
      r.requester_id !== profile?.id
    );
  };

  // Get requests pending admin approval
  const getPendingAdminApproval = () => {
    return requests.filter(r => 
      (r.status === "pending" || r.status === "employee_approved") &&
      r.request_type !== "swap" // Swaps with open request need manager final approval
    );
  };

  return {
    requests,
    isLoading,
    createRequest,
    respondToRequest,
    cancelRequest,
    takeOpenShift,
    getMyRequests,
    getPendingForMe,
    getOpenShifts,
    getPendingAdminApproval,
    refetch: fetchRequests,
  };
}
