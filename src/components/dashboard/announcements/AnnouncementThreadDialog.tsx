import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Paperclip, Pin, Send, Trash2, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyAnnouncement, useAnnouncementReplies } from "@/hooks/useCompanyAnnouncements";
import { AttachmentList, PendingFiles } from "./AttachmentList";
import { cn } from "@/lib/utils";

const fmt = (v: string) =>
  new Date(v).toLocaleString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

interface Props {
  announcement: CompanyAnnouncement | null;
  projectName?: string;
  onClose: () => void;
}

export function AnnouncementThreadDialog({ announcement, projectName, onClose }: Props) {
  const { replies, isLoading, userId, isAdmin, sendReply, isSending, deleteReply } = useAnnouncementReplies(
    announcement?.id || null
  );
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [replies.length]);

  useEffect(() => {
    setText("");
    setFiles([]);
  }, [announcement?.id]);

  const send = async () => {
    if (!text.trim() && !files.length) return;
    await sendReply({ body: text.trim(), files });
    setText("");
    setFiles([]);
  };

  const a = announcement;
  return (
    <Dialog open={!!a} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-xl">
        {a && (
          <>
            <DialogHeader className="border-b border-border p-4 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-6">
                {a.is_pinned && <Pin className="h-4 w-4 text-destructive" />}
                {a.is_critical && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <DialogTitle className="text-base">{a.title}</DialogTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span>{a.created_by_name || "Ukjent"} · {fmt(a.publish_at)}</span>
                {projectName && (
                  <Badge variant="secondary" className="gap-1"><FolderKanban className="h-3 w-3" />{projectName}</Badge>
                )}
                {a.audience === "selected" && (
                  <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{a.recipient_ids.length} mottakere</Badge>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="whitespace-pre-wrap text-sm">{a.body}</p>
                <AttachmentList items={a.attachments} />
              </div>

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {replies.length ? `${replies.length} svar` : "Ingen svar ennå"}
              </p>
              {isLoading && <p className="text-sm text-muted-foreground">Laster...</p>}
              {replies.map((r) => {
                const mine = r.user_id === userId;
                return (
                  <div key={r.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      <div className={cn("flex items-center gap-2 text-xs", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        <span className="font-medium">{mine ? "Deg" : r.author_name || "Ukjent"}</span>
                        <span>{fmt(r.created_at)}</span>
                        {(mine || isAdmin) && (
                          <button type="button" title="Slett" onClick={() => deleteReply(r.id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {r.body && <p className="mt-0.5 whitespace-pre-wrap text-sm">{r.body}</p>}
                      <AttachmentList items={r.attachments} />
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="space-y-2 border-t border-border p-3">
              <PendingFiles files={files} onRemove={(i) => setFiles((f) => f.filter((_, x) => x !== i))} />
              <div className="flex items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    setFiles((f) => [...f, ...Array.from(e.target.files || [])]);
                    e.target.value = "";
                  }}
                />
                <Button type="button" size="icon" variant="ghost" title="Legg ved bilde eller fil" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Skriv et svar..."
                  className="min-h-[40px] resize-none"
                  aria-label="Skriv et svar"
                />
                <Button type="button" size="icon" onClick={send} disabled={isSending || (!text.trim() && !files.length)} title="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
