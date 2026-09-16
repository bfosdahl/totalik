import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Pin, PinOff, Plus, Trash2, Pencil, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCompanyAnnouncements, CompanyAnnouncement } from "@/hooks/useCompanyAnnouncements";
import { cn } from "@/lib/utils";

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
};

export function AnnouncementsBoard() {
  const {
    announcements,
    readIds,
    isLoading,
    isAdmin,
    createAnnouncement,
    updateAnnouncement,
    togglePinned,
    deleteAnnouncement,
    markAsRead,
    isSaving,
  } = useCompanyAnnouncements();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyAnnouncement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const visible = announcements.filter((a) => a.is_pinned || !readIds.includes(a.id));
  const shown = showAll ? visible : visible.slice(0, 3);
  const hiddenCount = visible.length - shown.length;

  if (!isLoading && visible.length === 0 && !isAdmin) return null;

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setBody("");
    setPinned(false);
    setExpiresAt("");
    setDialogOpen(true);
  };

  const openEdit = (a: CompanyAnnouncement) => {
    setEditing(a);
    setTitle(a.title);
    setBody(a.body);
    setPinned(a.is_pinned);
    setExpiresAt(a.expires_at ? a.expires_at.slice(0, 10) : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;
    const payload = {
      title: title.trim(),
      body: body.trim(),
      is_pinned: pinned,
      expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
    };
    if (editing) {
      await updateAnnouncement({ id: editing.id, ...payload });
    } else {
      await createAnnouncement(payload);
    }
    setDialogOpen(false);
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
          {visible.length > 0 && (
            <Badge variant="secondary" className="shrink-0">{visible.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Button size="sm" onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ny melding</span>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            title={collapsed ? "Vis oppslagstavle" : "Skjul oppslagstavle"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {collapsed ? null : isLoading ? (
        <p className="text-sm text-muted-foreground">Laster meldinger...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen meldinger akkurat nå. Skriv en melding som alle ansatte ser på forsiden.
        </p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {shown.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-lg border p-3 md:p-4",
                a.is_pinned ? "border-primary/40 bg-primary/5" : "border-border bg-background"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.is_pinned && (
                      <Badge variant="default" className="gap-1">
                        <Pin className="w-3 h-3" />
                        Viktig
                      </Badge>
                    )}
                    <h4 className="font-semibold text-sm md:text-base truncate">{a.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {a.created_by_name || "Ledelsen"} · {formatDate(a.publish_at)}
                    {a.expires_at ? ` · gjelder til ${formatDate(a.expires_at)}` : ""}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      title={a.is_pinned ? "Løsne fra toppen" : "Fest øverst"}
                      onClick={() => togglePinned({ id: a.id, is_pinned: !a.is_pinned })}
                    >
                      {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" title="Rediger" onClick={() => openEdit(a)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Fjern"
                      onClick={() => deleteAnnouncement(a.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              {!readIds.includes(a.id) && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => markAsRead(a.id)}>
                    <Check className="w-4 h-4" />
                    Lest
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editing ? "Rediger melding" : "Ny melding til alle ansatte"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Tittel</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Fellesmøte fredag kl. 08:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-body">Melding</Label>
              <Textarea
                id="announcement-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Skriv meldingen her..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-expires">Gjelder til (valgfritt)</Label>
              <Input
                id="announcement-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Fest øverst</p>
                <p className="text-xs text-muted-foreground">
                  Viktige meldinger vises alltid først og forsvinner ikke når de er lest.
                </p>
              </div>
              <Switch checked={pinned} onCheckedChange={setPinned} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim() || !body.trim()}>
              {editing ? "Lagre" : "Publiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
