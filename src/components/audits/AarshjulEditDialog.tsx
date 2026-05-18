import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Loader2, Calendar, MoveRight, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Must match defaultActivities in HmsAarshjul
const allDefaultActivities = [
  { id: "annual-review", name: "Årlig HMS-revisjon", defaultMonths: [1], color: "bg-primary" },
  { id: "vernerunde-q1", name: "Vernerunde Q1", defaultMonths: [3], color: "bg-emerald-500" },
  { id: "vernerunde-q2", name: "Vernerunde Q2", defaultMonths: [6], color: "bg-emerald-500" },
  { id: "vernerunde-q3", name: "Vernerunde Q3", defaultMonths: [9], color: "bg-emerald-500" },
  { id: "vernerunde-q4", name: "Vernerunde Q4", defaultMonths: [12], color: "bg-emerald-500" },
  { id: "el-kontroll", name: "El-kontroll", defaultMonths: [5], color: "bg-warning" },
  { id: "brannvern", name: "Brannvernøvelse", defaultMonths: [4, 10], color: "bg-destructive" },
  { id: "fysiske-forhold", name: "Fysiske arbeidsforhold", defaultMonths: [2], color: "bg-info" },
  { id: "stoffkartotek", name: "Stoffkartotek-gjennomgang", defaultMonths: [8], color: "bg-purple-500" },
  { id: "risikovurdering", name: "Risikovurdering", defaultMonths: [11], color: "bg-orange-500" },
  { id: "hms-opplaering", name: "HMS-opplæring", defaultMonths: [1, 7], color: "bg-cyan-500" },
  { id: "medarbeidersamtaler", name: "Medarbeidersamtaler", defaultMonths: [3, 9], color: "bg-pink-500" },
];

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
  departmentId: string | null;
  monthOverrides: Record<string, number[]>;
  hiddenDefaults: string[];
  onSaved: () => void;
}

