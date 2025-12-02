import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TimeOffRequest {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  type: "ferie" | "sykdom" | "permisjon" | "annet";
  reason: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by_id: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeOffRequest {
  start_date: string;
  end_date: string;
  type: "ferie" | "sykdom" | "permisjon" | "annet";
  reason?: string;
}

export function useTimeOffRequests() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("time_off_requests")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      // If not admin, only show own requests
      if (!isCompanyAdmin && !isSystemAdmin) {
        query = query.eq("employee_id", profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as TimeOffRequest[]) || []);
    } catch (error) {
      console.error("Error fetching time off requests:", error);
      toast.error("Kunne ikke hente ferieforespørsler");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.company_id, isCompanyAdmin, isSystemAdmin]);

  const createRequest = async (requestData: CreateTimeOffRequest): Promise<boolean> => {
    if (!profile?.company_id || !profile?.id) {
      toast.error("Mangler brukerinformasjon");
      return false;
    }

    try {
      const { error } = await supabase.from("time_off_requests").insert({
        company_id: profile.company_id,
        employee_id: profile.id,
        employee_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        ...requestData,
      });

      if (error) throw error;

      toast.success("Ferieforespørsel sendt");
      
      // Send notification
      await supabase.functions.invoke("notify-time-off-request", {
        body: {
          requestId: profile.id,
          employeeName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
          startDate: requestData.start_date,
          endDate: requestData.end_date,
          type: requestData.type,
        },
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error creating time off request:", error);
      toast.error("Kunne ikke opprette ferieforespørsel");
      return false;
    }
  };

  const approveRequest = async (requestId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const request = requests.find(r => r.id === requestId);
      
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          status: "approved",
          approved_by_id: profile.id,
          approved_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Ferieforespørsel godkjent");
      
      // Send notification
      if (request) {
        await supabase.functions.invoke("notify-time-off-approval", {
          body: {
            requestId,
            employeeName: request.employee_name,
            status: "approved",
            startDate: request.start_date,
            endDate: request.end_date,
          },
        });
      }

      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Kunne ikke godkjenne forespørsel");
      return false;
    }
  };

  const rejectRequest = async (requestId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const request = requests.find(r => r.id === requestId);
      
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          status: "rejected",
          approved_by_id: profile.id,
          approved_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Ferieforespørsel avslått");
      
      // Send notification
      if (request) {
        await supabase.functions.invoke("notify-time-off-approval", {
          body: {
            requestId,
            employeeName: request.employee_name,
            status: "rejected",
            startDate: request.start_date,
            endDate: request.end_date,
          },
        });
      }

      await fetchRequests();
      return true;
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Kunne ikke avslå forespørsel");
      return false;
    }
  };

  return {
    requests,
    isLoading,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
}
