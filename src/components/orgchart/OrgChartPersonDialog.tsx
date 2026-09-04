import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X, User } from 'lucide-react';
import UserSelect from '@/components/audits/UserSelect';
import { t } from "@/i18n/t";
import type { OrgChartNodePerson } from '@/hooks/useOrgChart';

interface OrgChartPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives every person queued in the dialog */
  onSave: (personNames: string[]) => void;
  nodeTitle: string;
  /** Persons already attached to the role */
  existingPersons?: OrgChartNodePerson[];
  onRemovePerson?: (personId: string) => void;
  isLoading?: boolean;
}

const OrgChartPersonDialog: React.FC<OrgChartPersonDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  nodeTitle,
  existingPersons = [],
  onRemovePerson,
  isLoading = false,
}) => {
  const [personName, setPersonName] = useState('');
  const [queued, setQueued] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setPersonName('');
      setQueued([]);
    }
  }, [open]);

  const addToQueue = () => {
    const name = personName.trim();
    if (!name) return;
    const alreadyAttached = existingPersons.some(
      (p) => p.person_name.toLowerCase() === name.toLowerCase()
    );
    if (!alreadyAttached && !queued.some((q) => q.toLowerCase() === name.toLowerCase())) {
      setQueued((prev) => [...prev, name]);
    }
    setPersonName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pending = personName.trim();
    const all = [...queued];
    if (
      pending &&
      !all.some((q) => q.toLowerCase() === pending.toLowerCase()) &&
      !existingPersons.some((p) => p.person_name.toLowerCase() === pending.toLowerCase())
    ) {
      all.push(pending);
    }
    if (all.length === 0) return;
    onSave(all);
  };

  const canSubmit = queued.length > 0 || personName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tilknytt personer til "{nodeTitle}"</DialogTitle>
          <DialogDescription>
            Du kan legge til flere ansatte under samme rolle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {existingPersons.length > 0 && (
            <div className="space-y-2">
              <Label>Allerede tilknyttet ({existingPersons.length})</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {existingPersons.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                  >
                    <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="flex-1 truncate">{p.person_name}</span>
                    {onRemovePerson && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemovePerson(p.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="person">{t("auto.velg_person")}</Label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <UserSelect
                  value={personName}
                  onValueChange={setPersonName}
                  placeholder={t("auto.velg_fra_ansatte_eller_skriv_inn_navn")}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addToQueue}
                disabled={!personName.trim()}
                aria-label="Legg til i listen"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {queued.length > 0 && (
            <div className="space-y-2">
              <Label>Klar til å tilknyttes ({queued.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {queued.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => setQueued((prev) => prev.filter((q) => q !== name))}
                      className="hover:text-destructive"
                      aria-label={`Fjern ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tilknytt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartPersonDialog;
