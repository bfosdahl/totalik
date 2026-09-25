import { useEffect, useRef, useState } from "react";
import { Paperclip, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AnnouncementAttachment,
  AnnouncementInput,
  CompanyAnnouncement,
  useAnnouncementPeople,
} from "@/hooks/useCompanyAnnouncements";
import { AttachmentList, PendingFiles } from "./AttachmentList";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CompanyAnnouncement | null;
  isAdmin: boolean;
  userId?: string;
  isSaving: boolean;
  onSave: (input: AnnouncementInput) => Promise<void>;
}

export function AnnouncementEditorDialog({ open, onOpenChange, editing, isAdmin, userId, isSaving, onSave }: Props) {
  const { employees, projects, fetchCrew } = useAnnouncementPeople();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [critical, setCritical] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<AnnouncementAttachment[]>([]);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title || "");
    setBody(editing?.body || "");
    setPinned(editing?.is_pinned || false);
    setCritical(editing?.is_critical || false);
    setExpiresAt(editing?.expires_at ? editing.expires_at.slice(0, 10) : "");
    setProjectId(editing?.project_id || "none");
    setAudience(editing?.audience || "all");
    setRecipients(editing?.recipient_ids || []);
    setExisting(editing?.attachments || []);
    setFiles([]);
    setSearch("");
  }, [open, editing]);

  const handleProject = async (v: string) => {
    setProjectId(v);
    if (v !== "none") {
      const crew = await fetchCrew(v);
      if (crew.length) {
        setAudience("selected");
        setRecipients(crew);
      }
    }
  };

  const toggle = (id: string) =>
    setRecipients((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const others = employees.filter((e) => e.id !== userId);
  const filtered = others.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const canSave =
    title.trim() && body.trim() && (audience === "all" || recipients.filter((r) => r !== userId).length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({
      title: title.trim(),
      body: body.trim(),
      is_pinned: pinned,
      is_critical: critical,
      expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      project_id: projectId === "none" ? null : projectId,
      audience,
      recipient_ids: recipients,
      files,
      existing_attachments: existing,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Rediger melding" : "Ny melding"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Tittel</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Oppstart mandag kl. 07:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-body">Melding</Label>
            <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Skriv meldingen her..." />
          </div>

          <div className="space-y-2">
            <Label>Prosjekt (valgfritt)</Label>
            <Select value={projectId} onValueChange={handleProject}>
              <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
              <SelectContent className="z-[2000]">
                <SelectItem value="none">Ikke knyttet til prosjekt</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Velger du et prosjekt, hentes mannskapet som mottakere automatisk.</p>
          </div>

          <div className="space-y-2">
            <Label>Hvem skal få meldingen?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={audience === "all" ? "default" : "outline"} onClick={() => setAudience("all")}>
                Alle ansatte
              </Button>
              <Button type="button" variant={audience === "selected" ? "default" : "outline"} onClick={() => setAudience("selected")} className="gap-2">
                <Users className="h-4 w-4" /> Velg ansatte
              </Button>
            </div>
            {audience === "selected" && (
              <div className="rounded-lg border border-border p-2 space-y-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søk etter ansatt" className="h-9" />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                      <Checkbox checked={recipients.includes(e.id)} onCheckedChange={() => toggle(e.id)} />
                      {e.name}
                    </label>
                  ))}
                  {filtered.length === 0 && <p className="px-2 text-sm text-muted-foreground">Ingen treff</p>}
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  {recipients.filter((r) => r !== userId).length} valgt. Kun disse (og du) ser meldingen.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="block">Bilder og vedlegg</Label>
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
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Paperclip className="h-4 w-4" /> Legg ved
            </Button>
            {existing.length > 0 && <AttachmentList items={existing} />}
            <PendingFiles files={files} onRemove={(i) => setFiles((f) => f.filter((_, x) => x !== i))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ann-expires">Gjelder til (valgfritt)</Label>
            <Input id="ann-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Kritisk melding</p>
              <p className="text-xs text-muted-foreground">Vises med varseltrekant.</p>
            </div>
            <Switch checked={critical} onCheckedChange={setCritical} />
          </div>
          {isAdmin && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Fest øverst</p>
                <p className="text-xs text-muted-foreground">Viktige meldinger vises alltid først.</p>
              </div>
              <Switch checked={pinned} onCheckedChange={setPinned} />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={isSaving || !canSave}>
            {isSaving ? "Lagrer..." : editing ? "Lagre" : "Publiser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
