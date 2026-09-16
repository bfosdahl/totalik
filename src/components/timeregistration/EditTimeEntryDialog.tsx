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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useMaterialTypes,
  MATERIAL_UNITS,
  MATERIAL_UNIT_LABELS,
  type MaterialUnit,
} from "@/hooks/useMaterialTypes";
import { t } from "@/i18n/t";

interface MaterialRow {
  id: string;
  typeId: string;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: number;
}

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
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const { types: materialTypes } = useMaterialTypes({ onlyActive: true });

  useEffect(() => {
    if (entry) {
      setHours(String(entry.hours ?? ""));
      setDescription(entry.description ?? "");
    }
  }, [entry]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !entry) {
        setMaterialRows([]);
        return;
      }
      const { data, error } = await supabase
        .from("time_entry_materials")
        .select("id, material_type_id, name, unit, quantity, unit_price")
        .eq("time_entry_id", entry.id);
      if (error || cancelled) return;
      setMaterialRows(
        (data || []).map((m) => ({
          id: m.id,
          typeId: m.material_type_id || "",
          name: m.name,
          unit: m.unit || "stk",
          quantity: String(Number(m.quantity)),
          unitPrice: Number(m.unit_price || 0),
        }))
      );
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, entry]);

  const addMaterial = () => {
    setMaterialRows((rows) => [
      ...rows,
      { id: `new-${Date.now()}-${rows.length}`, typeId: "", name: "", unit: "stk", quantity: "1", unitPrice: 0 },
    ]);
  };

  const saveMaterials = async (timeEntryId: string) => {
    const rows = materialRows
      .map((r) => {
        const mt = materialTypes.find((x) => x.id === r.typeId);
        const name = (mt?.name ?? r.name).trim();
        const qty = parseFloat(String(r.quantity).replace(",", "."));
        if (!name || isNaN(qty) || qty <= 0) return null;
        const price = Number(mt?.unit_price ?? r.unitPrice ?? 0);
        return {
          time_entry_id: timeEntryId,
          material_type_id: mt?.id ?? null,
          name,
          unit: r.unit || mt?.unit || "stk",
          quantity: qty,
          unit_price: price,
          amount: Number((price * qty).toFixed(2)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const { error: delErr } = await supabase
      .from("time_entry_materials")
      .delete()
      .eq("time_entry_id", timeEntryId);
    if (delErr) {
      toast.error("Kunne ikke oppdatere materialforbruk");
      return false;
    }
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("time_entry_materials").insert(rows);
      if (insErr) {
        toast.error("Kunne ikke lagre materialforbruk");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!entry) return;
    const parsed = parseFloat(hours.replace(",", "."));
    if (isNaN(parsed) || parsed < 0 || parsed > 24) return;
    setSaving(true);
    const matOk = await saveMaterials(entry.id);
    const ok = await onSave(entry.id, { hours: parsed, description });
    setSaving(false);
    if (ok && matOk) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("auto.rediger_timeregistrering")}</DialogTitle>
          <DialogDescription>
            {entry ? `${entry.user_name} – ${entry.entry_date}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-hours">{t("auto.timer")}</Label>
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
              {t("auto.maks_24_timer_per_doegn_bruk_0_25_i_oekn")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">{t("auto.beskrivelse")}</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Materialforbruk */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Materialforbruk
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="gap-1">
                <Plus className="h-3 w-3" /> Legg til
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Valgfritt. Legg til eller endre materialer brukt denne dagen.
            </p>

            {materialRows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_90px_auto] gap-2 items-start bg-muted/30 p-2 rounded-md">
                {materialTypes.length > 0 ? (
                  <Select
                    value={row.typeId || "__custom__"}
                    onValueChange={(v) =>
                      setMaterialRows((rows) =>
                        rows.map((r) => {
                          if (r.id !== row.id) return r;
                          if (v === "__custom__") return { ...r, typeId: "", name: "" };
                          const mt = materialTypes.find((x) => x.id === v);
                          return {
                            ...r,
                            typeId: v,
                            name: mt?.name ?? "",
                            unit: mt?.unit ?? r.unit,
                            unitPrice: Number(mt?.unit_price ?? 0),
                          };
                        })
                      )
                    }
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="Velg material" /></SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((mt) => (
                        <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Annet (skriv selv)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-9"
                    placeholder="F.eks. sveisetråd"
                    value={row.name}
                    onChange={(e) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
                    }
                  />
                )}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-9"
                  value={row.quantity}
                  onChange={(e) =>
                    setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value } : r)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setMaterialRows((rows) => rows.filter((r) => r.id !== row.id))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>

                {materialTypes.length > 0 && !row.typeId && (
                  <Input
                    className="h-9 col-span-3"
                    placeholder="Navn på material"
                    value={row.name}
                    onChange={(e) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))
                    }
                  />
                )}

                <div className="col-span-3">
                  <Select
                    value={row.unit}
                    onValueChange={(v) =>
                      setMaterialRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, unit: v } : r)))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u as MaterialUnit]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("auto.avbryt")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Lagrer..." : "Lagre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
