import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";

interface MeetingTemplate {
  id: string;
  template_name: string;
  meeting_type: string;
}

interface ScheduleMeetingDialogProps {
  onCreated: () => void;
  trigger?: React.ReactNode;
}

export function ScheduleMeetingDialog({ onCreated, trigger }: ScheduleMeetingDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [meetingType, setMeetingType] = useState("medarbeidersamtale");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState<string>("none");

  useEffect(() => {
    if (open && profile?.company_id) {
      supabase
        .from("hr_meeting_templates")
        .select("id, template_name, meeting_type")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data) setTemplates(data);
        });
    }
  }, [open, profile?.company_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !selectedEmployeeId || !scheduledDate) return;

    const selectedUser = users.find((u) => u.id === selectedEmployeeId);
    if (!selectedUser) return;

    try {
      setSaving(true);
      const { error } = await supabase.from("hr_meetings").insert({
        company_id: profile.company_id,
        employee_name: getUserDisplayName(selectedUser),
        employee_id: selectedUser.id,
        meeting_type: meetingType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        location: location || null,
        notes: notes || null,
        created_by: profile.id,
        template_id: templateId !== "none" ? templateId : null,
      });

      if (error) throw error;

      toast({ title: "Suksess", description: "Samtale planlagt" });
      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast({ title: "Feil", description: "Kunne ikke planlegge samtale", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployeeId("");
    setMeetingType("medarbeidersamtale");
    setScheduledDate("");
    setScheduledTime("");
    setLocation("");
    setNotes("");
    setTemplateId("none");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Planlegg samtale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Planlegg medarbeidersamtale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ansatt *</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type samtale</Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medarbeidersamtale">Medarbeidersamtale</SelectItem>
                <SelectItem value="utviklingssamtale">Utviklingssamtale</SelectItem>
                <SelectItem value="oppfølging">Oppfølgingssamtale</SelectItem>
                <SelectItem value="prøvetid">Prøvetidssamtale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Spørsmålsmal</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg mal (valgfritt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen mal</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dato *</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Klokkeslett</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sted</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Møterom, kontor etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Notater</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuelle notater..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={saving || !selectedEmployeeId}>
              {saving ? "Lagrer..." : "Planlegg"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
