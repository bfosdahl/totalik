import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Power, PowerOff, PackagePlus } from "lucide-react";
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
  useMaterialTypes,
  MATERIAL_UNITS,
  MATERIAL_UNIT_LABELS,
  MATERIAL_SUGGESTIONS,
  MaterialType,
  MaterialUnit,
} from "@/hooks/useMaterialTypes";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onBack: () => void;
}

export function MaterialTypesSettings({ onBack }: Props) {
  const { isCompanyAdmin, isSystemAdmin } = useAuth();
  const canEdit = isCompanyAdmin || isSystemAdmin;
  const { types, isLoading, createType, updateType, deleteType } = useMaterialTypes();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialType | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<MaterialUnit>("stk");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setName("");
    setUnit("stk");
    setPrice("0");
    setOpen(true);
  };

  const openEdit = (m: MaterialType) => {
    setEditing(m);
    setName(m.name);
    setUnit((m.unit as MaterialUnit) || "stk");
    setPrice(String(m.unit_price ?? 0));
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), unit, unit_price: parseFloat(price.replace(",", ".")) || 0 };
    const ok = editing ? await updateType(editing.id, payload) : await createType(payload);
    setSaving(false);
    if (ok) setOpen(false);
  };

  const addSuggestions = async () => {
    const existing = new Set(types.map((t) => t.name.toLowerCase()));
    for (const s of MATERIAL_SUGGESTIONS) {
      if (!existing.has(s.name.toLowerCase())) {
        await createType({ name: s.name, unit: s.unit });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold">Materialliste</h1>
          <p className="text-sm text-muted-foreground">
            Materialer de ansatte kan velge når de fører timer – f.eks. sveisetråd, kappeskiver, spiker, skruer og gass.
            Ansatte kan også skrive inn materialer som ikke står i listen.
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {types.length === 0 && (
              <Button variant="outline" onClick={addSuggestions} className="gap-2">
                <PackagePlus className="h-4 w-4" /> Legg inn vanlige
              </Button>
            )}
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Nytt material
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster ...</p>
      ) : types.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ingen materialer lagt inn ennå.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {types.map((m) => (
            <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {MATERIAL_UNIT_LABELS[(m.unit as MaterialUnit)] ?? m.unit}
                    </Badge>
                    {Number(m.unit_price) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {Number(m.unit_price).toLocaleString("nb-NO")} kr/enhet
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Plus className="h-4 w-4 rotate-45 hidden" />
                      <span className="text-xs underline">Endre</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateType(m.id, { is_active: !m.is_active })}
                      title={m.is_active ? "Skjul" : "Aktiver"}
                    >
                      {m.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteType(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editing ? "Endre material" : "Nytt material"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Navn</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Sveisetråd"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Enhet</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as MaterialUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pris per enhet (valgfritt)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
