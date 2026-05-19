import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Save, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAllowanceTypes, ALLOWANCE_UNIT_LABELS, AllowanceUnit, AllowanceType } from "@/hooks/useAllowanceTypes";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onBack: () => void;
}

export function AllowanceTypesSettings({ onBack }: Props) {
  const { isCompanyAdmin, isSystemAdmin } = useAuth();
  const canEdit = isCompanyAdmin || isSystemAdmin;
  const { types, isLoading, createType, updateType, deleteType } = useAllowanceTypes();

  const [editing, setEditing] = useState<AllowanceType | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllowanceType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Lønn & tilleggssatser</h1>
          <p className="text-sm text-muted-foreground">
            Definer tillegg som ansatte kan legge til på timeregistrering (diett, kilometer, reisetimer, hvilebrudd osv.).
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Ny sats
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster…</p>
      ) : types.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Ingen tilleggssatser definert.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {types.map((t) => (
            <Card key={t.id} className={!t.is_active ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.name}</span>
                    {t.is_default && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                    {!t.is_active && <Badge variant="outline" className="text-xs">Inaktiv</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.rate.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr / {ALLOWANCE_UNIT_LABELS[t.unit]}
                  </p>
                </div>
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateType(t.id, { is_active: !t.is_active })}
                      title={t.is_active ? "Deaktiver" : "Aktiver"}
                    >
                      {t.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(t)}>Endre</Button>
                    {!t.is_default && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AllowanceEditDialog
        open={creating || !!editing}
        type={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={async (vals) => {
          if (editing) await updateType(editing.id, vals);
          else await createType(vals);
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett tilleggssats?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» blir slettet. Allerede registrerte tillegg på timer beholder sats og beløp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteTarget) await deleteType(deleteTarget.id);
              setDeleteTarget(null);
            }}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AllowanceEditDialog({
  open, type, onClose, onSave,
}: {
  open: boolean;
  type: AllowanceType | null;
  onClose: () => void;
  onSave: (vals: { name: string; unit: AllowanceUnit; rate: number; is_active: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(type?.name || "");
  const [unit, setUnit] = useState<AllowanceUnit>(type?.unit || "hour");
  const [rate, setRate] = useState(type ? String(type.rate) : "0");
  const [isActive, setIsActive] = useState(type?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  // Reset when type changes
  useState(() => {
    setName(type?.name || "");
    setUnit(type?.unit || "hour");
    setRate(type ? String(type.rate) : "0");
    setIsActive(type?.is_active ?? true);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{type ? "Endre tilleggssats" : "Ny tilleggssats"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Navn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Diett innenlands" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Enhet</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as AllowanceUnit)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ALLOWANCE_UNIT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sats (kr)</Label>
              <Input type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Aktiv (vises i timeføring)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave({ name: name.trim(), unit, rate: parseFloat(rate) || 0, is_active: isActive });
              setSaving(false);
            }}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
