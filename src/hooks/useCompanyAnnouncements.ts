import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
export const ANNOUNCEMENT_BUCKET = "announcement-attachments";

export interface AnnouncementAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export interface CompanyAnnouncement {
  id: string;
  company_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_critical: boolean;
  audience: "all" | "selected";
  project_id: string | null;
  publish_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_by_user_id: string | null;
  created_by_name: string | null;
  attachments: AnnouncementAttachment[];
  last_activity_at: string;
  created_at: string;
  reply_count: number;
  recipient_ids: string[];
}

export interface AnnouncementReply {
  id: string;
  announcement_id: string;
  user_id: string;
  author_name: string | null;
  body: string;
  attachments: AnnouncementAttachment[];
  created_at: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  is_pinned?: boolean;
  is_critical?: boolean;
  expires_at?: string | null;
  project_id?: string | null;
  audience: "all" | "selected";
  recipient_ids: string[];
  files?: File[];
  existing_attachments?: AnnouncementAttachment[];
}

const sanitize = (name: string) =>
  name
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/Æ/g, "AE").replace(/Ø/g, "O").replace(/Å/g, "A")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

export async function uploadAnnouncementFiles(companyId: string, files: File[]) {
  const out: AnnouncementAttachment[] = [];
  for (const f of files) {
    if (f.size > 15 * 1024 * 1024) {
      toast.error(`${f.name} er større enn 15 MB`);
      continue;
    }
    const path = `${companyId}/${crypto.randomUUID()}_${sanitize(f.name)}`;
    const { error } = await supabase.storage.from(ANNOUNCEMENT_BUCKET).upload(path, f, {
      contentType: f.type || undefined,
    });
    if (error) throw error;
    out.push({ path, name: f.name, type: f.type, size: f.size });
  }
  return out;
}

export function useCompanyAnnouncements() {
  const { user, profile, company, isCompanyAdmin } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id || profile?.company_id;
  const authorName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Ansatt";

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["company-announcements", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db
        .from("company_announcements")
        .select("*, company_announcement_replies(id, is_deleted), company_announcement_recipients(user_id)")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data || []) as any[])
        .filter((a) => !a.expires_at || new Date(a.expires_at).getTime() >= now)
        .map((a) => ({
          ...a,
          attachments: Array.isArray(a.attachments) ? a.attachments : [],
          reply_count: (a.company_announcement_replies || []).filter((r: { is_deleted: boolean }) => !r.is_deleted).length,
          recipient_ids: (a.company_announcement_recipients || []).map((r: { user_id: string }) => r.user_id),
        })) as CompanyAnnouncement[];
    },
    enabled: !!companyId,
  });

  const { data: readIds = [] } = useQuery({
    queryKey: ["company-announcement-reads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await db
        .from("company_announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r: { announcement_id: string }) => r.announcement_id) as string[];
    },
    enabled: !!user?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["company-announcement-reads"] });
    queryClient.invalidateQueries({ queryKey: ["announcement-replies"] });
  };

  const saveRecipients = async (id: string, input: AnnouncementInput) => {
    const { error: delErr } = await db.from("company_announcement_recipients").delete().eq("announcement_id", id);
    if (delErr) throw delErr;
    if (input.audience === "selected") {
      const ids = Array.from(new Set([...input.recipient_ids, user!.id]));
      const { error } = await db
        .from("company_announcement_recipients")
        .insert(ids.map((uid) => ({ announcement_id: id, user_id: uid })));
      if (error) throw error;
    }
  };

  const createAnnouncement = useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      if (!companyId || !profile || !user) throw new Error("Mangler brukerdata");
      const uploaded = input.files?.length ? await uploadAnnouncementFiles(companyId, input.files) : [];
      const { data, error } = await db
        .from("company_announcements")
        .insert({
          company_id: companyId,
          title: input.title,
          body: input.body,
          is_pinned: isCompanyAdmin ? input.is_pinned ?? false : false,
          is_critical: input.is_critical ?? false,
          expires_at: input.expires_at || null,
          project_id: input.project_id || null,
          audience: input.audience,
          attachments: uploaded,
          created_by: profile.id,
          created_by_user_id: user.id,
          created_by_name: authorName,
        })
        .select("id")
        .single();
      if (error) throw error;
      await saveRecipients(data.id, input);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Meldingen er publisert");
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke publisere meldingen");
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...input }: AnnouncementInput & { id: string }) => {
      if (!companyId) throw new Error("Mangler bedrift");
      const uploaded = input.files?.length ? await uploadAnnouncementFiles(companyId, input.files) : [];
      const { error } = await db
        .from("company_announcements")
        .update({
          title: input.title,
          body: input.body,
          is_critical: input.is_critical ?? false,
          ...(isCompanyAdmin ? { is_pinned: input.is_pinned ?? false } : {}),
          expires_at: input.expires_at || null,
          project_id: input.project_id || null,
          audience: input.audience,
          attachments: [...(input.existing_attachments || []), ...uploaded],
        })
        .eq("id", id);
      if (error) throw error;
      await saveRecipients(id, input);
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
      const { error } = await db.from("company_announcements").update({ is_pinned }).eq("id", id);
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
      const { error } = await db
        .from("company_announcements")
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: profile?.id || null })
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
      const { error } = await db
        .from("company_announcement_reads")
        .insert({ announcement_id: announcementId, user_id: user.id });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-announcement-reads"] }),
  });

  const canManage = (a: CompanyAnnouncement) => !!isCompanyAdmin || a.created_by_user_id === user?.id;

  return {
    announcements,
    readIds,
    isLoading,
    isAdmin: !!isCompanyAdmin,
    userId: user?.id,
    companyId,
    authorName,
    canManage,
    createAnnouncement: createAnnouncement.mutateAsync,
    updateAnnouncement: updateAnnouncement.mutateAsync,
    togglePinned: togglePinned.mutateAsync,
    deleteAnnouncement: deleteAnnouncement.mutateAsync,
    markAsRead: markAsRead.mutateAsync,
    isSaving: createAnnouncement.isPending || updateAnnouncement.isPending,
  };
}

