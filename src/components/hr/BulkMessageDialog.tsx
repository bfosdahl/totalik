import { useMemo, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useEmployeeMessages } from "@/hooks/useEmployeeMessages";
import { useAuth } from "@/contexts/AuthContext";

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkMessageDialog({ open, onOpenChange }: BulkMessageDialogProps) {
  const { users, getUserDisplayName } = useCompanyUsers();
  const { sendBulkMessage } = useEmployeeMessages();
  const { profile } = useAuth();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const candidates = useMemo(
    () => users.filter((u) => u.id !== profile?.id),
    [users, profile?.id]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((u) =>
      `${getUserDisplayName(u)} ${u.email || ""}`.toLowerCase().includes(q)
    );
  }, [candidates, search, getUserDisplayName]);

  const allSelected = visible.length > 0 && visible.every((u) => selected.includes(u.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !visible.some((u) => u.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...visible.map((u) => u.id)])]);
    }
  };

  const reset = () => {
    setSearch("");
    setSelected([]);
    setSubject("");
    setMessage("");
  };

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error("Velg minst én mottaker");
      return;
    }
    if (!message.trim()) {
      toast.error("Skriv en melding");
      return;
    }
    const recipients = candidates
      .filter((u) => selected.includes(u.id))
      .map((u) => ({ id: u.id, name: getUserDisplayName(u) }));

    try {
      await sendBulkMessage.mutateAsync({
        recipients,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      reset();
      onOpenChange(false);
    } catch {
      /* feilmelding håndteres i hooken */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Send melding til ansatte
          </DialogTitle>
          <DialogDescription>
            Velg alle eller enkelte ansatte og skriv en fritekstmelding. Alle får den i «Mine meldinger».
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mottakere ({selected.length} valgt)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? "Fjern alle" : "Velg alle"}
              </Button>
            </div>
            <Input
              placeholder="Søk etter navn eller e-post"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
              {visible.map((u) => {
                const checked = selected.includes(u.id);
                return (
                  <label key={u.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                    />
                    <span>{getUserDisplayName(u)}</span>
                  </label>
                );
              })}
              {visible.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Ingen ansatte funnet</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-subject">Emne (valgfritt)</Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="F.eks. Informasjon om neste uke"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-message">Melding</Label>
            <Textarea
              id="bulk-message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Skriv meldingen her..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sendBulkMessage.isPending}>
            {sendBulkMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send til {selected.length || 0}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
