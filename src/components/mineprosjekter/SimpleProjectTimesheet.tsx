import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2, Loader2, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  employee_name: string;
  employee_id: string | null;
  created_at: string;
}

interface SimpleProjectTimesheetProps {
  projectId: string;
}

export function SimpleProjectTimesheet({ projectId }: SimpleProjectTimesheetProps) {
  const { profile } = useAuth();
  const { users } = useCompanyUsers();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    description: "",
    employee_id: "",
  });

  const fetchEntries = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_module2_project_time_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching time entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [projectId, profile?.company_id]);

  const handleOpenNew = () => {
    setEditingEntry(null);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      hours: "",
      description: "",
      employee_id: profile?.id || "",
    });
    setShowDialog(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      hours: entry.hours.toString(),
      description: entry.description || "",
      employee_id: entry.employee_id || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.hours || !profile?.company_id) return;

    const selectedUser = users.find((u) => u.id === formData.employee_id);
    const employeeName = selectedUser
      ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
      : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent";

    setIsSaving(true);
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("ks_module2_project_time_entries")
          .update({
            date: formData.date,
            hours: parseFloat(formData.hours),
            description: formData.description || null,
            employee_id: formData.employee_id || null,
            employee_name: employeeName,
          })
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Timeregistrering oppdatert");
      } else {
        const { error } = await supabase.from("ks_module2_project_time_entries").insert({
          project_id: projectId,
          company_id: profile.company_id,
          date: formData.date,
          hours: parseFloat(formData.hours),
          description: formData.description || null,
          employee_id: formData.employee_id || null,
          employee_name: employeeName,
        });

        if (error) throw error;
        toast.success("Timeregistrering lagret");
      }

      setShowDialog(false);
      fetchEntries();
    } catch (error) {
      console.error("Error saving time entry:", error);
      toast.error("Kunne ikke lagre timeregistrering");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("ks_module2_project_time_entries").delete().eq("id", id);

      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Timeregistrering slettet");
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast.error("Kunne ikke slette timeregistrering");
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeliste
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Totalt: <strong>{totalHours.toFixed(1)} timer</strong>
            </span>
          </div>
          <Button className="gap-2" onClick={handleOpenNew}>
            <Plus className="w-4 h-4" />
            Registrer tid
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen timer registrert</p>
              <p className="text-sm text-muted-foreground">Registrer timer brukt på prosjektet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {format(new Date(entry.date), "d. MMM", { locale: nb })}
                      </span>
                      <span className="text-primary font-semibold">{entry.hours} t</span>
                      <span className="text-sm text-muted-foreground">{entry.employee_name}</span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">{entry.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(entry)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Entry Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Rediger timeregistrering" : "Ny timeregistrering"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dato</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Timer</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="8"
                  value={formData.hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ansatt</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employee_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansatt" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse (valgfritt)</Label>
              <Textarea
                placeholder="Hva ble gjort?"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.hours}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