export function useAnnouncementReplies(announcementId: string | null) {
  const { user, profile, company, isCompanyAdmin } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id || profile?.company_id;
  const authorName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Ansatt";

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ["announcement-replies", announcementId],
    queryFn: async () => {
      const { data, error } = await db
        .from("company_announcement_replies")
        .select("*")
        .eq("announcement_id", announcementId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data || []) as any[]).map((r) => ({
        ...r,
        attachments: Array.isArray(r.attachments) ? r.attachments : [],
      })) as AnnouncementReply[];
    },
    enabled: !!announcementId,
    refetchInterval: 15000,
  });

  const sendReply = useMutation({
    mutationFn: async ({ body, files }: { body: string; files: File[] }) => {
      if (!announcementId || !companyId || !user) throw new Error("Mangler data");
      const uploaded = files.length ? await uploadAnnouncementFiles(companyId, files) : [];
      const { error } = await db.from("company_announcement_replies").insert({
        announcement_id: announcementId,
        company_id: companyId,
        user_id: user.id,
        author_name: authorName,
        body,
        attachments: uploaded,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-replies", announcementId] });
      queryClient.invalidateQueries({ queryKey: ["company-announcements"] });
    },
    onError: (e: Error) => {
      console.error(e);
      toast.error("Kunne ikke sende svaret");
    },
  });

  const deleteReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("company_announcement_replies")
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-replies", announcementId] });
      queryClient.invalidateQueries({ queryKey: ["company-announcements"] });
    },
    onError: () => toast.error("Kunne ikke slette svaret"),
  });

  return {
    replies,
    isLoading,
    userId: user?.id,
    isAdmin: !!isCompanyAdmin,
    sendReply: sendReply.mutateAsync,
    isSending: sendReply.isPending,
    deleteReply: deleteReply.mutateAsync,
  };
}

export function useAnnouncementPeople() {
  const { profile, company } = useAuth();
  const companyId = company?.id || profile?.company_id;

  const { data: employees = [] } = useQuery({
    queryKey: ["announcement-employees", companyId],
    queryFn: async () => {
      const { data, error } = await db
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("first_name");
      if (error) throw error;
      return ((data || []) as { user_id: string; first_name: string | null; last_name: string | null; email: string | null }[])
        .filter((p) => p.user_id)
        .map((p) => ({ id: p.user_id, name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Ukjent" }));
    },
    enabled: !!companyId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["announcement-projects", companyId],
    queryFn: async () => {
      const { data, error } = await db
        .from("ks_module2_projects")
        .select("id, project_name, status")
        .eq("company_id", companyId)
        .order("project_name");
      if (error) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data || []) as any[])
        .filter((p) => !["completed", "archived", "deleted"].includes(p.status))
        .map((p) => ({ id: p.id as string, name: (p.project_name as string) || "Uten navn" }));
    },
    enabled: !!companyId,
  });

  const fetchCrew = async (projectId: string) => {
    const { data } = await db
      .from("ks_module2_project_crew")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("is_active", true);
    return ((data || []) as { user_id: string }[]).map((c) => c.user_id);
  };

  return { employees, projects, fetchCrew };
}

export async function getSignedUrls(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const { data } = await supabase.storage.from(ANNOUNCEMENT_BUCKET).createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  (data || []).forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}