export default function AarshjulEditDialog({
  open,
  onOpenChange,
  month,
  monthName,
  companyId,
  departmentId,
  monthOverrides,
  hiddenDefaults,
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

  // Standard activity picker
  const [showStandardPicker, setShowStandardPicker] = useState(false);

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

  // Move a standard activity to this month
  const handleMoveStandardToMonth = async (activityId: string) => {
    const defaultActivity = allDefaultActivities.find((a) => a.id === activityId);
    if (!defaultActivity) return;

    const currentOverride = monthOverrides[activityId];
    const currentMonths = currentOverride || defaultActivity.defaultMonths;

    // Add this month to the activity's months (if not already there)
    if (currentMonths.includes(month)) {
      toast.info("Denne aktiviteten er allerede i denne måneden");
      return;
    }

    const newMonths = [...currentMonths, month].sort((a, b) => a - b);

    try {
      // Upsert the override
      const { error } = await supabase
        .from("company_aarshjul_default_overrides")
        .upsert(
          { company_id: companyId, activity_id: activityId, custom_months: newMonths },
          { onConflict: "company_id,activity_id" }
        );
      if (error) throw error;

      // If it was hidden, unhide it
      if (hiddenDefaults.includes(activityId)) {
        await supabase
          .from("company_aarshjul_hidden_defaults")
          .delete()
          .eq("company_id", companyId)
          .eq("activity_id", activityId);
      }

      toast.success(`${defaultActivity.name} lagt til i ${monthName}`);
      onSaved();
      setShowStandardPicker(false);
    } catch (e: any) {
      toast.error("Kunne ikke flytte aktivitet: " + (e.message || "Ukjent feil"));
    }
  };

  // Remove a standard activity from this specific month
  const handleRemoveStandardFromMonth = async (activityId: string) => {
    const defaultActivity = allDefaultActivities.find((a) => a.id === activityId);
    if (!defaultActivity) return;

    const currentOverride = monthOverrides[activityId];
    const currentMonths = currentOverride || defaultActivity.defaultMonths;
    const newMonths = currentMonths.filter((m) => m !== month);

    try {
      if (newMonths.length === 0) {
        // Hide it completely if no months left
        await supabase
          .from("company_aarshjul_hidden_defaults")
          .upsert(
            { company_id: companyId, activity_id: activityId },
            { onConflict: "company_id,activity_id" }
          );
        // Remove override if exists
        await supabase
          .from("company_aarshjul_default_overrides")
          .delete()
          .eq("company_id", companyId)
          .eq("activity_id", activityId);
      } else {
        // Update override with remaining months
        const { error } = await supabase
          .from("company_aarshjul_default_overrides")
          .upsert(
            { company_id: companyId, activity_id: activityId, custom_months: newMonths },
            { onConflict: "company_id,activity_id" }
          );
        if (error) throw error;
      }

      toast.success(`${defaultActivity.name} fjernet fra ${monthName}`);
      onSaved();
    } catch (e: any) {
      toast.error("Kunne ikke fjerne aktivitet: " + (e.message || "Ukjent feil"));
    }
  };

  // Reset a standard activity to its default months
  const handleResetToDefault = async (activityId: string) => {
    try {
      await supabase
        .from("company_aarshjul_default_overrides")
        .delete()
        .eq("company_id", companyId)
        .eq("activity_id", activityId);
      await supabase
        .from("company_aarshjul_hidden_defaults")
        .delete()
        .eq("company_id", companyId)
        .eq("activity_id", activityId);
      toast.success("Tilbakestilt til standard");
      onSaved();
    } catch {
      toast.error("Kunne ikke tilbakestille");
    }
  };

  // Which standard activities are currently in this month?
  const standardInThisMonth = allDefaultActivities.filter((a) => {
    if (hiddenDefaults.includes(a.id)) return false;
    const effectiveMonths = monthOverrides[a.id] || a.defaultMonths;
    return effectiveMonths.includes(month);
  });

  // Which standard activities are NOT in this month (available to add)?
  const standardNotInThisMonth = allDefaultActivities.filter((a) => {
    const effectiveMonths = monthOverrides[a.id] || a.defaultMonths;
    return !effectiveMonths.includes(month) || hiddenDefaults.includes(a.id);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] sm:max-h-[85vh] h-[100dvh] sm:h-auto overflow-hidden flex flex-col sm:rounded-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {monthName} – Rediger aktiviteter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Standard activities in this month */}
          {standardInThisMonth.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Standard HMS-aktiviteter
              </p>
              <div className="space-y-1.5">
                {standardInThisMonth.map((a) => {
                  const isOverridden = !!monthOverrides[a.id];
                  return (
                    <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 group">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", a.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        {isOverridden && (
                          <p className="text-[10px] text-muted-foreground">Tilpasset plassering</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {isOverridden && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Tilbakestill til standard"
                            onClick={() => handleResetToDefault(a.id)}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          title="Fjern fra denne måneden"
                          onClick={() => handleRemoveStandardFromMonth(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom activities */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Egne aktiviteter
              </p>
              <div className="space-y-1.5">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/10 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.name}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      )}
                      {a.responsible && (
                        <Badge variant="secondary" className="text-xs mt-1">{a.responsible}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
            </div>
          )}

          {/* Standard activity picker */}
          {showStandardPicker ? (
            <div className="space-y-2 p-3 rounded-lg border bg-card">
              <p className="text-sm font-medium">Legg til standard aktivitet i {monthName}</p>
              <p className="text-xs text-muted-foreground mb-2">
                Velg en aktivitet å legge til denne måneden. Den beholder sin originale funksjon.
              </p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {standardNotInThisMonth.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Alle standard-aktiviteter er allerede lagt til denne måneden.
                  </p>
                ) : (
                  standardNotInThisMonth.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleMoveStandardToMonth(a.id)}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", a.color)} />
                      <span className="text-sm flex-1">{a.name}</span>
                      <MoveRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowStandardPicker(false)}>
                Lukk
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowStandardPicker(true)}
              >
                <MoveRight className="h-4 w-4 mr-1" />
                Legg til standard aktivitet
              </Button>
            </div>
          )}

          {/* Custom activity form */}
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
              Legg til egen aktivitet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
