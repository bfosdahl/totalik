import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsModule2ProjectAccess {
  id: string;
  project_id: string;
  subcontractor_id: string | null;
  user_id: string | null;
  email: string;
  name: string;
  company_name: string | null;
  role_in_project: string;
  access_level: 'none' | 'guest' | 'full_ue';
  invited_by: string | null;
  invited_by_name: string | null;
  invited_at: string;
  expires_at: string | null;
  last_login: string | null;
  login_count: number;
  status: 'invited' | 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export interface InviteSubcontractorInput {
  project_id: string;
  subcontractor_id?: string;
  email: string;
  name: string;
  company_name?: string;
  role_in_project: string;
  access_level: 'none' | 'guest' | 'full_ue';
  expires_at?: string;
}

// Temp password generation removed for security - now uses secure reset links

export function useKsModule2ProjectAccess(projectId: string | null) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: accessList = [], isLoading } = useQuery({
    queryKey: ["ks-module2-project-access", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("ks_module2_project_access")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KsModule2ProjectAccess[];
    },
    enabled: !!projectId,
  });

  const inviteAccess = useMutation({
    mutationFn: async (input: InviteSubcontractorInput) => {
      const { data, error } = await supabase
        .from("ks_module2_project_access")
        .insert({
          project_id: input.project_id,
          subcontractor_id: input.subcontractor_id || null,
          email: input.email,
          name: input.name,
          company_name: input.company_name || null,
          role_in_project: input.role_in_project,
          access_level: input.access_level,
          invited_by: user?.id,
          invited_by_name: profile ? `${profile.first_name} ${profile.last_name}` : 'System',
          expires_at: input.expires_at || null,
          status: input.access_level !== 'none' ? 'invited' : 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      // If access is granted, send invitation email with secure reset link
      if (input.access_level !== 'none') {
        try {
          await supabase.functions.invoke('invite-ue-access', {
            body: {
              email: input.email,
              name: input.name,
              company_name: input.company_name,
              project_id: input.project_id,
              access_level: input.access_level,
            }
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-project-access"] });
      if (data.access_level !== 'none') {
        toast.success("Invitasjon sendt!", {
          description: `${data.name} har fått tilgang til prosjektet`
        });
      }
    },
    onError: (error) => {
      console.error("Error inviting access:", error);
      toast.error("Kunne ikke sende invitasjon");
    },
  });

  const updateAccess = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsModule2ProjectAccess> & { id: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_project_access")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-project-access"] });
      toast.success("Tilgang oppdatert");
    },
    onError: (error) => {
      console.error("Error updating access:", error);
      toast.error("Kunne ikke oppdatere tilgang");
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_module2_project_access")
        .update({ status: 'revoked', access_level: 'none' })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-project-access"] });
      toast.success("Tilgang fjernet");
    },
    onError: (error) => {
      console.error("Error revoking access:", error);
      toast.error("Kunne ikke fjerne tilgang");
    },
  });

  const renewAccess = useMutation({
    mutationFn: async ({ id, newExpiryDate }: { id: string; newExpiryDate?: string }) => {
      const { data, error } = await supabase
        .from("ks_module2_project_access")
        .update({ 
          status: 'invited',
          access_level: 'guest',
          expires_at: newExpiryDate || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-project-access"] });
      toast.success("Tilgang fornyet");
    },
    onError: (error) => {
      console.error("Error renewing access:", error);
      toast.error("Kunne ikke fornye tilgang");
    },
  });

  return {
    accessList,
    isLoading,
    inviteAccess,
    updateAccess,
    revokeAccess,
    renewAccess,
    isInviting: inviteAccess.isPending,
  };
}

export function useKsModule2AccessLog(projectId: string | null) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["ks-module2-access-log", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("ks_module2_access_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  return { logs, isLoading };
}
