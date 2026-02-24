import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomActivity {
  id: string;
  name: string;
  description: string | null;
  responsible: string | null;
  month: number;
}

interface AarshjulEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  monthName: string;
  companyId: string;
  onSaved: () => void;
}

export default function AarshjulEditDialog({
  open,
  onOpenChange,
  month,
  monthName,
  companyId,
  onSaved,
}: AarshjulEditDialogProps) {
  const [activities, setActivities] = useState<CustomActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New activity form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");

  useEffect(() => {
    if (open && companyId) {
      fetchActivities();
    }
  }, [open, companyId, month]);

  const fetchActivities = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("company_aarshjul_activities")
      .select("*")
      .eq("company_id", companyId)
      .eq("month", month)
      .order("created_at");

    if (!error && data) {
      setActivities(data as CustomActivity[]);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setResponsible("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("company_aarshjul_activities")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            responsible: responsible.trim() || null,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Aktivitet oppdatert");
      } else {
        const { error } = await supabase
          .from("company_aarshjul_activities")
          .insert({
            company_id: companyId,
            month,
            name: name.trim(),
            description: description.trim() || null,
            responsible: responsible.trim() || null,
          });
        if (error) throw error;
        toast.success("Aktivitet lagt til");
      }
      resetForm();
      fetchActivities();
      onSaved();
    } catch (e: any) {
      toast.error("Kunne ikke lagre: " + (e.message || "Ukjent feil"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (activity: CustomActivity) => {
    setEditingId(activity.id);
    setName(activity.name);
    setDescription(activity.description || "");
    setResponsible(activity.responsible || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("company_aarshjul_activities")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette");
    } else {
      toast.success("Aktivitet slettet");
      fetchActivities();
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {monthName} – Egne aktiviteter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen egne aktiviteter for {monthName.toLowerCase()} ennå.
            </p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.name}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    )}
                    {a.responsible && (
                      <Badge variant="secondary" className="text-xs mt-1">{a.responsible}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="space-y-3 p-3 rounded-lg border bg-card">
              <div>
                <Label className="text-sm">Navn *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Sommeravslutning"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Beskrivelse</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Valgfri beskrivelse..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-sm">Ansvarlig</Label>
                <Input
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="F.eks. Daglig leder"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {editingId ? "Oppdater" : "Legg til"}
                </Button>
                <Button size="sm" variant="outline" onClick={resetForm}>
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Legg til aktivitet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
