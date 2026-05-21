import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    user_name: string;
    entry_date: string;
    hours: number;
    description: string | null;
  } | null;
  onSave: (id: string, updates: { hours: number; description?: string }) => Promise<boolean>;
}

export function EditTimeEntryDialog({ open, onOpenChange, entry, onSave }: EditTimeEntryDialogProps) {
  const [hours, setHours] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setHours(String(entry.hours ?? ""));
      setDescription(entry.description ?? "");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
    const parsed = parseFloat(hours.replace(",", "."));
    if (isNaN(parsed) || parsed < 0 || parsed > 24) return;
    setSaving(true);
    const ok = await onSave(entry.id, { hours: parsed, description });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Rediger timeregistrering</DialogTitle>
          <DialogDescription>
            {entry ? `${entry.user_name} – ${entry.entry_date}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-hours">Timer</Label>
            <Input
              id="edit-hours"
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-muted-foreground">
              Maks 24 timer per døgn. Bruk 0,25 i økninger.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Beskrivelse</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Lagrer..." : "Lagre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
