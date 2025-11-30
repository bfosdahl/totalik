import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsProjectClient {
  id: string;
  project_id: string;
  company_id: string;
  client_name: string;
  client_type: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  project_manager: string | null;
  created_at: string;
  updated_at: string;
}

export interface KsProjectCoordinator {
  id: string;
  project_id: string;
  company_id: string;
  role_type: string;
  coordinator_name: string;
  coordinator_company: string | null;
  phone: string | null;
  email: string | null;
  contract_document_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface KsProjectClientApproval {
  id: string;
  project_id: string;
  company_id: string;
  approval_type: string;
  approval_description: string | null;
  approved_by_name: string;
  signature_data: string | null;
  approval_date: string;
  ip_address: string | null;
  notes: string | null;
  created_at: string;
}

export interface KsProjectClientMessage {
  id: string;
  project_id: string;
  company_id: string;
  message_type: string;
  subject: string;
  message_content: string;
  sent_by_user_id: string | null;
  sent_by_name: string;
  attachment_paths: string[] | null;
  is_read: boolean;
  created_at: string;
}

export interface KsProjectClientChecklistItem {
  id: string;
  project_id: string;
  company_id: string;
  checklist_item: string;
  is_completed: boolean;
  completed_date: string | null;
  completed_by_name: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useKsProjectClient(projectId: string) {
  const { profile } = useAuth();
  const [clientInfo, setClientInfo] = useState<KsProjectClient | null>(null);
  const [coordinators, setCoordinators] = useState<KsProjectCoordinator[]>([]);
  const [approvals, setApprovals] = useState<KsProjectClientApproval[]>([]);
  const [messages, setMessages] = useState<KsProjectClientMessage[]>([]);
  const [checklistItems, setChecklistItems] = useState<KsProjectClientChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientInfo = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_project_client")
        .select("*")
        .eq("project_id", projectId)
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (error) throw error;
      setClientInfo(data);
    } catch (error) {
      console.error("Error fetching client info:", error);
      toast.error("Kunne ikke hente byggherreinfo");
    }
  };

