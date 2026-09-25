import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ChevronDown, ChevronUp, Megaphone, MessageCircle, Paperclip, Pencil, Pin, PinOff, Plus, Trash2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CompanyAnnouncement, useAnnouncementPeople, useCompanyAnnouncements,
} from "@/hooks/useCompanyAnnouncements";
import { AnnouncementEditorDialog } from "./announcements/AnnouncementEditorDialog";
import { AnnouncementThreadDialog } from "./announcements/AnnouncementThreadDialog";
import { cn } from "@/lib/utils";

const fmt = (v: string) =>
  new Date(v).toLocaleString("nb-NO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

export function AnnouncementsBoard() {
  const {
    announcements, readIds, isLoading, isAdmin, userId, canManage,
    createAnnouncement, updateAnnouncement, togglePinned, deleteAnnouncement, markAsRead, isSaving,
  } = useCompanyAnnouncements();
  const { projects } = useAnnouncementPeople();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyAnnouncement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const projectName = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects]);
  const usedProjects = projects.filter((p) => announcements.some((a) => a.project_id === p.id));

  const filtered = announcements.filter((a) => projectFilter === "all" || a.project_id === projectFilter);
  const shown = showAll ? filtered : filtered.slice(0, 5);
  const unread = announcements.filter((a) => !readIds.includes(a.id)).length;
  const openAnn = announcements.find((a) => a.id === openId) || null;

  const open = (a: CompanyAnnouncement) => {
    setOpenId(a.id);
    if (!readIds.includes(a.id)) markAsRead(a.id).catch(() => undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className={cn("flex items-center justify-between gap-3", collapsed ? "" : "mb-4")}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
            <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h3 className="text-base md:text-lg font-semibold truncate">Oppslagstavle</h3>
          {unread > 0 && <Badge variant="destructive" className="shrink-0">{unread} nye</Badge>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ny melding</span>
          </Button>
          <Button size="icon" variant="ghost" title={collapsed ? "Vis" : "Skjul"} onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <>
          {usedProjects.length > 0 && (
            <div className="mb-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 w-full sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle meldinger</SelectItem>
                  {usedProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laster meldinger...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen meldinger ennå. Trykk «Ny melding» for å skrive til alle eller til de som er på et prosjekt.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {shown.map((a) => {
                const isUnread = !readIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => open(a)}
                    onKeyDown={(e) => e.key === "Enter" && open(a)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50",
                      a.is_pinned && "bg-primary/5"
                    )}
                  >
                    <div className="flex w-5 shrink-0 flex-col items-center gap-1 pt-0.5">
                      {a.is_pinned && <Pin className="h-4 w-4 fill-destructive text-destructive" />}
                      {a.is_critical && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {!a.is_pinned && !a.is_critical && isUnread && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn("truncate text-sm md:text-base", isUnread ? "font-semibold" : "font-medium")}>{a.title}</h4>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmt(a.last_activity_at || a.publish_at)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{a.created_by_name || "Ukjent"}</span>
                        {a.project_id && projectName[a.project_id] && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">{projectName[a.project_id]}</Badge>
                        )}
                        {a.audience === "selected" && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.recipient_ids.length}</span>
                        )}
                        {a.reply_count > 0 && (
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{a.reply_count}</span>
                        )}
                        {a.attachments.length > 0 && (
                          <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{a.attachments.length}</span>
                        )}
                      </div>
                    </div>
                    {canManage(a) && (
                      <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" title={a.is_pinned ? "Løsne" : "Fest øverst"}
                            onClick={() => togglePinned({ id: a.id, is_pinned: !a.is_pinned })}>
                            {a.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Rediger"
                          onClick={() => { setEditing(a); setEditorOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Fjern"
                          onClick={() => window.confirm("Fjerne meldingen?") && deleteAnnouncement(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length > 5 && (
            <Button variant="ghost" size="sm" className="mt-2 w-full gap-2" onClick={() => setShowAll((v) => !v)}>
              {showAll ? <><ChevronUp className="w-4 h-4" /> Vis færre</> : <><ChevronDown className="w-4 h-4" /> Vis alle ({filtered.length - 5} til)</>}
            </Button>
          )}
        </>
      )}

      <AnnouncementEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        isAdmin={isAdmin}
        userId={userId}
        isSaving={isSaving}
        onSave={async (input) => {
          if (editing) await updateAnnouncement({ id: editing.id, ...input });
          else await createAnnouncement(input);
        }}
      />
      <AnnouncementThreadDialog
        announcement={openAnn}
        projectName={openAnn?.project_id ? projectName[openAnn.project_id] : undefined}
        onClose={() => setOpenId(null)}
      />
    </motion.div>
  );
}
