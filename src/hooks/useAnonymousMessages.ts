import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AnonymousMessage {
  id: string;
  company_id: string;
  message_number: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface AnonymousMessageDiscussion {
  id: string;
  message_id: string;
  company_id: string;
  user_id: string | null;
  user_name: string;
  comment: string;
  created_at: string;
}

export function useAnonymousMessages() {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["anonymous-messages", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("anonymous_messages")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AnonymousMessage[];
    },
    enabled: !!company?.id,
  });

  const submitMessage = useMutation({
    mutationFn: async (data: { category: string; subject: string; message: string }) => {
      if (!company?.id) throw new Error("Ingen bedrift funnet");

      // Generate message number using RPC
      const { data: messageNumber, error: rpcError } = await supabase
        .rpc("generate_anonymous_message_number", { p_company_id: company.id });

      if (rpcError) throw rpcError;

      const { error } = await supabase
        .from("anonymous_messages")
        .insert({
          company_id: company.id,
          message_number: messageNumber,
          category: data.category,
          subject: data.subject,
          message: data.message,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Din anonyme melding er sendt");
      queryClient.invalidateQueries({ queryKey: ["anonymous-messages"] });
    },
    onError: (error) => {
      console.error("Error submitting anonymous message:", error);
      toast.error("Kunne ikke sende melding. Prøv igjen.");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("anonymous_messages")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status oppdatert");
      queryClient.invalidateQueries({ queryKey: ["anonymous-messages"] });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Kunne ikke oppdatere status");
    },
  });

  return {
    messages,
    isLoading,
    submitMessage,
    updateStatus,
  };
}

export function useAnonymousMessageDiscussions(messageId: string | null) {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ["anonymous-message-discussions", messageId],
    queryFn: async () => {
      if (!messageId) return [];
      
      const { data, error } = await supabase
        .from("anonymous_message_discussions")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as AnonymousMessageDiscussion[];
    },
    enabled: !!messageId,
  });

  const addDiscussion = useMutation({
    mutationFn: async (comment: string) => {
      if (!messageId || !company?.id || !profile) throw new Error("Mangler data");

      const { error } = await supabase
        .from("anonymous_message_discussions")
        .insert({
          message_id: messageId,
          company_id: company.id,
          user_id: profile.user_id,
          user_name: `${profile.first_name} ${profile.last_name}`,
          comment,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kommentar lagt til");
      queryClient.invalidateQueries({ queryKey: ["anonymous-message-discussions", messageId] });
    },
    onError: (error) => {
      console.error("Error adding discussion:", error);
      toast.error("Kunne ikke legge til kommentar");
    },
  });

  return {
    discussions,
    isLoading,
    addDiscussion,
  };
}