  const fetchCoordinators = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_project_coordinators")
        .select("*")
        .eq("project_id", projectId)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error("Error fetching coordinators:", error);
      toast.error("Kunne ikke hente koordinatorer");
    }
  };

  const fetchApprovals = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_project_client_approvals")
        .select("*")
        .eq("project_id", projectId)
        .eq("company_id", profile.company_id)
        .order("approval_date", { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      toast.error("Kunne ikke hente godkjenninger");
    }
  };

  const fetchMessages = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_project_client_messages")
        .select("*")
        .eq("project_id", projectId)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Kunne ikke hente meldinger");
    }
  };

  const fetchChecklistItems = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_project_client_checklist")
        .select("*")
        .eq("project_id", projectId)
        .eq("company_id", profile.company_id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setChecklistItems(data || []);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      toast.error("Kunne ikke hente sjekkliste");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchClientInfo(),
        fetchCoordinators(),
        fetchApprovals(),
        fetchMessages(),
        fetchChecklistItems(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [projectId, profile?.company_id]);

  const saveClientInfo = async (data: Partial<KsProjectClient>) => {
    if (!profile?.company_id || !projectId) return;

    try {
      if (clientInfo?.id) {
        const { error } = await supabase
          .from("ks_project_client")
          .update(data)
          .eq("id", clientInfo.id);

        if (error) throw error;
      } else {
        const insertData = {
          client_name: data.client_name || "",
          client_type: data.client_type || "privatperson",
          address: data.address,
          postal_code: data.postal_code,
          city: data.city,
          phone: data.phone,
          email: data.email,
          project_manager: data.project_manager,
          project_id: projectId,
          company_id: profile.company_id,
        };
        
        const { error } = await supabase
          .from("ks_project_client")
          .insert([insertData]);

        if (error) throw error;
      }

      toast.success("Byggherreinfo lagret");
      await fetchClientInfo();
    } catch (error) {
      console.error("Error saving client info:", error);
      toast.error("Kunne ikke lagre byggherreinfo");
    }
  };

  const saveCoordinator = async (data: Partial<KsProjectCoordinator>) => {
    if (!profile?.company_id || !projectId) return;

    try {
      if (data.id) {
        const { error } = await supabase
          .from("ks_project_coordinators")
          .update(data)
          .eq("id", data.id);

        if (error) throw error;
      } else {
        const insertData = {
          role_type: data.role_type || "KP",
          coordinator_name: data.coordinator_name || "",
          coordinator_company: data.coordinator_company,
          phone: data.phone,
          email: data.email,
          contract_document_path: data.contract_document_path,
          project_id: projectId,
          company_id: profile.company_id,
        };
        
        const { error } = await supabase
          .from("ks_project_coordinators")
          .insert([insertData]);

        if (error) throw error;
      }

      toast.success("Koordinator lagret");
      await fetchCoordinators();
    } catch (error) {
      console.error("Error saving coordinator:", error);
      toast.error("Kunne ikke lagre koordinator");
    }
  };

  const deleteCoordinator = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_project_coordinators")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Koordinator slettet");
      await fetchCoordinators();
    } catch (error) {
      console.error("Error deleting coordinator:", error);
      toast.error("Kunne ikke slette koordinator");
    }
  };

  const createApproval = async (data: {
    approval_type: string;
    approval_description?: string;
    approved_by_name: string;
    signature_data?: string;
    notes?: string;
  }) => {
    if (!profile?.company_id || !projectId) return;

    try {
      const { error } = await supabase
        .from("ks_project_client_approvals")
        .insert([{
          ...data,
          project_id: projectId,
          company_id: profile.company_id,
        }]);

      if (error) throw error;

      toast.success("Godkjenning registrert");
      await fetchApprovals();
    } catch (error) {
      console.error("Error creating approval:", error);
      toast.error("Kunne ikke registrere godkjenning");
    }
  };

  const sendMessage = async (data: {
    subject: string;
    message_content: string;
    message_type?: string;
  }) => {
    if (!profile?.company_id || !projectId) return;

    try {
      const { error } = await supabase
        .from("ks_project_client_messages")
        .insert([{
          ...data,
          project_id: projectId,
          company_id: profile.company_id,
          sent_by_user_id: profile.id,
          sent_by_name: `${profile.first_name} ${profile.last_name}`,
          message_type: data.message_type || "message",
        }]);

      if (error) throw error;

      toast.success("Melding sendt");
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Kunne ikke sende melding");
    }
  };

  const updateChecklistItem = async (id: string, data: Partial<KsProjectClientChecklistItem>) => {
    try {
      const { error } = await supabase
        .from("ks_project_client_checklist")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      await fetchChecklistItems();
    } catch (error) {
      console.error("Error updating checklist item:", error);
      toast.error("Kunne ikke oppdatere sjekkpunkt");
    }
  };

  const createChecklistItem = async (checklist_item: string) => {
    if (!profile?.company_id || !projectId) return;

    try {
      const maxOrder = Math.max(0, ...checklistItems.map(item => item.sort_order));
      
      const { error } = await supabase
        .from("ks_project_client_checklist")
        .insert([{
          project_id: projectId,
          company_id: profile.company_id,
          checklist_item,
          sort_order: maxOrder + 1,
        }]);

      if (error) throw error;

      toast.success("Sjekkpunkt lagt til");
      await fetchChecklistItems();
    } catch (error) {
      console.error("Error creating checklist item:", error);
      toast.error("Kunne ikke legge til sjekkpunkt");
    }
  };

  return {
    clientInfo,
    coordinators,
    approvals,
    messages,
    checklistItems,
    isLoading,
    saveClientInfo,
    saveCoordinator,
    deleteCoordinator,
    createApproval,
    sendMessage,
    updateChecklistItem,
    createChecklistItem,
    refetch: async () => {
      await Promise.all([
        fetchClientInfo(),
        fetchCoordinators(),
        fetchApprovals(),
        fetchMessages(),
        fetchChecklistItems(),
      ]);
    },
  };
}
