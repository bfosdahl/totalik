import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CompanyAnnouncement {
  id: string;
  company_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  publish_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  is_pinned?: boolean;
  expires_at?: string | null;
}

export function useCompanyAnnouncements() {
  const { user, profile, company, isCompanyAdmin } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id || profile?.company_id;

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["company-announcements", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_announcements")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("is_pinned", { ascending: false })
        .order("publish_at", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return ((data || []) as CompanyAnnouncement[]).filter(
        (a) => !a.expires_at || new Date(a.expires_at).getTime() >= now
      );
    },
    enabled: !!companyId,
  });

  const { data: readIds = [] } = useQuery({
    queryKey: ["company-announcement-reads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("company_announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r: { announcement_id: string }) => r.announcement_id);
    },
    enabled: !!user?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["company-announcement-reads"] });
  };

  const createAnnouncement = useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      if (!companyId || !profile) throw new Error("Mangler brukerdata");
      const name =
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Ledelsen";
      const { error } = await supabase.from("company_announcements").insert({
        company_id: companyId,
        title: input.title,
        body: input.body,
        is_pinned: input.is_pinned ?? false,
        expires_at: input.expires_at || null,
        created_by: profile.id,
        created_by_name: name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Meldingen er publisert til alle ansatte");
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke publisere meldingen");
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: AnnouncementInput & { id: string }) => {
      const { error } = await supabase
        .from("company_announcements")
        .update({
          title: updates.title,
          body: updates.body,
          is_pinned: updates.is_pinned ?? false,
          expires_at: updates.expires_at || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Meldingen er oppdatert");
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke oppdatere meldingen");
    },
  });

  const togglePinned = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from("company_announcements")
        .update({ is_pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke endre festing");
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_announcements")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: profile?.id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Meldingen er fjernet");
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke fjerne meldingen");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user?.id) throw new Error("Ikke innlogget");
      const { error } = await supabase
        .from("company_announcement_reads")
        .insert({ announcement_id: announcementId, user_id: user.id });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-announcement-reads"] });
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke lagre kvittering");
    },
  });

  return {
    announcements,
    readIds,
    isLoading,
    isAdmin: !!isCompanyAdmin,
    createAnnouncement: createAnnouncement.mutateAsync,
    updateAnnouncement: updateAnnouncement.mutateAsync,
    togglePinned: togglePinned.mutateAsync,
    deleteAnnouncement: deleteAnnouncement.mutateAsync,
    markAsRead: markAsRead.mutateAsync,
    isSaving: createAnnouncement.isPending || updateAnnouncement.isPending,
  };
}
