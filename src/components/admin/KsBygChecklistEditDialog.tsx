import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { AdminChecklistTemplate, CHECKLIST_CATEGORIES, useAdminKsTemplates } from "@/hooks/useAdminKsTemplates";

interface Props {
  template: AdminChecklistTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KsBygChecklistEditDialog({ template, open, onOpenChange }: Props) {
  const { updateChecklistTemplate } = useAdminKsTemplates();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [trade, setTrade] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isMandatory, setIsMandatory] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Array<{ checkpoint_text: string; help_text: string }>>([]);
  const [newCheckpoint, setNewCheckpoint] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.template_name);
      setDescription(template.description || "");
      setCategory(template.category);
      setTrade(template.trade || "");
      setIsActive(template.is_active);
      setIsMandatory(template.is_mandatory ?? false);
      setCheckpoints([...template.checkpoints]);
    }
  }, [template]);

  const addCheckpoint = () => {
    if (!newCheckpoint.trim()) return;
    setCheckpoints((prev) => [...prev, { checkpoint_text: newCheckpoint.trim(), help_text: "" }]);
    setNewCheckpoint("");
  };

  const removeCheckpoint = (index: number) => {
    setCheckpoints((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCheckpointText = (index: number, text: string) => {
    setCheckpoints((prev) => prev.map((c, i) => (i === index ? { ...c, checkpoint_text: text } : c)));
  };

  const updateHelpText = (index: number, text: string) => {
    setCheckpoints((prev) => prev.map((c, i) => (i === index ? { ...c, help_text: text } : c)));
  };

  const handleSave = () => {
    if (!template) return;
    updateChecklistTemplate.mutate(
      {
        id: template.id,
        template_name: name,
        description: description || null,
        category,
        trade: trade || null,
        is_active: isActive,
        is_mandatory: isMandatory,
        checkpoints,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Rediger sjekklistemal</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
          <div className="space-y-4 pb-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Malnavn</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Beskrivelse</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fag / Trade</Label>
                <Input value={trade} onChange={(e) => setTrade(e.target.value)} className="h-9 text-sm" placeholder="F.eks. Tømrer" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-xs">Aktiv</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                <Label className="text-xs">Obligatorisk</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Sjekkpunkter ({checkpoints.length})</Label>
              <div className="space-y-1.5">
                {checkpoints.map((cp, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-md p-2">
                    <span className="text-xs text-muted-foreground mt-2 w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1 space-y-1">
                      <Input
                        value={cp.checkpoint_text}
                        onChange={(e) => updateCheckpointText(i, e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        value={cp.help_text}
                        onChange={(e) => updateHelpText(i, e.target.value)}
                        placeholder="Hjelpetekst (valgfritt)"
                        className="h-7 text-xs text-muted-foreground"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeCheckpoint(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCheckpoint}
                  onChange={(e) => setNewCheckpoint(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckpoint())}
                  placeholder="Nytt sjekkpunkt..."
                  className="h-8 text-xs"
                />
                <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={addCheckpoint}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Legg til
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={!name.trim() || updateChecklistTemplate.isPending}>
            {updateChecklistTemplate.isPending ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
