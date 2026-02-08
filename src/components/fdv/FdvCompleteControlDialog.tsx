import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FdvControl } from "@/types/fdv";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface FdvCompleteControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: FdvControl | null;
  onComplete: (status: 'ok' | 'avvik' | 'delvis_ok', findings?: string, notes?: string) => Promise<void>;
}

export function FdvCompleteControlDialog({ open, onOpenChange, control, onComplete }: FdvCompleteControlDialogProps) {
  const [status, setStatus] = useState<'ok' | 'avvik' | 'delvis_ok'>('ok');
  const [findings, setFindings] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(status, findings || undefined, notes || undefined);
      // Reset form
      setStatus('ok');
      setFindings("");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!control) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrer kontroll</DialogTitle>
          <DialogDescription>
            {control.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Resultat</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <RadioGroupItem value="ok" id="ok" />
                <Label htmlFor="ok" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">OK</p>
                    <p className="text-sm text-muted-foreground">Kontrollen ble godkjent</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <RadioGroupItem value="delvis_ok" id="delvis_ok" />
                <Label htmlFor="delvis_ok" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Delvis OK</p>
                    <p className="text-sm text-muted-foreground">Mindre funn som må følges opp</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <RadioGroupItem value="avvik" id="avvik" />
                <Label htmlFor="avvik" className="flex items-center gap-2 cursor-pointer flex-1">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Avvik</p>
                    <p className="text-sm text-muted-foreground">Kritiske funn som krever handling</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(status === 'avvik' || status === 'delvis_ok') && (
            <div className="space-y-2">
              <Label>Beskrivelse av funn *</Label>
              <Textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Beskriv hva som ble funnet..."
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notater</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuelle notater fra kontrollen..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || ((status === 'avvik' || status === 'delvis_ok') && !findings)}
          >
            {isSubmitting ? "Lagrer..." : "Registrer kontroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
