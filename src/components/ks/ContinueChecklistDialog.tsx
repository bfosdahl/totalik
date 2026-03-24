import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChecklistItem {
  id?: string;
  text: string;
  value: boolean | string | null;
  comment?: string;
  type?: string;
  required?: boolean;
  photos?: string[];
}

interface ContinueChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: {
    id: string;
    title: string;
    template_name: string;
    checklist_items: ChecklistItem[];
    status: string;
  };
  onSaved?: () => void;
}

type ItemResponse = {
  status: "ok" | "not_ok" | "na";
  comment: string;
};

function mapValueToStatus(value: boolean | string | null): "ok" | "not_ok" | "na" {
  if (value === true || value === "yes") return "ok";
  if (value === false || value === "no") return "not_ok";
  return "na";
}

export function ContinueChecklistDialog({ open, onOpenChange, checklist, onSaved }: ContinueChecklistDialogProps) {
  const items = (checklist.checklist_items || []) as ChecklistItem[];

  const [responses, setResponses] = useState<ItemResponse[]>(
    items.map(item => ({
      status: mapValueToStatus(item.value),
      comment: item.comment || "",
    }))
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setResponses(
        items.map(item => ({
          status: mapValueToStatus(item.value),
          comment: item.comment || "",
        }))
      );
    }
  }, [open, checklist.id]);

  const updateResponse = (index: number, field: keyof ItemResponse, value: string) => {
    setResponses(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const filledCount = responses.filter(r => r.status !== "na").length;
  const progressPercent = Math.round((filledCount / items.length) * 100);

  const handleSave = async (status: "in_progress" | "completed") => {
    setIsSaving(true);
    try {
      const updatedItems = items.map((item, idx) => ({
        ...item,
        value: responses[idx].status === "ok" ? true : responses[idx].status === "not_ok" ? false : null,
        comment: responses[idx].comment || undefined,
      }));

      const finalProgress = status === "completed" ? 100 : progressPercent;

      const { error } = await (supabase
        .from("ks_module2_checklists" as any)
        .update({
          checklist_items: updatedItems,
          status,
          progress_percent: finalProgress,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", checklist.id) as any);

      if (error) throw error;

      toast.success(status === "completed" ? "Sjekkliste fullført!" : "Endringer lagret");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error updating checklist:", error);
      toast.error("Kunne ikke lagre endringer");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <Check className="h-4 w-4 text-green-500" />;
      case "not_ok": return <X className="h-4 w-4 text-destructive" />;
      case "na": return <Minus className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{checklist.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mal: {checklist.template_name}</span>
            <span>•</span>
            <Badge variant="secondary">{progressPercent}% utfylt</Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <Label className="text-sm font-medium">
                {index + 1}. {item.text}
              </Label>

              <RadioGroup
                value={responses[index]?.status || "na"}
                onValueChange={(value) => updateResponse(index, "status", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ok" id={`c-ok-${index}`} />
                  <Label htmlFor={`c-ok-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                    {getStatusIcon("ok")} OK
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_ok" id={`c-not_ok-${index}`} />
                  <Label htmlFor={`c-not_ok-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                    {getStatusIcon("not_ok")} Avvik
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="na" id={`c-na-${index}`} />
                  <Label htmlFor={`c-na-${index}`} className="flex items-center gap-1.5 cursor-pointer">
                    {getStatusIcon("na")} N/A
                  </Label>
                </div>
              </RadioGroup>

              <Textarea
                placeholder="Kommentar (valgfritt)"
                value={responses[index]?.comment || ""}
                onChange={e => updateResponse(index, "comment", e.target.value)}
                className="min-h-[50px] text-sm"
              />
            </div>
          ))}

          <div className="flex gap-2 justify-end pt-4 border-t sticky bottom-0 bg-background pb-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button variant="outline" onClick={() => handleSave("in_progress")} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lagre endringer
            </Button>
            <Button onClick={() => handleSave("completed")} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Fullfør sjekkliste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
