import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmployeeMessage {
  id: string;
  company_id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useEmployeeMessages() {
  const { profile, company } = useAuth();
  const queryClient = useQueryClient();

  const profileId = profile?.id;

  const { data: receivedMessages = [], isLoading: isLoadingReceived } = useQuery({
    queryKey: ["employee-messages-received", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("employee_messages")
        .select("*")
        .eq("recipient_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeeMessage[];
    },
    enabled: !!profileId,
  });

  const { data: sentMessages = [], isLoading: isLoadingSent } = useQuery({
    queryKey: ["employee-messages-sent", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("employee_messages")
        .select("*")
        .eq("sender_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeeMessage[];
    },
    enabled: !!profileId,
  });

  const unreadCount = receivedMessages.filter((m) => !m.is_read).length;

  const sendMessage = useMutation({
    mutationFn: async (data: {
      recipient_id: string;
      recipient_name: string;
      subject?: string;
      message: string;
    }) => {
      if (!profile || !company?.id) throw new Error("Mangler brukerdata");
      const { error } = await supabase.from("employee_messages").insert({
        company_id: company.id,
        sender_id: profile.id,
        sender_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ukjent",
        recipient_id: data.recipient_id,
        recipient_name: data.recipient_name,
        subject: data.subject || null,
        message: data.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Melding sendt!");
      queryClient.invalidateQueries({ queryKey: ["employee-messages-sent"] });
    },
    onError: (error: any) => {
      console.error("Error sending message:", error);
      toast.error("Kunne ikke sende melding");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("employee_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-messages-received"] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("employee_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Melding slettet");
      queryClient.invalidateQueries({ queryKey: ["employee-messages-sent"] });
      queryClient.invalidateQueries({ queryKey: ["employee-messages-received"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette melding");
    },
  });

  return {
    receivedMessages,
    sentMessages,
    unreadCount,
    isLoading: isLoadingReceived || isLoadingSent,
    sendMessage,
    markAsRead,
    deleteMessage,
  };
}
